
import { accountSid, authToken, fromPhoneNumber, user, pass } from "../config/index.js";
import  Twilio  from "twilio";
import nodemailer from "nodemailer";

const sendSms = async ({ to, body }) => {
    if (!accountSid || !authToken || !fromPhoneNumber) {
        throw new Error("Missing Twilio credentials");
    }
    const client = new Twilio(accountSid, authToken);
    try {
        const message = await client.messages.create({
            body,
            to,
            from: fromPhoneNumber,
        });
        console.log(`Message sent with SID: ${message.sid}`);
    } catch (error) {
        console.error("Error sending SMS:", error);
        throw error;
    }
};

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: user,
        pass: pass,
    },
});

const sendEmail = async ({ userEmail, subject, text, html }) => {
    const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: userEmail,
        subject: subject,
        text: text,
        html: html,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email: ${error}`);
                reject(error);
            } else {
                console.log(`Email sent: ${info.response}`);
                resolve(info.response);
            }
        });
    });
};

export const sendMessage =  {
    sendEmail,
    sendSms
}