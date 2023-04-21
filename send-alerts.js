const nodemailer = require('nodemailer');

// Configurações de e-mail
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'lucas.rangel@outlook.com',
    pass: 'VictorStone@c4680'
  }
});

// Opções de e-mail
const mailOptions = {
  from: 'lucas.rangel@outlook.com',
  to: 'lucas.rangel.s.souza@gmail.com',
  subject: 'Alerta teste',
  text: 'Corpo do e-mail'
};

// Função para enviar o e-mail
function enviarEmail() {
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('E-mail enviado: ' + info.response);
    }
  });
}

// Intervalo de tempo para enviar o e-mail
setInterval(enviarEmail, 60000); // 1 minuto = 60000 milissegundos
