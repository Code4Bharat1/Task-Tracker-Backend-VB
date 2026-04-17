import Report from "./reports.model.js";

export async function createReport(req, res) {
	try {
		const { types, projectId, date, notes, clientResponse, weeklyIncluded, monthlyIncluded } = req.body;
		const report = await Report.create({
			types, projectId, date, notes, clientResponse,
			weeklyIncluded: !!weeklyIncluded, monthlyIncluded: !!monthlyIncluded,
			createdBy: req.user._id,
		});
		res.status(201).json({ success: true, data: report });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function getReports(req, res) {
	try {
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
		const { types, projectId, date, notes, clientResponse, weeklyIncluded, monthlyIncluded } = req.body;
		const report = await Report.findByIdAndUpdate(
			req.params.id,
			{ types, projectId, date, notes, clientResponse,
			  weeklyIncluded: !!weeklyIncluded, monthlyIncluded: !!monthlyIncluded },
			{ new: true }
		).lean();
		res.json({ success: true, data: report });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function deleteReport(req, res) {
	try {
		await Report.findByIdAndDelete(req.params.id);
		res.json({ success: true });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

export async function getMyReports(req, res) {
	try {
		const reports = await Report.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).lean();
		res.json({ success: true, data: reports });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}
