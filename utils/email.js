const nodemailer = require('nodemailer')
/**
 * In dev env, mailtrap is used for sending emails. Mailtrap doesn't actually send the email ato actual addresses, 
 * but traps them in a separate inbox so that one can see how the actual emails would look to end user
 */
const sendEmail = async options => {
    const devTransporter = {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    }
    const prodTransporter = {
        service: 'Gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    }
    const transporterOptions = process.env.NODE_ENV === 'development' ? devTransporter : prodTransporter
    //Create a transporter, define email opts, send
    const transporter = nodemailer.createTransport(transporterOptions)

    const mailOptions = {
        from: 'Zeeshan Khan <zeeshan-sender@email.io>',
        to: options.email,
        subject: options.subject,
        text: options.text,
    }

    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail