import React, { useState } from 'react';
import RegisterStudent from '../../components/RegisterStudent';
import RegisterTeacher from '../../components/RegisterTeacher';

const Register = () => {
    const [role, setRole] = useState(null);
    return (

        <>

            <div
                className="hero min-h-screen"
                style={{
                    backgroundImage:
                        "url(https://img.daisyui.com/images/stock/photo-1507358522600-9f71e620c44e.webp)",
                }}
            >
                <div className="hero-overlay"></div>
                <div className="hero-content text-neutral-content text-center">
                    <div className="w-7xl">
                        {!role && (
                            <div className="card w-xl mx-auto bg-base-100 shadow-xl p-6">
                                <h2 className="text-xl font-bold text-center mb-6">Register As</h2>
                                <div className="flex flex-col gap-4">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setRole("student")}
                                    >
                                        Register as Student
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setRole("teacher")}
                                    >
                                        Register as Teacher
                                    </button>
                                </div>
                            </div>
                        )}

                        {role === "student" && <RegisterStudent role={role} setRole={setRole}></RegisterStudent>}
                        {role === "teacher" && <RegisterTeacher role={role} setRole={setRole}></RegisterTeacher>}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;