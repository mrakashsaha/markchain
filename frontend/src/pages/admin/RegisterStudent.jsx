import React, { useContext } from 'react';
import { AuthContext } from '../../contextAPI/AuthContext';
import { generateRandomPassword } from '../../functions/generateRandomPassword';
import { nodeBackend } from '../../axios/axiosInstance';
import Swal from "sweetalert2"

const RegisterStudent = () => {

    const { createAccountWithEmail } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        const randomPass = generateRandomPassword(); //generate random password for registerNew Student
        const form = e.target;
        const formData = new FormData(form);

        // Convert FormData into an object
        const data = Object.fromEntries(formData.entries());

        console.log("Form Data:", data, randomPass);


        // Send data to your Firebase
        createAccountWithEmail(data.studentEmail, randomPass)
            .then((userCredential) => {
                // Signed Up
                if (userCredential.user.email) {

                    nodeBackend.post("/sendEmail", { userEmail: userCredential.user.email, defaultPassword: randomPass })
                        .then(res => {
                            if (res.data.sucess) {

                                const Toast = Swal.mixin({
                                    toast: true,
                                    position: "top-end",
                                    showConfirmButton: false,
                                    timer: 3000,
                                    timerProgressBar: true,
                                    didOpen: (toast) => {
                                        toast.onmouseenter = Swal.stopTimer;
                                        toast.onmouseleave = Swal.resumeTimer;
                                    }
                                });
                                Toast.fire({
                                    icon: "success",
                                    title: `${res.data.message}`,
                                });
                            }

                            else {
                                Swal.fire({
                                    title: "Somthing Went Wrong",
                                    text: `${res.data.message}`,
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#3085d6",
                                    cancelButtonColor: "#d33",
                                    confirmButtonText: "Show Password"
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        Swal.fire({
                                            title: "Please Note!",
                                            text: `Your Password: ${randomPass}`,
                                            icon: "info"
                                        });
                                    }
                                });
                            }
                        })
                        .catch(error => {
                            console.log(error)
                            Swal.fire({
                                title: "Somthing Went Wrong",
                                text: `${error.message}`,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#3085d6",
                                cancelButtonColor: "#d33",
                                confirmButtonText: "Show Password"
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    Swal.fire({
                                        title: "Please Note!",
                                        text: `Your Password: ${randomPass}`,
                                        icon: "info"
                                    });
                                }
                            });
                        })
                }


            })
            .catch((error) => {
                console.log(error.code);
                console.log(error.message);
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.onmouseenter = Swal.stopTimer;
                        toast.onmouseleave = Swal.resumeTimer;
                    }
                });
                Toast.fire({
                    icon: "error",
                    title: `${error.code}`,
                });
            });
    }

    return (
        <div>
            <div className="">
                <form onSubmit={handleSubmit}>

                    {/* Basic Information */}
                    <div className="fieldset">
                        <label className="label">Full Name</label>
                        <input name='studentName' type="text" className="input w-full" placeholder="Enter Student Name" required />
                    </div>


                    <div className="flex gap-4">
                        <div className='fieldset flex-1'>
                            <label className="label">Email</label>
                            <input name='studentEmail' type="email" className="input w-full" placeholder="Enter Student Email" required />

                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Phone</label>
                            <input name='studentPhone' type="number" className="input w-full" placeholder="Enter Student Phone No." required />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className='fieldset flex-1'>
                            <label className="label">Date of Birth</label>
                            <input name='studentDOB' type="date" className="input w-full" required />

                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Gender</label>
                            <select name='gender' defaultValue="Select Gender" className="select w-full" required>
                                <option disabled={true}>Select Gender</option>
                                <option value={"male"} >Male</option>
                                <option value={"female"}>Female</option>
                                <option value={"other"}>Other</option>
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
                            <label className="label">Enroll Program</label>
                            <select name='enrollProgram' defaultValue="Select a Program" className="select w-full" required>
                                <option disabled={true}>Select a Program</option>
                                <option value={"BSC in CSE"} >BSC in CSE</option>
                                <option value={"BSC in CSE"}>BSC in EEE</option>
                                <option value={"BSC in ME"}>BSC in ME</option>
                                <option value={"BSC in Textile"}>BSC in Textile</option>
                            </select>
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">HSC/Diploma Roll</label>
                            <input name='hscRoll' type="number" className="input w-full" placeholder="Enter Roll No." required />
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">HSC/Diploma CGPA</label>
                            <input name='hscCGPA' type="number" step="0.01" className="input w-full" placeholder="Enter CGPA" required />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button className="btn btn-wide btn-neutral mt-4">Submit</button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default RegisterStudent;