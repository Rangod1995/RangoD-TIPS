// ==========================================
// server/services/emailService.js
// RangoD TIPS V7 Enterprise
// Email Service
// ==========================================

import nodemailer from "nodemailer";

// ==========================================
// TRANSPORTER
// ==========================================

const transporter =
    nodemailer.createTransport({

        host:
            process.env.EMAIL_HOST,

        port:
            Number(
                process.env.EMAIL_PORT || 587
            ),

        secure:
            String(
                process.env.EMAIL_SECURE
            ).toLowerCase() === "true",

        auth: {
            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_PASSWORD
        }
    });

// ==========================================
// VERIFY CONNECTION
// ==========================================

export async function verifyEmailConnection() {

    try {

        await transporter.verify();

        console.log(
            "[EmailService] SMTP connection ready."
        );

        return true;

    } catch (error) {

        console.error(
            "[EmailService] SMTP connection failed:",
            error?.message || error
        );

        return false;
    }
}

// ==========================================
// SEND EMAIL
// ==========================================

export async function sendEmail({
    to,
    subject,
    html,
    text
}) {

    if (!to) {
        throw new Error(
            "Email recipient is required."
        );
    }

    const result =
        await transporter.sendMail({

            from:
                process.env.EMAIL_FROM ||
                process.env.EMAIL_USER,

            to,

            subject,

            text,

            html
        });

    console.log(
        "[EmailService] Email sent:",
        result.messageId
    );

    return result;
}

// ==========================================
// PASSWORD RESET EMAIL
// ==========================================

export async function sendPasswordResetEmail(
    email,
    resetUrl
) {

    const subject =
        "Reset Your RangoD TIPS Password";

    const text = `
RangoD TIPS Password Reset

We received a request to reset the password for your RangoD TIPS account.

Click the link below to create a new password:

${resetUrl}

This link expires in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

RangoD TIPS
AI-Powered Football Predictions
`;

    const html = `
<!DOCTYPE html>

<html>
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Reset Password</title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background:#f4f7fb;
        font-family:Arial,Helvetica,sans-serif;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="padding:40px 15px;"
>

<tr>
<td align="center">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    style="
        max-width:560px;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 10px 30px rgba(0,0,0,0.08);
    "
>

<tr>
<td
    style="
        padding:30px;
        text-align:center;
        background:#0b1220;
    "
>

<h1
    style="
        margin:0;
        color:#ffffff;
        font-size:28px;
    "
>
    RangoD <span style="color:#22c55e;">TIPS</span>
</h1>

<p
    style="
        margin:8px 0 0;
        color:#b8c1d1;
        font-size:14px;
    "
>
    AI-Powered Football Predictions
</p>

</td>
</tr>

<tr>
<td style="padding:35px;">

<h2
    style="
        margin:0 0 15px;
        color:#111827;
    "
>
    Reset Your Password
</h2>

<p
    style="
        color:#4b5563;
        line-height:1.7;
    "
>
    We received a request to reset your RangoD TIPS
    account password.
</p>

<p
    style="
        color:#4b5563;
        line-height:1.7;
    "
>
    Click the button below to create a new password.
</p>

<div
    style="
        text-align:center;
        margin:30px 0;
    "
>

<a
    href="${resetUrl}"
    style="
        display:inline-block;
        padding:15px 28px;
        background:#16a34a;
        color:#ffffff;
        text-decoration:none;
        border-radius:10px;
        font-weight:bold;
        font-size:16px;
    "
>
    Reset My Password
</a>

</div>

<p
    style="
        color:#6b7280;
        font-size:14px;
        line-height:1.6;
    "
>
    This password-reset link will expire in
    <strong>15 minutes</strong>.
</p>

<p
    style="
        color:#6b7280;
        font-size:14px;
        line-height:1.6;
    "
>
    If you did not request this password reset,
    you can safely ignore this email.
</p>

</td>
</tr>

<tr>
<td
    style="
        padding:20px;
        text-align:center;
        background:#f9fafb;
        color:#9ca3af;
        font-size:12px;
    "
>
    © RangoD TIPS
</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>
`;

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
}