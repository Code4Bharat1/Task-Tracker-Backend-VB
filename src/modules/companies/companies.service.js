import User from "../users/user.model.js";
import Company from "./companies.model.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { sendEmail } from "../../utils/sendEmail.js";
import Departments from "../departments/departments.model.js";
function generatePassword(name) {
	const clean = name.replace(/[^a-zA-Z]/g, "").toLowerCase();
	let namePart = (clean.slice(0, 4) + "user").slice(0, 4);
	namePart = namePart.charAt(0).toUpperCase() + namePart.slice(1);
	const symbols = "@#$%";
	const numbers = "0123456789";
	const symbol = symbols[Math.floor(Math.random() * symbols.length)];
	const num1 = numbers[Math.floor(Math.random() * numbers.length)];
	const num2 = numbers[Math.floor(Math.random() * numbers.length)];
	const num3 = numbers[Math.floor(Math.random() * numbers.length)];
	return `${namePart}${symbol}${num1}${num2}${num3}`;
}

export const registerCompanyAndAdmin = async (companyName, name, email) => {
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		const password = generatePassword(name);
		const passwordHash = await bcrypt.hash(password, 10);

		const existingAdmin = await User.findOne({ email: email }).session(session);
		if (existingAdmin) {
			const error = new Error("Admin email already in use");
			error.statusCode = 409;
			throw error;
		}

		const [newCompany] = await Company.create([{ companyName }], {
			session,
		});

		const [newAdmin] = await User.create(
			[
				{
					companyId: newCompany._id,
					name: name,
					email: email,
					passwordHash,
					globalRole: "admin",
				},
			],
			{ session }
		);

		await session.commitTransaction();
		await sendEmail(
			email,
			"Admin Account Created",
			`<p>Your temporary password is: ${password}</p>`
		);
		return { company: newCompany, admin: newAdmin };
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};

export const getCompanies = async (page = 1, limit = 10) => {
	page = Math.max(1, Number(page) || 1);
	limit = Math.min(50, Number(limit) || 10);
	const skip = (page - 1) * limit;

	const [companies, total] = await Promise.all([
		Company.find().skip(skip).limit(limit).sort({ created_at: -1 }),
		Company.countDocuments(),
	]);

	return {
		data: companies,
		pagination: { total, page, pages: Math.ceil(total / limit), limit },
	};
};

export const getCompanyById = async (id) => {
	const company = await Company.findById(id);
	if (!company) {
		const error = new Error("Company not found");
		error.statusCode = 404;
		throw error;
	}
	return company;
};

export const updateCompany = async (companyId, updateData) => {
	const company = await Company.findById(companyId);
	if (!company) {
		const error = new Error("Company not found");
		error.statusCode = 404;
		throw error;
	}

	const ALLOWED = ["companyName", "status", "workingDays", "shiftStart", "shiftEnd", "logDeadlines", "defaultTaskDeadline", "missedTaskGracePeriod", "scoringRules"];
	const data = {};
	for (const key of ALLOWED) {
		if (updateData[key] !== undefined) data[key] = updateData[key];
	}

	if (!Object.keys(data).length) {
		const error = new Error("No valid fields to update");
		error.statusCode = 400;
		throw error;
	}

	return Company.findByIdAndUpdate(companyId, data, { new: true, runValidators: true });
};

export const deleteCompany = async (companyId) => {
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		await Departments.deleteMany({ companyId }).session(session);
		await User.deleteMany({ companyId }).session(session);
		await Company.findByIdAndDelete(companyId).session(session);
		await session.commitTransaction();
		return { message: "Company deleted successfully" };
	} catch (error) {
		session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};
