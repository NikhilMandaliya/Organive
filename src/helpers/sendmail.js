const sendForgotPassMail = function (to, pass) {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to,
        from: process.env,SENDGRID_EMAIL,
        subject: 'Forgot Password',
        html: `Dear user you have requested forgot password in Halalo.<br>
        <strong>Credentials:</strong><br>
        Email:  ${to}<br>
        Password: ${pass}<br>`,
    }
    sgMail
        .send(msg)
        .then(() => console.log('Email sent & pass :' + pass))
        .catch((error) => console.error(error))
}

const sendResetLinkMail = function (to, link) {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
        to,
        from: 'nik.theappideas@gmail.com',
        subject: 'Reset Password',
        html: `<h2 style="box-sizing:border-box;margin-top:8px!important;margin-bottom:0;font-size:24px;font-weight:400!important;line-height:1.25!important;">Reset your password</h2>
        <p>Click on <a href="${link}" style="text-decoration: none;">this</a> link to reset your password.</p>
        <p>This link will expire in one hour.</p>`,
    }
    sgMail
        .send(msg)
        .then(() => console.log('Email sent'))
        .catch((error) => console.error(error))
}

module.exports = {
    sendForgotPassMail,
    sendResetLinkMail
}