const sgMail = require("@sendgrid/mail");

// земаме API KEY од .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendWelcomeEmail = async (user) => {
  const msg = {
    to: user.email,
    from: {
      email: process.env.SENDGRID_FROM, // ова мора да биде верифициран sender во SendGrid
      name: "Type Rush",
    },
    subject: "Добредојде во Type Rush!",
    html: `<p>Здраво ${user.username},<br/>Добре дојде во Type Rush! Повикај ги пријателите и забавувајте се!</p>`,
  };

  await sgMail.send(msg);
};

exports.sendPasswordResetEmail = async (user, code) => {
  const msg = {
    to: user.email,
    from: {
      email: process.env.SENDGRID_FROM,
      name: "Type Rush",
    },
    subject: "Твојот код за промена на лозинка на Type Rush",
    html: `<p>Здраво ${user.username},</p>
           <p>Твојот код за промена на лозинката е: <strong>${code}</strong></p>
           <p>Внимавај, истекува за 15 минути.</p>`,
  };

  await sgMail.send(msg);
};
