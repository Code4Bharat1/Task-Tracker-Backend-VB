export const errorHandler = (err, req, res, next) => {
	const status = err.statusCode || 500;
	if (status === 500) {
		console.error(`[500] ${req.method} ${req.originalUrl}:`, err.message, err.stack?.split('\n')[1]);
	}
	res.status(status).json({
		error: err.message || "Internal Server Error",
	});
};
