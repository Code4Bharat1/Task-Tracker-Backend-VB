import mongoose from "mongoose";
import Task from "../tasks/task.model.js";
import User from "../users/user.model.js";
import Company from "../companies/companies.model.js";
import { logActivity } from "../activityLogs/activityLog.service.js";

/**
 * Apply a score delta to a user's behaviourScore and log it.
 */
export const applyScore = async ({ companyId, userId, points, reason, taskId = null }) => {
	const user = await User.findOneAndUpdate(
		{ _id: userId, companyId },
		{ $inc: { behaviourScore: points } },
		{ new: true }
	);
	if (!user) return null;

	await logActivity({
		companyId,
		userId,
		action: "SCORE_CHANGED",
		entity: "score",
		entityId: taskId || userId,
		meta: { reason, points, newScore: user.behaviourScore, taskId },
	});

	return user;
};

/**
 * Score a completed task based on deadline comparison.
 * Called when a task transitions to DONE.
 */
export const scoreTaskCompletion = async (task) => {
	if (!task || task.scoreApplied) return;

	const company = await Company.findById(task.companyId);
	if (!company) return;

	const rules = company.scoringRules || {};
	const completedAt = task.completedAt || new Date();
	const deadline = task.deadline;

	// No deadline set — award on-time points as default
	if (!deadline) {
		const contributors = (task.contributors || []).map((c) => c.userId);
		for (const uid of contributors) {
			await applyScore({
				companyId: task.companyId,
				userId: uid,
				points: rules.taskOnTime ?? 2,
				reason: "TASK_COMPLETED_NO_DEADLINE",
				taskId: task._id,
			});
		}
		await Task.updateOne({ _id: task._id }, { scoreApplied: true });
		return;
	}

	const deadlineMs = new Date(deadline).getTime();
	const completedMs = completedAt.getTime();
	const earlyThreshold = 24 * 60 * 60 * 1000; // 24 hours early

	const contributors = (task.contributors || []).map((c) => c.userId);

	for (const uid of contributors) {
		let points, reason;

		if (completedMs <= deadlineMs - earlyThreshold) {
			points = rules.taskEarly ?? 3;
			reason = "TASK_COMPLETED_EARLY";
		} else if (completedMs <= deadlineMs) {
			points = rules.taskOnTime ?? 2;
			reason = "TASK_COMPLETED_ON_TIME";
		} else {
			points = rules.taskOverdue ?? -1;
			reason = "TASK_COMPLETED_OVERDUE";
		}

		await applyScore({
			companyId: task.companyId,
			userId: uid,
			points,
			reason,
			taskId: task._id,
		});
	}

	await Task.updateOne({ _id: task._id }, { scoreApplied: true });
};

/**
 * Check all tasks across all companies for missed deadlines.
 * A task is "missed" if: deadline + gracePeriod has passed, status is not DONE/REJECTED,
 * and scoreApplied is false.
 */
export const checkMissedDeadlines = async () => {
	const companies = await Company.find({ status: "active" }).lean();

	for (const company of companies) {
		const rules = company.scoringRules || {};
		const gracePeriodHours = company.missedTaskGracePeriod ?? 24;
		const cutoff = new Date(Date.now() - gracePeriodHours * 60 * 60 * 1000);

		const missedTasks = await Task.find({
			companyId: company._id,
			scoreApplied: false,
			status: { $nin: ["DONE", "REJECTED"] },
			deadline: { $ne: null, $lt: cutoff },
		});

		for (const task of missedTasks) {
			const contributors = (task.contributors || []).map((c) => c.userId);
			for (const uid of contributors) {
				await applyScore({
					companyId: company._id,
					userId: uid,
					points: rules.taskMissed ?? -5,
					reason: "TASK_MISSED",
					taskId: task._id,
				});
			}
			await Task.updateOne({ _id: task._id }, { scoreApplied: true });
		}
	}
};

/**
 * Get leaderboard data for a department.
 */
export const getLeaderboardService = async ({ companyId, departmentId, period }) => {
	const query = { companyId, isActive: true, globalRole: "employee" };
	if (departmentId) query.departmentId = new mongoose.Types.ObjectId(departmentId);

	const users = await User.find(query)
		.select("_id name email behaviourScore departmentId profilePic")
		.lean();

	// Build task stats per user
	let dateFilter = {};
	if (period && period !== "all") {
		const days = period === "weekly" ? 7 : period === "monthly" ? 30 : period === "quarterly" ? 90 : 0;
		if (days > 0) {
			const since = new Date();
			since.setDate(since.getDate() - days);
			dateFilter = { completedAt: { $gte: since } };
		}
	}

	const taskStats = await Task.aggregate([
		{
			$match: {
				companyId: new mongoose.Types.ObjectId(companyId),
				...(dateFilter.completedAt ? { completedAt: dateFilter.completedAt } : {}),
			},
		},
		{ $unwind: "$contributors" },
		{
			$group: {
				_id: "$contributors.userId",
				tasksTotal: { $sum: 1 },
				tasksCompleted: {
					$sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] },
				},
				tasksOverdue: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ["$status", "DONE"] },
									{ $ne: ["$deadline", null] },
									{ $gt: ["$completedAt", "$deadline"] },
								],
							},
							1,
							0,
						],
					},
				},
				tasksMissed: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $ne: ["$status", "DONE"] },
									{ $ne: ["$status", "REJECTED"] },
									{ $eq: ["$scoreApplied", true] },
								],
							},
							1,
							0,
						],
					},
				},
			},
		},
	]);

	const statsMap = {};
	for (const s of taskStats) {
		statsMap[s._id.toString()] = s;
	}

	const leaderboard = users
		.map((u) => {
			const stats = statsMap[u._id.toString()] || {};
			return {
				userId: u._id,
				name: u.name,
				email: u.email,
				profilePic: u.profilePic,
				score: u.behaviourScore || 0,
				tasksCompleted: stats.tasksCompleted || 0,
				tasksTotal: stats.tasksTotal || 0,
				tasksOverdue: stats.tasksOverdue || 0,
				tasksMissed: stats.tasksMissed || 0,
			};
		})
		.sort((a, b) => b.score - a.score)
		.map((entry, idx) => ({ ...entry, rank: idx + 1 }));

	const totalScore = leaderboard.reduce((sum, e) => sum + e.score, 0);
	const departmentAverage = leaderboard.length > 0 ? Math.round((totalScore / leaderboard.length) * 10) / 10 : 0;

	return { data: leaderboard, departmentAverage };
};
