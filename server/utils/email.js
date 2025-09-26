const transporter = require("./mailer");

exports.sendWelcomeEmail = async (user) => {
  await transporter.sendMail({
    from: `"Type Rush" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Добредојде во Type Rush!",
    html: `<p>Здраво ${user.username},<br/>Добре дојде во Type Rush! Повикај ги пријателите и забавувајте се!</p>`,
  });
};

exports.sendPasswordResetEmail = async (user, code) => {
  await transporter.sendMail({
    from: `"Type Rush" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: "Твојот код за промена на лозинка на Type Rush.",
    html: `<p>Здраво ${user.username},</p>
           <p>Твојот код за промена на лозинката е: <strong>${code}</strong></p>
           <p>Внимавај, истекува за 15 минути.</p>`,
  });
};
