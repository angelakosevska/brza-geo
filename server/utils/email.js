// utils/email.js
const transporter = require("./mailer");

exports.sendWelcomeEmail = async (user) => {
  await transporter.sendMail({
    from: '"Type Rush" <no-reply@typerush.mk>',
    to: user.email,
    subject: "Welcome to Type Rush!",
    html: `<p>Hi ${user.username},<br/>Welcome to Type Rush! Let's get typing! 🚀</p>`,
  });
};

exports.sendPasswordResetEmail = async (user, code) => {
  await transporter.sendMail({
    from: '"Type Rush" <no-reply@typerush.mk>',
    to: user.email,
    subject: "🔐 Your Type Rush Password Reset Code",
    html: `<p>Hi ${user.username},</p>
           <p>Your password reset code is: <strong>${code}</strong></p>
           <p>It expires in 15 minutes.</p>`,
  });
};
