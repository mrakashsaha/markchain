const express = require('express')
const cors = require('cors');
const nodemailer = require("nodemailer");
const crypto = require('crypto');
require('@dotenvx/dotenvx').config()
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// ---- IPFS helpers ----
let ipfsClient;
async function getIpfs(opts = {}) {
    if (!ipfsClient) {
        const { create } = await import('kubo-rpc-client');
        ipfsClient = create({
            url: process.env.IPFS_RPC_URL || 'http://127.0.0.1:5001',
            ...opts,
        });
    }
    return ipfsClient;
}


async function uploadEnvelope(envelope, ipfsOrOpts) {

    const ipfs = ipfsOrOpts && ipfsOrOpts.add ? ipfsOrOpts : await getIpfs(ipfsOrOpts || {});
    const { cid } = await ipfs.add(JSON.stringify(envelope), { pin: true, cidVersion: 1 });
    return cid.toString();
}

async function getEnvelope(cid, ipfsOrOpts) {
    const ipfs = ipfsOrOpts && ipfsOrOpts.cat ? ipfsOrOpts : await getIpfs(ipfsOrOpts || {});
    const chunks = [];
    for await (const chunk of ipfs.cat(cid)) chunks.push(chunk);
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}



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
app.post('/encrypt', async (req, res) => {
    try {
        const { data, recipients } = req.body;

        if (!data || !recipients || recipients.length === 0) {
            return res.status(400).json({ error: 'Missing data or recipients.' });
        }

        console.log(data);

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

        // 5) Send encrypted package to IPFS

        const encryptedPackage = {
            ciphertext: ciphertext.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            encryptedKeys
        }

        const ipfs = await getIpfs();
        const cid = await uploadEnvelope(encryptedPackage, ipfs);

        return res.json({ cid });


        // console.log(encryptedPackage);



        // res.json(encryptedPackage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Encryption failed', details: err.message });
    }
});



app.get("/ipfsData", async (req, res) => {

    try {
        const cid = req.query.cid;
        const ipfs = await getIpfs();
        const envelope = await getEnvelope(cid, ipfs);
        return res.json(envelope);
    }
    catch (err) {
        console.error('Get envelope error:', err);
        return res.status(404).json({ error: 'Failed to fetch envelope', details: err.message })
    }
})


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
            res.send({ success: true, message: "Login Credentials sent to email successfully" });
        }

        else {
            res.send({ success: false, message: "Failed to send Login Credentials in your email" });
        }

    } catch (error) {
        console.log(error)
        res.send({ success: false, message: "Failed to send Login Credentials in your email" });
    }
});

// ======================================

// MondoDB Related Start ========================================
const uri = `mongodb+srv://${process.env.dbUser}:${process.env.dbPass}@cluster0.r76srbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const usersCollection = client.db("markChainDB").collection("users");
const semestersCollection = client.db("markChainDB").collection("semesters");
const coursesCollection = client.db("markChainDB").collection("courses");
const assignedCoursesCollection = client.db("markChainDB").collection("assignedCourses");
const enrollmentCollection = client.db("markChainDB").collection("enrollment");


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Geting loged in userinformatin
        app.get("/userInfo", async (req, res) => {
            // Convert all query keys and values to lowercase
            const lowerQuery = {};
            for (const [key, value] of Object.entries(req.query)) {
                lowerQuery[key.toLowerCase()] = String(value).toLowerCase();
            }
            // Example: wallet -> lowercase walletAddress
            const query = { walletAddress: lowerQuery.wallet };
            const result = await usersCollection.findOne(query);
            res.send(result);
        });

        // register a new user to a system
        app.post("/register", async (req, res) => {
            try {
                const { userInfo } = req.body;

                const duplicateWallet = await usersCollection.findOne({ walletAddress: userInfo.walletAddress })

                if (duplicateWallet) {
                    res.status(400).json({ success: false, message: "This wallet address is already registered." });

                }
                else {
                    const result = await usersCollection.insertOne(userInfo);
                    res.status(200).send(result);
                }

            }
            catch (error) {
                res.status(500).json({ success: false, message: "Internal Server Error" });
                console.log(error)
            }
        })


        // Admins APIs

        app.get("/system-users", async (req, res) => {
            try {
                const { role, status, search } = req.query;
                const filter = {};

                // Role filter
                if (role) filter.role = role;

                // Status filter (pending, approved, rejected)
                if (status && status !== "all") filter.status = status;

                // Search filter (case-insensitive, matches walletAddress or name/email/phone)
                if (search) {
                    const searchRegex = new RegExp(search, "i");
                    filter.$or = [
                        { walletAddress: searchRegex },
                        { studentName: searchRegex },
                        { studentEmail: searchRegex },
                        { studentPhone: searchRegex },
                        { teacherName: searchRegex },
                        { teacherEmail: searchRegex },
                        { teacherPhone: searchRegex },
                    ];
                }

                const result = await usersCollection.find(filter).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching users:", error);
                res.status(500).json({ error: "Server error" });
            }
        });

        // manage users status approve / reject and 
        app.patch("/system-users", async (req, res) => {
            try {
                const { walletAddress, action } = req.query;

                if (!walletAddress || !action) {
                    return res
                        .status(400)
                        .json({ error: "walletAddress and action are required" });
                }

                // Define valid status updates
                let update = {};

                switch (action) {
                    case "approved":
                        update.status = "approved";
                        break;
                    case "rejected":
                        update.status = "rejected";
                        break;
                    case "pending":
                        update.status = "pending";
                        break;
                    default:
                        return res.status(400).json({ error: "Invalid action" });
                }

                const result = await usersCollection.updateOne(
                    { walletAddress },
                    { $set: update }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ error: "User not found" });
                }

                res.send(result);
            } catch (error) {
                console.error("Error updating status:", error);
                res.status(500).json({ error: "Server error" });
            }
        });


        // Store public key
        app.patch("/store-public-key", async (req, res) => {
            try {

                const { walletAddress, publicKey } = req.body;

                const result = await usersCollection.updateOne({ walletAddress }, { $set: { publicKey } })
                res.send(result);

            }
            catch {
                res.status(400).json("Server Error")
            }
        })


        // Manage semisters

        // Create new semester
        app.post("/semesters", async (req, res) => {
            try {

                const { semesterData } = req.body;
                // Check for uniqueness
                const existing = await semestersCollection.findOne({ semesterCode: semesterData.semesterCode });
                if (existing) {
                    return res.status(400).send({ error: "Semester code already exists" });
                }

                const result = await semestersCollection.insertOne(semesterData);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });


        // Get Semister
        app.get("/semesters", async (req, res) => {
            try {
                const { status, search } = req.query;
                const filter = {};

                if (status && status !== "all") filter.status = status;

                if (search) {
                    const searchRegex = new RegExp(search, "i");
                    filter.$or = [
                        { semesterName: searchRegex },
                        { semesterCode: searchRegex },
                        { description: searchRegex },
                    ];
                }

                const semesters = await semestersCollection.find(filter).toArray();
                res.send(semesters);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });

        // // update semister status
        // app.patch("/semesters", async (req, res) => {
        //     try {
        //         const id = req.query.id;
        //         const { status } = req.body;

        //         if (!id || !status) {
        //             return res.status(400).send({ error: "id and status are required" });
        //         }

        //         const result = await semestersCollection.updateOne(
        //             { _id: new ObjectId(id) },
        //             { $set: { status } }
        //         );

        //         if (result.matchedCount === 0) {
        //             return res.status(404).send({ error: "Semester not found" });
        //         }

        //         res.send(result);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send({ error: "Server error" });
        //     }
        // });



        app.patch("/semesters", async (req, res) => {
            try {
                const id = req.query.id;
                const { status } = req.body;

                if (!id || !status) {
                    return res.status(400).send({ error: "id and status are required" });
                }

                // If trying to set a semester as "running", ensure no other running semester exists
                if (status === "running") {
                    const alreadyRunning = await semestersCollection.findOne({
                        status: "running",
                        _id: { $ne: new ObjectId(id) } // exclude the same one being updated
                    });

                    if (alreadyRunning) {
                        return res.status(400).send({
                            error: `Another semester (${alreadyRunning.semesterName} ${alreadyRunning.year}) is already running. Please complete it first.`
                        });
                    }
                }

                // Proceed with update
                const result = await semestersCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { status } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).send({ error: "Semester not found" });
                }

                res.send(result);

            } catch (error) {
                console.error("Error updating semester:", error);
                res.status(500).send({ error: "Server error" });
            }
        });



        // delete a semister 
        app.delete("/semesters", async (req, res) => {
            try {
                const id = req.query.id;

                if (!id) {
                    return res.status(400).send({ error: "id is required" });
                }

                const result = await semestersCollection.deleteOne({
                    _id: new ObjectId(id),
                });

                if (result.deletedCount === 0) {
                    return res.status(404).send({ error: "Semester not found" });
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });



        // Manage Course\
        app.get("/courses", async (req, res) => {
            try {
                const { search } = req.query;
                const filter = {};

                if (search) {
                    const regex = new RegExp(search, "i");
                    filter.$or = [
                        { courseCode: regex },
                        { courseTitle: regex },
                        { department: regex },
                    ];
                }

                const result = await coursesCollection.find(filter).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });

        // ✅ POST
        app.post("/courses", async (req, res) => {
            try {
                const { courseData } = req.body;

                courseData.credit = Number(courseData.credit);
                courseData.createdAt = new Date();

                const existing = await coursesCollection.findOne({ courseCode: courseData.courseCode });
                if (existing) {
                    return res.status(400).send({ error: "Course code already exists" });
                }

                const result = await coursesCollection.insertOne(courseData);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });

        // PATCH
        app.patch("/courses", async (req, res) => {
            try {
                const id = req.query.id;
                const updateData = req.body;
                if (updateData.credit) updateData.credit = Number(updateData.credit);

                const result = await coursesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });

        // ✅ DELETE
        app.delete("/courses", async (req, res) => {
            try {
                const id = req.query.id;
                const result = await coursesCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server error" });
            }
        });



        // Assigned course==========================
        app.post("/assignedCourses", async (req, res) => {
            try {
                const { courseData } = req.body;
                // Prevent duplicate assignment of the same course to same teacher in same semester
                const exists = await assignedCoursesCollection.findOne({
                    courseCode: courseData.courseCode,
                    teacherWallet: courseData.teacherWallet,
                    semesterCode: courseData.semesterCode,
                });

                if (exists) {
                    return res.status(400).send({ error: "This course is already assigned to this teacher for this semester" });
                }

                const result = await assignedCoursesCollection.insertOne({
                    ...courseData,
                    isOffered: false,
                    studentLimit: null,
                    assignedAt: new Date().toISOString(),
                });

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server Error" });
            }
        });

        // ✅ GET — Fetch assigned courses (supports filter & search)
        app.get("/assignedCourses", async (req, res) => {
            try {
                const { department, semesterCode, search } = req.query;

                const match = {};
                if (department && department !== "all") match["courseInfo.department"] = department;
                if (semesterCode && semesterCode !== "all") match["semesterCode"] = semesterCode;

                if (search) {
                    match["$or"] = [
                        { "courseInfo.courseTitle": { $regex: search, $options: "i" } },
                        { "teacherInfo.teacherName": { $regex: search, $options: "i" } }
                    ];
                }

                const assignedCourses = await assignedCoursesCollection.aggregate([
                    {
                        $lookup: {
                            from: "courses",
                            localField: "courseCode",
                            foreignField: "courseCode",
                            as: "courseInfo",
                        },
                    },
                    { $unwind: "$courseInfo" },
                    {
                        $lookup: {
                            from: "users",
                            localField: "teacherWallet",
                            foreignField: "walletAddress",
                            as: "teacherInfo",
                        },
                    },
                    { $unwind: "$teacherInfo" },
                    {
                        $lookup: {
                            from: "semesters",
                            localField: "semesterCode",
                            foreignField: "semesterCode",
                            as: "semesterInfo",
                        },
                    },
                    { $unwind: "$semesterInfo" },
                    { $match: match },
                    {
                        $project: {
                            _id: 1,
                            courseCode: 1,
                            semesterCode: 1,
                            isOffered: 1,
                            studentLimit: 1,
                            "courseInfo.courseTitle": 1,
                            "courseInfo.credit": 1,
                            "courseInfo.department": 1,
                            "teacherInfo.teacherName": 1,
                            "teacherInfo.walletAddress": 1,
                            "teacherInfo.teacherEmail": 1,
                            "semesterInfo.semesterName": 1,
                            "semesterInfo.year": 1,
                        },
                    },
                ]).toArray();

                res.send(assignedCourses);
            } catch (err) {
                console.error(err);
                res.status(500).send({ error: "Failed to fetch assigned courses" });
            }
        });


        // ✅ PATCH — Update assigned course (if needed)
        app.patch("/assignedCourses", async (req, res) => {
            try {
                const id = req.query.id;
                const updatedData = req.body;

                const result = await assignedCoursesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server Error" });
            }
        });

        // ✅ DELETE — Remove an assigned course
        app.delete("/assignedCourses/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await assignedCoursesCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: "Server Error" });
            }
        });




        // Student Route============================
        // Get / View offer coureses

        // app.get("/offer-courses", async (req, res) => {
        //     try {
        //         const { studentWallet, search } = req.query;

        //         if (!studentWallet) {
        //             return res.status(400).json({ message: "Student wallet is required" });
        //         }

        //         // 1. Get student info
        //         const student = await usersCollection.findOne({ walletAddress: studentWallet });
        //         if (!student) return res.status(404).json({ message: "Student not found" });

        //         const studentDept = student.department;

        //         // 2. Get running semesters
        //         const runningSemesters = await semestersCollection
        //             .find({ status: "running" })
        //             .project({ semesterCode: 1 })
        //             .toArray();

        //         const runningSemesterCodes = runningSemesters.map(s => s.semesterCode);

        //         // 3. Base aggregation pipeline
        //         const pipeline = [
        //             // Only offered courses in running semesters
        //             { $match: { isOffered: true, semesterCode: { $in: runningSemesterCodes } } },

        //             // Join with courses
        //             {
        //                 $lookup: {
        //                     from: "courses",
        //                     localField: "courseCode",
        //                     foreignField: "courseCode",
        //                     as: "courseDetails",
        //                 },
        //             },
        //             { $unwind: "$courseDetails" },

        //             // Filter by student department
        //             { $match: { "courseDetails.department": studentDept } },

        //             // Join with semesters
        //             {
        //                 $lookup: {
        //                     from: "semesters",
        //                     localField: "semesterCode",
        //                     foreignField: "semesterCode",
        //                     as: "semesterDetails",
        //                 },
        //             },
        //             { $unwind: "$semesterDetails" },

        //             // Join with users (teacher info)
        //             {
        //                 $lookup: {
        //                     from: "users",
        //                     localField: "teacherWallet",
        //                     foreignField: "walletAddress",
        //                     as: "teacherDetails",
        //                 },
        //             },
        //             { $unwind: "$teacherDetails" },

        //             // Count total enrolled students
        //             {
        //                 $lookup: {
        //                     from: "enrollment",
        //                     localField: "_id",
        //                     foreignField: "assignedCourseId",
        //                     as: "enrolledStudents",
        //                 },
        //             },

        //             // Get current student enrollment for type and status
        //             {
        //                 $lookup: {
        //                     from: "enrollment",
        //                     let: { courseId: "$_id", courseCode: "$courseCode" },
        //                     pipeline: [
        //                         {
        //                             $match: {
        //                                 $expr: {
        //                                     $and: [
        //                                         { $eq: ["$studentWallet", studentWallet] },
        //                                         { $eq: ["$courseCode", "$$courseCode"] },
        //                                     ],
        //                                 },
        //                             },
        //                         },
        //                         { $sort: { enrolledAt: -1 } }, // latest enrollment first
        //                     ],
        //                     as: "studentHistory",
        //                 },
        //             },

        //             // Add fields: enrolledCount, type, currentStatus
        //             {
        //                 $addFields: {
        //                     enrolledCount: { $size: "$enrolledStudents" },
        //                     type: {
        //                         $cond: [
        //                             {
        //                                 $gt: [
        //                                     {
        //                                         $size: {
        //                                             $filter: {
        //                                                 input: "$studentHistory",
        //                                                 as: "s",
        //                                                 cond: { $eq: ["$$s.status", "completed"] },
        //                                             },
        //                                         },
        //                                     },
        //                                     0,
        //                                 ],
        //                             },
        //                             "retake",
        //                             "regular",
        //                         ],
        //                     },
        //                     currentStatus: {
        //                         $cond: [
        //                             { $gt: [{ $size: "$studentHistory" }, 0] },
        //                             { $arrayElemAt: ["$studentHistory.status", 0] }, // latest enrollment status
        //                             null, // not enrolled
        //                         ],
        //                     },
        //                 },
        //             },
        //         ];

        //         // Optional search
        //         if (search) {
        //             pipeline.push({
        //                 $match: {
        //                     $or: [
        //                         { "courseDetails.courseTitle": { $regex: search, $options: "i" } },
        //                         { "courseDetails.courseCode": { $regex: search, $options: "i" } },
        //                         { "teacherDetails.teacherName": { $regex: search, $options: "i" } },
        //                     ],
        //                 },
        //             });
        //         }

        //         // Final projection
        //         pipeline.push({
        //             $project: {
        //                 _id: 1,
        //                 courseCode: 1,
        //                 courseTitle: "$courseDetails.courseTitle",
        //                 credit: "$courseDetails.credit",
        //                 department: "$courseDetails.department",
        //                 prerequisites: "$courseDetails.prerequisites",
        //                 description: "$courseDetails.description",
        //                 semesterCode: "$semesterDetails.semesterCode",
        //                 semesterName: "$semesterDetails.semesterName",
        //                 semesterYear: "$semesterDetails.year",
        //                 teacherWallet: "$teacherDetails.walletAddress",
        //                 teacherName: "$teacherDetails.teacherName",
        //                 teacherEmail: "$teacherDetails.teacherEmail",
        //                 teacherPhone: "$teacherDetails.teacherPhone",
        //                 designation: "$teacherDetails.designation",
        //                 studentLimit: 1,
        //                 enrolledCount: 1,
        //                 type: 1,
        //                 currentStatus: 1, // enrolled/dropped/null
        //                 assignedAt: 1,
        //             },
        //         });

        //         const offeredCourses = await assignedCoursesCollection.aggregate(pipeline).toArray();

        //         res.status(200).json(offeredCourses);
        //     } catch (err) {
        //         console.error("Error fetching offered courses:", err);
        //         res.status(500).json({ message: "Server error" });
        //     }
        // });


        // app.get("/offer-courses", async (req, res) => {
        //     try {
        //         const { studentWallet, search } = req.query;

        //         if (!studentWallet) {
        //             return res.status(400).json({ message: "Student wallet is required" });
        //         }

        //         // 1. Get student info
        //         const student = await usersCollection.findOne({ walletAddress: studentWallet });
        //         if (!student) return res.status(404).json({ message: "Student not found" });
        //         const studentDept = student.department;

        //         // 2. Get running semesters
        //         const runningSemesters = await semestersCollection
        //             .find({ status: "running" })
        //             .project({ semesterCode: 1 })
        //             .toArray();
        //         const runningSemesterCodes = runningSemesters.map(s => s.semesterCode);

        //         // If multiple running semesters, consider the first as "current"
        //         const currentSemesterCode = runningSemesterCodes[0];

        //         const pipeline = [
        //             // Only offered courses in running semesters
        //             { $match: { isOffered: true, semesterCode: { $in: runningSemesterCodes } } },

        //             // Join with courses
        //             {
        //                 $lookup: {
        //                     from: "courses",
        //                     localField: "courseCode",
        //                     foreignField: "courseCode",
        //                     as: "courseDetails",
        //                 },
        //             },
        //             { $unwind: "$courseDetails" },

        //             // Filter by student department
        //             { $match: { "courseDetails.department": studentDept } },

        //             // Join with semesters
        //             {
        //                 $lookup: {
        //                     from: "semesters",
        //                     localField: "semesterCode",
        //                     foreignField: "semesterCode",
        //                     as: "semesterDetails",
        //                 },
        //             },
        //             { $unwind: "$semesterDetails" },

        //             // Join with teacher info
        //             {
        //                 $lookup: {
        //                     from: "users",
        //                     localField: "teacherWallet",
        //                     foreignField: "walletAddress",
        //                     as: "teacherDetails",
        //                 },
        //             },
        //             { $unwind: "$teacherDetails" },

        //             // Get all student enrollments for this course (any semester)
        //             {
        //                 $lookup: {
        //                     from: "enrollment",
        //                     let: { courseCode: "$courseCode" },
        //                     pipeline: [
        //                         {
        //                             $match: {
        //                                 $expr: {
        //                                     $and: [{ $eq: ["$studentWallet", studentWallet] }, { $eq: ["$courseCode", "$$courseCode"] }],
        //                                 },
        //                             },
        //                         },
        //                     ],
        //                     as: "studentEnrollments",
        //                 },
        //             },

        //             // Add fields: type, isEnrolled, enrolledCount
        //             {
        //                 $addFields: {
        //                     enrolledCount: { $size: "$studentEnrollments" }, // total students enrolled
        //                     type: {
        //                         $cond: [
        //                             {
        //                                 $gt: [
        //                                     {
        //                                         $size: {
        //                                             $filter: {
        //                                                 input: "$studentEnrollments",
        //                                                 as: "s",
        //                                                 cond: { $ne: ["$$s.semesterCode", currentSemesterCode] }, // any previous semester
        //                                             },
        //                                         },
        //                                     },
        //                                     0,
        //                                 ],
        //                             },
        //                             "retake",
        //                             "regular",
        //                         ],
        //                     },
        //                     isEnrolled: {
        //                         $cond: [
        //                             {
        //                                 $gt: [
        //                                     {
        //                                         $size: {
        //                                             $filter: {
        //                                                 input: "$studentEnrollments",
        //                                                 as: "s",
        //                                                 cond: { $eq: ["$$s.semesterCode", currentSemesterCode] }, // current semester
        //                                             },
        //                                         },
        //                                     },
        //                                     0,
        //                                 ],
        //                             },
        //                             true,
        //                             false,
        //                         ],
        //                     },
        //                 },
        //             },
        //         ];

        //         // Optional search
        //         if (search) {
        //             pipeline.push({
        //                 $match: {
        //                     $or: [
        //                         { "courseDetails.courseTitle": { $regex: search, $options: "i" } },
        //                         { "courseDetails.courseCode": { $regex: search, $options: "i" } },
        //                         { "teacherDetails.teacherName": { $regex: search, $options: "i" } },
        //                     ],
        //                 },
        //             });
        //         }

        //         // Projection
        //         pipeline.push({
        //             $project: {
        //                 _id: 1,
        //                 courseCode: 1,
        //                 courseTitle: "$courseDetails.courseTitle",
        //                 credit: "$courseDetails.credit",
        //                 department: "$courseDetails.department",
        //                 prerequisites: "$courseDetails.prerequisites",
        //                 description: "$courseDetails.description",
        //                 semesterCode: "$semesterDetails.semesterCode",
        //                 semesterName: "$semesterDetails.semesterName",
        //                 semesterYear: "$semesterDetails.year",
        //                 teacherWallet: "$teacherDetails.walletAddress",
        //                 teacherName: "$teacherDetails.teacherName",
        //                 teacherEmail: "$teacherDetails.teacherEmail",
        //                 teacherPhone: "$teacherDetails.teacherPhone",
        //                 designation: "$teacherDetails.designation",
        //                 studentLimit: 1,
        //                 enrolledCount: 1,
        //                 type: 1,
        //                 isEnrolled: 1,
        //                 assignedAt: 1,
        //             },
        //         });

        //         const offeredCourses = await assignedCoursesCollection.aggregate(pipeline).toArray();
        //         res.status(200).json(offeredCourses);
        //     } catch (err) {
        //         console.error("Error fetching offered courses:", err);
        //         res.status(500).json({ message: "Server error" });
        //     }
        // });

        app.get("/offer-courses", async (req, res) => {
            try {
                const { studentWallet, search } = req.query;

                if (!studentWallet) {
                    return res.status(400).json({ message: "Student wallet is required" });
                }

                // 1️⃣ Get student info
                const student = await usersCollection.findOne({ walletAddress: studentWallet });
                if (!student) return res.status(404).json({ message: "Student not found" });
                const studentDept = student.department;

                // 2️⃣ Get current running semester(s)
                const runningSemesters = await semestersCollection
                    .find({ status: "running" })
                    .project({ semesterCode: 1 })
                    .toArray();

                if (runningSemesters.length === 0) {
                    return res.status(404).json({ message: "No running semester found" });
                }

                const runningSemesterCodes = runningSemesters.map((s) => s.semesterCode);
                const currentSemesterCode = runningSemesterCodes[0];

                // 3️⃣ Build aggregation pipeline
                const pipeline = [
                    // Match only offered courses in running semesters
                    { $match: { isOffered: true, semesterCode: { $in: runningSemesterCodes } } },

                    // Join with courses collection
                    {
                        $lookup: {
                            from: "courses",
                            localField: "courseCode",
                            foreignField: "courseCode",
                            as: "courseDetails",
                        },
                    },
                    { $unwind: "$courseDetails" },

                    // Match student's department
                    { $match: { "courseDetails.department": studentDept } },

                    // Join with semesters
                    {
                        $lookup: {
                            from: "semesters",
                            localField: "semesterCode",
                            foreignField: "semesterCode",
                            as: "semesterDetails",
                        },
                    },
                    { $unwind: "$semesterDetails" },

                    // Join with teacher info
                    {
                        $lookup: {
                            from: "users",
                            localField: "teacherWallet",
                            foreignField: "walletAddress",
                            as: "teacherDetails",
                        },
                    },
                    { $unwind: "$teacherDetails" },

                    // Convert _id to string to match enrollment.assignedCourseId
                    {
                        $addFields: {
                            offerIdStr: { $toString: "$_id" },
                        },
                    },

                    // Get this student's enrollment for the current offered course
                    {
                        $lookup: {
                            from: "enrollment",
                            let: { offerId: "$offerIdStr" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$studentWallet", studentWallet] },
                                                { $eq: ["$assignedCourseId", "$$offerId"] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "studentCurrentOfferEnrollment",
                        },
                    },

                    // Get all previous enrollments of this course by this student
                    {
                        $lookup: {
                            from: "enrollment",
                            let: { courseCode: "$courseCode" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ["$studentWallet", studentWallet] },
                                                { $eq: ["$courseCode", "$$courseCode"] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "studentAllCourseEnrollments",
                        },
                    },

                    // Count how many total students are enrolled in this offered course
                    {
                        $lookup: {
                            from: "enrollment",
                            localField: "offerIdStr",
                            foreignField: "assignedCourseId",
                            as: "allEnrolledStudents",
                        },
                    },

                    // Add computed fields
                    {
                        $addFields: {
                            enrolledCount: { $size: "$allEnrolledStudents" },
                            isEnrolled: {
                                $cond: [{ $gt: [{ $size: "$studentCurrentOfferEnrollment" }, 0] }, true, false],
                            },
                            type: {
                                $cond: [
                                    {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: "$studentAllCourseEnrollments",
                                                        as: "s",
                                                        cond: { $ne: ["$$s.semesterCode", currentSemesterCode] },
                                                    },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                    "retake",
                                    "regular",
                                ],
                            },
                        },
                    },
                ];

                // 🔍 Optional search filter
                if (search) {
                    pipeline.push({
                        $match: {
                            $or: [
                                { "courseDetails.courseTitle": { $regex: search, $options: "i" } },
                                { "courseDetails.courseCode": { $regex: search, $options: "i" } },
                                { "teacherDetails.teacherName": { $regex: search, $options: "i" } },
                            ],
                        },
                    });
                }

                // Final projection
                pipeline.push({
                    $project: {
                        _id: 1,
                        courseCode: 1,
                        courseTitle: "$courseDetails.courseTitle",
                        credit: "$courseDetails.credit",
                        department: "$courseDetails.department",
                        prerequisites: "$courseDetails.prerequisites",
                        description: "$courseDetails.description",
                        semesterCode: "$semesterDetails.semesterCode",
                        semesterName: "$semesterDetails.semesterName",
                        semesterYear: "$semesterDetails.year",
                        teacherWallet: "$teacherDetails.walletAddress",
                        teacherName: "$teacherDetails.teacherName",
                        teacherEmail: "$teacherDetails.teacherEmail",
                        teacherPhone: "$teacherDetails.teacherPhone",
                        designation: "$teacherDetails.designation",
                        studentLimit: 1,
                        enrolledCount: 1,
                        type: 1,
                        isEnrolled: 1,
                        assignedAt: 1,
                    },
                });

                // 4️⃣ Execute aggregation
                const offeredCourses = await assignedCoursesCollection.aggregate(pipeline).toArray();
                res.status(200).json(offeredCourses);

            } catch (err) {
                console.error("Error fetching offered courses:", err);
                res.status(500).json({ message: "Server error" });
            }
        });

        // My Course for viewing only
        app.get("/my-courses", async (req, res) => {
            try {
                const {
                    studentWallet: walletFromQuery,
                    search,
                    semester,         // e.g. "running" | "completed" | "upcoming" | "spring2025"
                    isCompleted,      // e.g. "true" | "false"
                } = req.query;

                // Prefer wallet from auth (req.user) but allow query for now
                const studentWallet = walletFromQuery || req.user?.walletAddress;
                if (!studentWallet) {
                    return res.status(400).json({ message: "Student wallet is required" });
                }

                // Optional: Make sure the student exists
                const studentExists = await usersCollection.findOne(
                    { walletAddress: studentWallet, role: "student" },
                    { projection: { _id: 1 } }
                );
                if (!studentExists) {
                    return res.status(404).json({ message: "Student not found" });
                }

                const pipeline = [
                    // 1) Only this student's enrollments
                    { $match: { studentWallet } },

                    // 2) Convert assignedCourseId (string) -> ObjectId to join assignedCourses._id
                    { $addFields: { assignedCourseObjectId: { $toObjectId: "$assignedCourseId" } } },

                    // 3) Join assigned course
                    {
                        $lookup: {
                            from: "assignedCourses",
                            localField: "assignedCourseObjectId",
                            foreignField: "_id",
                            as: "assignedCourse",
                        },
                    },
                    { $unwind: "$assignedCourse" },

                    // 4) Join course details (by courseCode)
                    {
                        $lookup: {
                            from: "courses",
                            localField: "assignedCourse.courseCode",
                            foreignField: "courseCode",
                            as: "courseDetails",
                        },
                    },
                    { $unwind: "$courseDetails" },

                    // 5) Join semester details (by semesterCode)
                    {
                        $lookup: {
                            from: "semesters",
                            localField: "assignedCourse.semesterCode",
                            foreignField: "semesterCode",
                            as: "semesterDetails",
                        },
                    },
                    { $unwind: { path: "$semesterDetails", preserveNullAndEmptyArrays: true } },

                    // 6) Join teacher info (by teacherWallet)
                    {
                        $lookup: {
                            from: "users",
                            localField: "assignedCourse.teacherWallet",
                            foreignField: "walletAddress",
                            as: "teacherDetails",
                        },
                    },
                    { $unwind: { path: "$teacherDetails", preserveNullAndEmptyArrays: true } },

                    // 7) Normalize dates for sorting
                    {
                        $addFields: {
                            assignedAtDate: { $toDate: "$assignedCourse.assignedAt" },
                        },
                    },

                    // 8) Shape the response
                    {
                        $project: {
                            _id: 0,
                            enrollmentId: { $toString: "$_id" },
                            assignedCourseId: { $toString: "$assignedCourse._id" },

                            courseCode: "$courseDetails.courseCode",
                            courseTitle: "$courseDetails.courseTitle",
                            credit: "$courseDetails.credit",
                            department: "$courseDetails.department",
                            prerequisites: "$courseDetails.prerequisites",
                            description: "$courseDetails.description",

                            semesterCode: "$assignedCourse.semesterCode",        // from assignedCourse (always there)
                            semesterName: "$semesterDetails.semesterName",       // may be null if semester doc missing
                            semesterYear: "$semesterDetails.year",
                            semesterStatus: "$semesterDetails.status",

                            teacherWallet: "$assignedCourse.teacherWallet",
                            teacherName: "$teacherDetails.teacherName",
                            teacherEmail: "$teacherDetails.teacherEmail",
                            teacherPhone: "$teacherDetails.teacherPhone",
                            designation: "$teacherDetails.designation",

                            type: 1,              // from enrollment (e.g., regular/retake)
                            isCompleted: 1,       // from enrollment
                            assignedAt: "$assignedCourse.assignedAt",
                            assignedAtDate: 1,
                        },
                    },
                ];

                // 9) Optional filters
                if (search) {
                    pipeline.push({
                        $match: {
                            $or: [
                                { courseTitle: { $regex: search, $options: "i" } },
                                { courseCode: { $regex: search, $options: "i" } },
                                { teacherName: { $regex: search, $options: "i" } },
                                { semesterCode: { $regex: search, $options: "i" } },
                            ],
                        },
                    });
                }

                if (semester) {
                    // Allow status (running/completed/upcoming) or an exact semesterCode
                    if (["running", "completed", "upcoming"].includes(semester)) {
                        pipeline.push({ $match: { semesterStatus: semester } });
                    } else {
                        pipeline.push({ $match: { semesterCode: semester } });
                    }
                }

                if (typeof isCompleted !== "undefined") {
                    const completed = ["true", "1", "yes"].includes(String(isCompleted).toLowerCase());
                    pipeline.push({ $match: { isCompleted: completed } });
                }

                // 10) Sort newest first (by when the course was assigned)
                pipeline.push({ $sort: { assignedAtDate: -1 } });

                const enrolledCourses = await enrollmentCollection.aggregate(pipeline).toArray();
                return res.status(200).json(enrolledCourses);
            } catch (err) {
                console.error("Error fetching enrolled courses:", err);
                return res.status(500).json({ message: "Server error" });
            }
        });



        app.post("/enroll", async (req, res) => {
            try {
                const { enrollmentData } = req.body;

                // 1️⃣ Basic validation
                if (
                    !enrollmentData ||
                    !enrollmentData.studentWallet ||
                    !enrollmentData.courseCode ||
                    !enrollmentData.semesterCode ||
                    !enrollmentData.assignedCourseId
                ) {
                    return res.status(400).json({ message: "Missing required enrollment fields." });
                }

                // 2️⃣ Verify the assigned course exists and is offered
                const assignedCourse = await assignedCoursesCollection.findOne({
                    _id: new ObjectId(enrollmentData.assignedCourseId),
                });

                if (!assignedCourse) {
                    return res.status(404).json({ message: "Assigned course not found." });
                }

                if (!assignedCourse.isOffered) {
                    return res.status(400).json({
                        message: "This course is not currently offered for enrollment.",
                    });
                }

                // 3️⃣ Check student limit (count total enrolled students)
                const enrolledCount = await enrollmentCollection.countDocuments({
                    assignedCourseId: enrollmentData.assignedCourseId,
                });

                if (enrolledCount >= assignedCourse.studentLimit) {
                    return res.status(400).json({
                        message: "Student limit reached for this course.",
                    });
                }

                // 4️⃣ Check for duplicate enrollment (same course + same student + same semester)
                const duplicate = await enrollmentCollection.findOne({
                    studentWallet: enrollmentData.studentWallet,
                    courseCode: enrollmentData.courseCode,
                    semesterCode: enrollmentData.semesterCode,
                });

                if (duplicate) {
                    return res.status(400).json({
                        message: "You have already enrolled in this course for the current semester.",
                    });
                }

                // 5️⃣ If all checks pass, insert enrollment
                const result = await enrollmentCollection.insertOne(enrollmentData);
                res.send(result)
            } catch (error) {
                console.error("Error during enrollment:", error);
                res.status(500).json({ message: "Server error." });
            }
        });



        app.delete("/enroll", async (req, res) => {
            try {
                const { studentWallet, assignedCourseId } = req.query;

                if (!studentWallet || !assignedCourseId) {
                    return res.status(400).json({ message: "studentWallet and assignedCourseId are required" });
                }

                const result = await enrollmentCollection.deleteOne({
                    studentWallet,
                    assignedCourseId,
                });

                res.send(result);

            } catch (err) {
                console.error("Error deleting enrollment:", err);
                res.status(500).json({ message: "Server error" });
            }
        });

        // admin stats for dashboard (Shofiq)
        app.get('/user-counts', async (req, res) => {
            try {
                const totalUsers = await User.countDocuments();
                const totalStudents = await User.countDocuments({ role: 'student' });
                const totalTeachers = await User.countDocuments({ role: 'teacher' });
                const pendingApprovals = await User.countDocuments({ isApproved: false });
                const approvedStudents = await User.countDocuments({
                    role: 'student',
                    isApproved: true
                });
                const approvedTeachers = await User.countDocuments({
                    role: 'teacher',
                    isApproved: true
                });

                res.json({
                    success: true,
                    counts: {
                        totalUsers,
                        totalStudents,
                        totalTeachers,
                        pendingApprovals,
                        approvedStudents,
                        approvedTeachers
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Backend route for approving accounts
        app.post('/admin/approve-account', async (req, res) => {
            try {
                const { accountId, walletAddress, approvedBy } = req.body;
                console.log('Approve account request:', { accountId, walletAddress, approvedBy });
                // Find and update the user
                const updatedUser = await User.findByIdAndUpdate(
                    accountId,
                    {
                        isApproved: true,
                        status: 'approved',
                        approvedAt: new Date(),
                        approvedBy
                    },
                    { new: true }
                );
                if (!updatedUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }
                console.log('Account approved successfully:', updatedUser.email);
                res.json({
                    success: true,
                    message: 'Account approved successfully',
                    user: updatedUser
                });
            } catch (error) {
                console.error('Error in approve-account:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Backend route for rejecting accounts
        app.post('/admin/reject-account', async (req, res) => {
            try {
                const { accountId, walletAddress, rejectedBy } = req.body;

                console.log('Reject account request:', { accountId, walletAddress, rejectedBy });

                // Find and update the user
                const updatedUser = await User.findByIdAndUpdate(
                    accountId,
                    {
                        isApproved: false,
                        status: 'rejected',
                        rejectedAt: new Date(),
                        rejectedBy
                    },
                    { new: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                console.log('Account rejected successfully:', updatedUser.email);

                res.json({
                    success: true,
                    message: 'Account rejected successfully',
                    user: updatedUser
                });

            } catch (error) {
                console.error('Error in reject-account:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });


        // Teachers API

        // GET /teacher-courses?teacherWallet=0x...&semesterCode=spring2025
        app.get("/teacher-courses", async (req, res) => {
            try {
                const { teacherWallet, semesterCode } = req.query;
                if (!teacherWallet) return res.status(400).json({ message: "teacherWallet is required" });

                const match = { teacherWallet };
                if (semesterCode) match.semesterCode = semesterCode;

                const pipeline = [
                    { $match: match },
                    {
                        $lookup: {
                            from: "courses",
                            localField: "courseCode",
                            foreignField: "courseCode",
                            as: "courseDetails",
                        },
                    },
                    { $unwind: "$courseDetails" },
                    {
                        $lookup: {
                            from: "semesters",
                            localField: "semesterCode",
                            foreignField: "semesterCode",
                            as: "semesterDetails",
                        },
                    },
                    { $unwind: { path: "$semesterDetails", preserveNullAndEmptyArrays: true } },
                    { $addFields: { offerIdStr: { $toString: "$_id" } } },
                    {
                        $lookup: {
                            from: "enrollment",
                            localField: "offerIdStr",
                            foreignField: "assignedCourseId",
                            as: "enrollments",
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            courseCode: 1,
                            isOffered: 1,
                            studentLimit: 1,
                            assignedAt: 1,
                            enrolledCount: { $size: "$enrollments" },
                            courseTitle: "$courseDetails.courseTitle",
                            credit: "$courseDetails.credit",
                            department: "$courseDetails.department",
                            semesterCode: "$semesterDetails.semesterCode",
                            semesterName: "$semesterDetails.semesterName",
                            semesterYear: "$semesterDetails.year",
                            semesterStatus: "$semesterDetails.status",
                        },
                    },
                    { $sort: { assignedAt: -1 } },
                ];

                const data = await assignedCoursesCollection.aggregate(pipeline).toArray();
                res.status(200).json(data);
            } catch (err) {
                console.error("GET /teacher-courses error:", err);
                res.status(500).json({ message: "Server error" });
            }
        });

        // GET /teacher-course-students?teacherWallet=0x...&assignedCourseId=...
        app.get("/teacher-course-students", async (req, res) => {
            try {
                const { teacherWallet, assignedCourseId, isCompleted } = req.query;
                if (!teacherWallet) return res.status(400).json({ message: "teacherWallet is required" });
                if (!assignedCourseId) return res.status(400).json({ message: "assignedCourseId is required" });
                if (!ObjectId.isValid(assignedCourseId)) {
                    return res.status(400).json({ message: "Invalid assignedCourseId" });
                }

                // authorize ownership
                const offer = await assignedCoursesCollection.findOne({
                    _id: new ObjectId(assignedCourseId),
                    teacherWallet,
                    // only not completed course
                });
                if (!offer) return res.status(403).json({ message: "Not authorized or course not found" });

                const assignedIdStr = String(offer._id);
                let boolIsCompleted = (isCompleted === "true");


                const pipeline = [
                    { $match: { assignedCourseId: assignedIdStr, teacherWallet, isCompleted: boolIsCompleted } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "studentWallet",
                            foreignField: "walletAddress",
                            as: "student",
                        },
                    },
                    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 0,
                            enrollmentId: { $toString: "$_id" },
                            studentWallet: 1,
                            studentName: "$student.studentName",
                            studentEmail: "$student.studentEmail",
                            studentPublicKey: "$student.publicKey",
                            type: 1,
                            isCompleted: 1,
                            marks: 1, // pass-through if exists
                        },
                    },
                    { $sort: { "student.studentName": 1, studentWallet: 1 } },
                ];

                const students = await enrollmentCollection.aggregate(pipeline).toArray();
                res.status(200).json({
                    assignedCourseId: String(offer._id),
                    courseCode: offer.courseCode,
                    semesterCode: offer.semesterCode,
                    students,
                });
            } catch (err) {
                console.error("GET /teacher-course-students error:", err);
                res.status(500).json({ message: "Server error" });
            }
        });


        // After providing mark, mark a enrollment as completed
        app.patch("/enrollment", async (req, res) => {
            try {
                const { isCompleted, enrollmentId } = req.body;

                if (!enrollmentId || typeof isCompleted !== "boolean") {
                    return res.status(400).json({ message: "Invalid input" });
                }

                const query = { _id: new ObjectId(enrollmentId) };
                const updateDoc = { $set: { isCompleted: isCompleted } };

                const result = await enrollmentCollection.updateOne(query, updateDoc);

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: "Enrollment not found" });
                }

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Server error" });
            }
        });



        // Get apis to intregate data with SmartContract

        app.get("/course/:code", async (req, res) => {
            const { code } = req.params;
            const course = await coursesCollection.findOne({ courseCode: code });
            if (course) {
                res.send({courseCode: course.courseCode, courseTitle:course.courseTitle});
            } else {
                res.status(404).send({ message: "Course not found" });
            }
        });

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// MondoDB Related END ========================================





app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
