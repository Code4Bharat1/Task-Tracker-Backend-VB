import { checkMissedDeadlines } from "../modules/scoring/scoring.service.js";

const INTERVAL_MS = 60 * 60 * 1000; // every hour

let intervalId = null;

export function startDeadlineChecker() {
	if (intervalId) return;

	console.log("[DeadlineChecker] Started — runs every hour");

	// Run immediately on startup then every hour
	runCheck();
	intervalId = setInterval(runCheck, INTERVAL_MS);
}

export function stopDeadlineChecker() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
		console.log("[DeadlineChecker] Stopped");
	}
}

async function runCheck() {
	try {
		await checkMissedDeadlines();
	} catch (err) {
		console.error("[DeadlineChecker] Error:", err.message);
	}
}
