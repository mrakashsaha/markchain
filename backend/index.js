const express = require('express')
const cors = require('cors');
const nodemailer = require("nodemailer");
require('@dotenvx/dotenvx').config()
const app = express()
const port = process.env.PORT || 5000;


// Middlewires
app.use(cors());
app.use(express.json());


// NodeMailer Functionalitis
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "mr.akashsaha@gmail.com",
        pass: `${process.env.appPassword}`
    }
});


async function sendEmailToStudent(toEmail, subject, message) {
    const mailOptions = {
        from: '"University Admin" <mr.akashsaha@gmail.com>',
        to: toEmail,
        subject: subject,
        html:
            `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f6f8; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                <div style="background-color: #002855; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">Welcome to Our University</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Dear Student,</p>
                    <p>We are pleased to inform you that your  <strong>MarkChain</strong> account has been successfully created.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #ddd;">
                        <p style="margin: 0;"><strong>Login Email:</strong> ${message.studentEmail}</p>
                        <p style="margin: 0;"><strong>Default Password:</strong> ${message.defaultPassword}</p>
                    </div>
                    
                    <p><em>Please log in to the portal using the credentials above and you may change your password.</em></p>
                    
                    <a href="http://localhost:5173/" 
                    style="display: inline-block; padding: 12px 20px; background-color: #002855; color: #ffffff; text-decoration: none; border-radius: 4px; margin-top: 10px;">
                    Go to Portal
                    </a>
                    
                    <p style="margin-top: 20px;">If you face any issues, please contact our IT support at 
                    <a href="mailto:mr.akashsaha@gmail.com">support@youruniversity.com</a>.
                    </p>
                </div>
                <div style="background-color: #002855; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    © ${new Date().getFullYear()} Southeast University. All rights reserved.
                </div>
            </div>
        </div>
        
        `

    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info.response;
    } catch (error) {
        return error.responseCode;
    }
}



// Send Email to Student by Post Method
app.post("/sendEmail", async (req, res) => {
    try {
        const result = await sendEmailToStudent(
            req.body.userEmail,
            "Your University Portal Login Credentials",
            {
                studentEmail: req.body.userEmail,
                defaultPassword: req.body.defaultPassword
            }
        );

        // If we got here, sendEmail() didn't throw an error
        if (result.toString().slice(0, 3) == 250) {
            res.send({ sucess: true, message: "Login Credentials sent to email successfully" });
        }

        else {
            res.send({ sucess: false, message: "Failed to send Login Credentials in your email" });
        }

    } catch (error) {
        console.log(error)
        res.send({ sucess: false, message: "Failed to send Login Credentials in your email" });
    }
});

// ======================================




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
