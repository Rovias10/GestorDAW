const sgMail = require("@sendgrid/mail");
const path = require("path");
const { send } = require("process");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, htmlcontent) => {
  const msg = {
    to: to,
    from: "villanuevaasensiorodrigo@gmail.com",
    subject: subject,
    html: htmlcontent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Correo enviado a : ${to}`);
    return true;
  } catch (error) {
    console.error("Error enviando correo");
    if (error.response) {
      console.error(error.response.body);
    } else {
      console.error(error);
    }
    return false;
  }
};

module.exports = sendEmail;
