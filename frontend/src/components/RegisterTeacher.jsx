import React, { useContext } from 'react';
import Swal from "sweetalert2";
import { AuthContext } from '../contextAPI/AuthContext';
import moment from 'moment';
import { nodeBackend } from '../axios/axiosInstance';
import { useNavigate } from 'react-router-dom';


const RegisterTeacher = ({ role, setRole }) => {
    const { refreshUserInfo, account, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Convert FormData into an object
        const userInfo = {
            walletAddress: account,
            createdAt: moment().toISOString(),
            status: "pending",
            role: "teacher",
            publicKey: null,
            ...Object.fromEntries(formData.entries()),
            experience: Number(formData.get("experience")),
            specialization: formData
                .get("specialization")
                ?.split(",")
                .map(item => item.trim()) || [],

        }

        nodeBackend.post("/register", { userInfo })
            .then((res) => {

                console.log(res.data)
                if (res.data.insertedId) {
                    refreshUserInfo();
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
                        title: "Your information has been submitted successfully."
                    });

                    navigate("/pending");

                }

                else {
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
                        title: "Somthing Went Wrong!"
                    });

                }
            })
            .catch((error) => {
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
                    title: `${error?.response?.data?.message}`,
                });
            })

    };

    return (
        <div>
            <div className="glass p-10">
                <form onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div className='flex gap-4'>
                        <div className="flex-1 fieldset">
                            <label className="label">Full Name</label>
                            <input name='teacherName' type="text" className="input w-full" placeholder="Enter Teacher Name" required />
                        </div>
                        <div className="flex-1 fieldset">
                            <label className="label">Wallet Address</label>
                            <input name='wallet' type="text" className="input w-full" value={loading ? "Loading..." : account} disabled required />
                        </div>
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
                            <label className="label">Department / Major</label>
                            <select
                                name='department'
                                defaultValue="Select Department / Major"
                                className="select w-full"
                                required
                            >
                                <option disabled={true}>Select Department / Major</option>
                                <option value="CSE">Computer Science and Engineering (CSE)</option>
                                <option value="EEE">Electrical and Electronic Engineering (EEE)</option>
                                <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                                <option value="Civil">Civil Engineering</option>
                                <option value="BBA">Business Administration (BBA)</option>
                                <option value="English">English</option>
                                <option value="Law">Law</option>
                                <option value="Architecture">Architecture</option>
                            </select>
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Designation</label>
                            <select
                                name='designation'
                                defaultValue="Select Designation"
                                className="select w-full"
                                required
                            >
                                <option disabled={true}>Select Designation</option>
                                <option value="Lecturer">Lecturer</option>
                                <option value="Senior Lecturer">Senior Lecturer</option>
                                <option value="Assistant Professor">Assistant Professor</option>
                                <option value="Associate Professor">Associate Professor</option>
                                <option value="Professor">Professor</option>
                                <option value="Head of Department">Head of Department</option>
                            </select>
                        </div>

                        <div className='fieldset flex-1'>
                            <label className="label">Years of Experience</label>
                            <input name='experience' type="number" className="input w-full" placeholder="Enter years" required />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className='fieldset flex-1'>
                            <label className="label">Specialization</label>
                            <input name='specialization' type="text" className="input w-full" placeholder="Ex: Data Science, Machine Learning" required />
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
                            <label className="label">Date of Birth</label>
                            <input name='teacherDOB' type="date" className="input w-full" required />

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

                    <div className="flex justify-between">
                        {role && (
                            <button
                                className="btn btn-wide btn-neutral mt-4"
                                onClick={() => setRole(null)}>Back</button>
                        )}
                        <button className="btn btn-wide btn-neutral mt-4">Register Teacher</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterTeacher;