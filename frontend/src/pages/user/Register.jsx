import React, { useState } from 'react';
import RegisterStudent from '../../components/RegisterStudent';
import RegisterTeacher from '../../components/RegisterTeacher';

const Register = () => {
    const [role, setRole] = useState(null);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-base-200">
            {!role && (
                <div className="card w-96 bg-base-100 shadow-xl p-6">
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

            {role === "student" && <RegisterStudent></RegisterStudent>}
            {role === "teacher" && <RegisterTeacher></RegisterTeacher>}

            {role && (
                <button
                    className="btn btn-outline mt-6"
                    onClick={() => setRole(null)}
                >
                    🔙 Back
                </button>
            )}
        </div>
    );
};

export default Register;