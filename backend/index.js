const express = require('express')
const cors = require('cors');
const nodemailer = require("nodemailer");
const crypto = require('crypto');
require('@dotenvx/dotenvx').config()
const app = express()
const port = process.env.PORT || 5000;


// Middlewires
app.use(cors());
app.use(express.json());


// Helper: base64 helpers
const toB64 = (buf) => buf.toString('base64');
const fromB64 = (str) => Buffer.from(str, 'base64');


// Necessary Functions 

function generateRSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // RSA key size (2048 recommended)
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'

        }
    });
    return { publicKey, privateKey };
}


app.get('/generate-keys', (req, res) => {
    try {
        const { publicKey, privateKey } = generateRSAKeyPair();
        res.json({
            algorithm: "RSA-2048",
            publicKey,
            privateKey
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate RSA key pair", details: err.message });
    }
});



// app.post('/encrypt', async (req, res) => {
//     try {
//         const { data, recipientPublicKey } = req.body;

//         if (!data || !recipientPublicKey) {
//             return res.status(400).json({ error: 'Missing "data" or "recipientPublicKey" in request body.' });
//         }

//         // 1) Prepare plaintext (stringify JSON)
//         const plaintext = Buffer.from(JSON.stringify(data), 'utf8');

//         // 2) Generate random AES-256-GCM key and IV
//         const aesKey = crypto.randomBytes(32); // 256-bit
//         const iv = crypto.randomBytes(12);     // 96-bit recommended for GCM

//         // 3) Encrypt with AES-256-GCM
//         const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
//         const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
//         const authTag = cipher.getAuthTag();

//         // 4) Encrypt AES key with recipient's RSA public key (OAEP + SHA-256)
//         // recipientPublicKey must be a PEM string (-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----)
//         const encryptedKey = crypto.publicEncrypt(
//             {
//                 key: recipientPublicKey,
//                 padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//                 oaepHash: 'sha256'
//             },
//             aesKey
//         );

//         // 5) Return base64 encoded pieces
//         return res.json({
//             algorithm: 'AES-256-GCM + RSA-OAEP(SHA-256)',
//             ciphertext: toB64(encrypted),
//             encryptedKey: toB64(encryptedKey),
//             iv: toB64(iv),
//             authTag: toB64(authTag),
//             plaintextLength: plaintext.length
//         });
//     } catch (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Encryption failed', details: err.message });
//     }
// });




app.post('/decrypt', (req, res) => {
    try {
        const { encryptedKey, iv, authTag, ciphertext, recipientPrivateKey } = req.body;

        if (!encryptedKey || !iv || !authTag || !ciphertext || !recipientPrivateKey) {
            return res.status(400).json({
                error: 'Missing required fields. Need encryptedKey, iv, authTag, ciphertext, recipientPrivateKey.'
            });
        }

        // 1) Convert base64 to Buffers
        const encKeyBuf = fromB64(encryptedKey);
        const ivBuf = fromB64(iv);
        const tagBuf = fromB64(authTag);
        const cipherBuf = fromB64(ciphertext);

        // 2) RSA decrypt AES key
        const aesKey = crypto.privateDecrypt(
            {
                key: recipientPrivateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256'
            },
            encKeyBuf
        );

        // 3) AES-256-GCM decrypt
        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, ivBuf);
        decipher.setAuthTag(tagBuf);
        const decrypted = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);

        // 4) Parse JSON
        const jsonData = JSON.parse(decrypted.toString('utf8'));

        res.json({
            success: true,
            decryptedData: jsonData
        });
    } catch (err) {
        res.status(500).json({ error: 'Decryption failed', details: err.message });
    }
});


// Encrypt Data for Multiple / Single User
app.post('/encrypt', (req, res) => {
  try {
    const { data, recipients } = req.body;

    if (!data || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Missing data or recipients.' });
    }

    // 1) Convert JSON to string
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');

    // 2) Generate random AES key + IV
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // 3) AES-GCM encrypt
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // 4) Encrypt AES key for each recipient
    const encryptedKeys = recipients.map(r => {
      const encryptedKey = crypto.publicEncrypt(
        {
          key: r.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        aesKey
      );
      return { recipientId: r.id, encryptedKey: encryptedKey.toString('base64') };
    });

    // 5) Send encrypted package
    res.json({
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encryptedKeys
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Encryption failed', details: err.message });
  }
});






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
