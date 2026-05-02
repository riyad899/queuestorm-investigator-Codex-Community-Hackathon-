/* eslint-disable @typescript-eslint/no-explicit-any */
import status from "http-status";
import nodemailer from "nodemailer";
import { envVars } from "../../config/env.js";
import AppError from "../errorHelpers/appError.js";

const transporter = nodemailer.createTransport({
    host : envVars.EMAIL_SENDER.SMTP_HOST,
    secure: true,
    auth: {
        user: envVars.EMAIL_SENDER.SMTP_USER,
        pass: envVars.EMAIL_SENDER.SMTP_PASS
    },
    port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
    connectionTimeout: 3_000,
    greetingTimeout: 3_000,
    socketTimeout: 3_000,
})

interface SendEmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType: string;
    }[]
}

export const sendEmail = async ({subject, html, text, to, attachments} : SendEmailOptions) => {
    try {
        // Simple email without EJS - Frontend handles template
        const sendMailPromise = transporter.sendMail({
            from: envVars.EMAIL_SENDER.SMTP_FROM,
            to : to,
            subject : subject,
            html : html || text,
            text : text,
            attachments: attachments?.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                contentType: attachment.contentType,
            }))
        })

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new AppError("Email sending timed out", status.GATEWAY_TIMEOUT)), 3_000);
        });

        const info = await Promise.race([sendMailPromise, timeoutPromise]) as Awaited<typeof sendMailPromise>;

        console.log(`✅ Email sent to ${to} : ${info.messageId}`);
    } catch (error : any) {
        console.log("❌ Email Sending Error", error.message);
        return;
    }
}
