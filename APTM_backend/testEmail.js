import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const testEmail = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // your app password
      },
    });

    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // send to yourself
      subject: "Test Email from Nodemailer",
      text: "✅ If you see this, your Gmail credentials work!",
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

testEmail();
