import React, {useState } from 'react';
import RegisterStudent from '../../components/RegisterStudent';
import RegisterTeacher from '../../components/RegisterTeacher';
import { PiStudent } from "react-icons/pi";
import { PiChalkboardTeacherLight } from "react-icons/pi";
import { useContext } from 'react';
import LoadingSpiner from '../../components/LoadingSpiner';
import { AuthContext } from '../../contextAPI/AuthContext';


const Register = () => {
    const [role, setRole] = useState(null);
    const {loading, account, userInfo} = useContext(AuthContext);
    // if (loading || !account) return <LoadingSpiner></LoadingSpiner>

    console.log(userInfo);
    console.log(account);

   
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
                            <div className="card w-lg mx-auto glass shadow-xl p-6">
                                <h2 className="text-xl font-bold text-center mb-6">Register as a Student or Teacher</h2>
                                <div className="flex flex-col gap-4">
                                    <button
                                        className="btn btn-lg btn-primary"
                                        onClick={() => setRole("student")}
                                    >
                                        I am a Student <PiStudent className='text-xl'></PiStudent>
                                    </button>
                                    <button
                                        className="btn btn-lg btn-secondary"
                                        onClick={() => setRole("teacher")}
                                    >
                                        I am a Teacher  <PiChalkboardTeacherLight className='text-xl'></PiChalkboardTeacherLight>
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