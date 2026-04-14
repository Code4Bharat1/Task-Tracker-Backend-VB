import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import companiesRoutes from "./modules/companies/companies.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import departmentRoutes from "./modules/departments/departments.route.js";
import userRoutes from "./modules/users/user.routes.js";
import projectRoutes from "./modules/projects/projects.routes.js";
import projectMemberRoutes from "./modules/projectMember/projectMember.routes.js";
import projectReviewRoutes from "./modules/projectReview/projectReview.routes.js";
import bugRoutes from "./modules/bugs/bugs.routes.js";
import moduleRoutes from "./modules/modules/module.routes.js";
import moduleAssignmentRoutes from "./modules/moduleAssignments/moduleAssignment.routes.js";
import dailyLogRoutes from "./modules/dailyLog/dailyLog.routes.js";
import ktDocumentRoutes from "./modules/ktDocuments/ktDocument.routes.js";
import activityLogRoutes from "./modules/activityLogs/activityLog.routes.js";
import sessionRoutes from "./modules/session/session.routes.js";
import featureFlagRoutes from "./modules/featureFlags/featureFlag.routes.js";
import moduleReviewRoutes from "./modules/moduleReviews/moduleReview.routes.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: "https://task.nexcorealliance.com/", credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

await connectDB();

app.get("/", (_, res) => {
	res.send("Task Tracker backend is up & running\n");
});

app.use("/api/v1/companies", companiesRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/project-members", projectMemberRoutes);
app.use("/api/v1/project-review", projectReviewRoutes);
app.use("/api/v1/bugs", bugRoutes);
app.use("/api/v1/modules", moduleRoutes);
app.use("/api/v1/module-assignments", moduleAssignmentRoutes);
app.use("/api/v1/daily-logs", dailyLogRoutes);
app.use("/api/v1/kt-documents", ktDocumentRoutes);
app.use("/api/v1/activity-logs", activityLogRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/feature-flags", featureFlagRoutes);
app.use("/api/v1/module-reviews", moduleReviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
	console.log(`Server is listening on ${PORT}`);
});

app.use(errorHandler);
