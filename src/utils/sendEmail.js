import { transporter } from "./mailer.js";

export const sendEmail = async (to, subject, html) => {
	await transporter.sendMail({
		from: `"Task Tracker" <${process.env.SMTP_USER}>`,
		to,
		subject,
		html,
	});
};
