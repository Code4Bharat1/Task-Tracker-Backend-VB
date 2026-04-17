import Report from "./reports.model.js";

export async function createReport(req, res) {
	try {
		const { types, projectId, date, notes, clientResponse, weeklyIncluded, monthlyIncluded } = req.body;
		const report = await Report.create({
			types, projectId, date, notes, clientResponse,
			weeklyIncluded: !!weeklyIncluded, monthlyIncluded: !!monthlyIncluded,
			createdBy: req.userId,
		});
		res.status(201).json({ success: true, data: report });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function getReports(req, res) {
	try {
		// Scope to company via createdBy users — simpler: just return all for now, scoped by companyId via join
		const reports = await Report.find().sort({ createdAt: -1 }).lean();
		res.json({ success: true, data: reports });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function getReportById(req, res) {
	try {
		const report = await Report.findById(req.params.id).lean();
		if (!report) return res.status(404).json({ success: false, message: "Not found" });
		res.json({ success: true, data: report });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function updateReport(req, res) {
	try {
		const report = await Report.findById(req.params.id);
		if (!report) return res.status(404).json({ success: false, message: "Not found" });

		// Only owner or admin/dept-head can update
		const role = req.role;
		const isOwner = report.createdBy?.toString() === req.userId;
		const isPrivileged = ["admin", "department_head", "lead"].includes(role);
		if (!isOwner && !isPrivileged) {
			return res.status(403).json({ success: false, message: "Not authorized" });
		}

		const { types, projectId, date, notes, clientResponse, weeklyIncluded, monthlyIncluded } = req.body;
		const updated = await Report.findByIdAndUpdate(
			req.params.id,
			{ types, projectId, date, notes, clientResponse,
			  weeklyIncluded: weeklyIncluded !== undefined ? !!weeklyIncluded : report.weeklyIncluded,
			  monthlyIncluded: monthlyIncluded !== undefined ? !!monthlyIncluded : report.monthlyIncluded },
			{ new: true }
		).lean();
		res.json({ success: true, data: updated });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function deleteReport(req, res) {
	try {
		const report = await Report.findById(req.params.id);
		if (!report) return res.status(404).json({ success: false, message: "Not found" });

		const role = req.role;
		const isOwner = report.createdBy?.toString() === req.userId;
		const isPrivileged = ["admin", "department_head", "lead"].includes(role);
		if (!isOwner && !isPrivileged) {
			return res.status(403).json({ success: false, message: "Not authorized" });
		}

		await Report.findByIdAndDelete(req.params.id);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function getMyReports(req, res) {
	try {
		const reports = await Report.find({ createdBy: req.userId }).sort({ createdAt: -1 }).lean();
		res.json({ success: true, data: reports });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}
