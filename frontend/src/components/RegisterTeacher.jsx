import React from 'react';
import Swal from "sweetalert2";


const RegisterTeacher = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        console.log("Form Data:", data);

        // Send data to Firebase
        // createAccountWithEmail(data.teacherEmail, randomPass)
        //     .then(async (userCredential) => {
        //         console.log(userCredential);
                
        //         if (userCredential.user.email) {
        //             // Save teacher data to Firestore
        //             await setDoc(doc(firestoreDB, "usersCollection", userCredential.user.email), {
        //                 email: userCredential.user.email,
        //                 isDefaultPassword: true,
        //                 role: "teacher",
        //                 name: data.teacherName,
        //                 subject: data.subject,
        //                 phone: data.teacherPhone,
        //                 gender: data.gender,
        //                 bloodGroup: data.bloodGroup,
        //                 qualification: data.qualification
        //             })
        //             .then(() => {
        //                 nodeBackend.post("/sendEmail", { 
        //                     userEmail: userCredential.user.email, 
        //                     defaultPassword: randomPass 
        //                 })
        //                 .then(res => {
        //                     if (res.data.success) {
        //                         const Toast = Swal.mixin({
        //                             toast: true,
        //                             position: "top-end",
        //                             showConfirmButton: false,
        //                             timer: 3000,
        //                             timerProgressBar: true,
        //                             didOpen: (toast) => {
        //                                 toast.onmouseenter = Swal.stopTimer;
        //                                 toast.onmouseleave = Swal.resumeTimer;
        //                             }
        //                         });
        //                         Toast.fire({
        //                             icon: "success",
        //                             title: `${res.data.message}`,
        //                         });
        //                     } else {
        //                         showPasswordAlert(randomPass, res.data.message);
        //                     }
        //                 })
        //                 .catch(error => {
        //                     console.log(error);
        //                     showPasswordAlert(randomPass, error.message);
        //                 });
        //             })
        //             .catch((error) => {
        //                 console.error("Error writing document: ", error);
        //                 Swal.fire({
        //                     icon: "error",
        //                     title: "Error saving teacher data",
        //                     text: error.message
        //                 });
        //             });
        //         }
        //     })
        //     .catch((error) => {
        //         console.log(error.code, error.message);
        //         const Toast = Swal.mixin({
        //             toast: true,
        //             position: "top-end",
        //             showConfirmButton: false,
        //             timer: 3000,
        //             timerProgressBar: true,
        //             didOpen: (toast) => {
        //                 toast.onmouseenter = Swal.stopTimer;
        //                 toast.onmouseleave = Swal.resumeTimer;
        //             }
        //         });
        //         Toast.fire({
        //             icon: "error",
        //             title: `${error.code}`,
        //         });
        //     });
    };

    // const showPasswordAlert = (password, message) => {
    //     Swal.fire({
    //         title: "Something Went Wrong",
    //         text: message,
    //         icon: "warning",
    //         showCancelButton: true,
    //         confirmButtonColor: "#3085d6",
    //         cancelButtonColor: "#d33",
    //         confirmButtonText: "Show Password"
    //     }).then((result) => {
    //         if (result.isConfirmed) {
    //             Swal.fire({
    //                 title: "Please Note!",
    //                 text: `Temporary Password: ${password}`,
    //                 icon: "info"
    //             });
    //         }
    //     });
    // };

    return (
        <div>
            <div className="">
                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div className="fieldset">
                        <label className="label">Full Name</label>
                        <input name='teacherName' type="text" className="input w-full" placeholder="Enter Teacher Name" required />
                    </div>

                    <div className="flex gap-4">
                        <div className='fieldset flex-1'>
                            <label className="label">Email</label>
                            <input name='teacherEmail' type="email" className="input w-full" placeholder="Enter Teacher Email" required />
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Phone</label>
                            <input name='teacherPhone' type="number" className="input w-full" placeholder="Enter Teacher Phone No." required />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className='fieldset flex-1'>
                            <label className="label">Subject</label>
                            <input name='subject' type="text" className="input w-full" placeholder="Enter Subject" required />
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Gender</label>
                            <select name='gender' defaultValue="Select Gender" className="select w-full" required>
                                <option disabled={true}>Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Blood Group</label>
                            <select name='bloodGroup' defaultValue="Select Blood Group" className="select w-full" required>
                                <option disabled={true}>Select Blood Group</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className='fieldset flex-1'>
                            <label className="label">Highest Qualification</label>
                            <select name='qualification' defaultValue="Select Qualification" className="select w-full" required>
                                <option disabled={true}>Select Qualification</option>
                                <option value="PhD">PhD</option>
                                <option value="Master's">Master's Degree</option>
                                <option value="Bachelor's">Bachelor's Degree</option>
                                <option value="Diploma">Diploma</option>
                            </select>
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Years of Experience</label>
                            <input name='experience' type="number" className="input w-full" placeholder="Enter years" required />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button className="btn btn-wide btn-neutral mt-4">Register Teacher</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterTeacher;