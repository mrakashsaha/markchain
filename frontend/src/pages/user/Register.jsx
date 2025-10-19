// import React, { useState } from 'react';
// import RegisterStudent from '../../components/RegisterStudent';
// import RegisterTeacher from '../../components/RegisterTeacher';
// import { PiStudent, PiChalkboardTeacherLight } from "react-icons/pi";
// import { FaArrowLeft, FaGraduationCap, FaUserTie } from "react-icons/fa";
// import registerPageLogo from "../../assets/register_page_logo_4.jpg";

// const Register = () => {
//     const [role, setRole] = useState(null);

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//             <div
//                 className="hero min-h-screen relative"
//                 style={{
//                     backgroundImage: `url(${registerPageLogo})`,
//                     backgroundSize: 'cover',
//                     backgroundPosition: 'center',
//                     backgroundAttachment: 'fixed'
//                 }}
//             >
//                 {/* Enhanced Overlay */}
//                 <div className="hero-overlay bg-black/60"></div>

//                 {/* Back Button when role is selected */}
//                 {role && (
//                     <button
//                         onClick={() => setRole(null)}
//                         className="absolute top-6 left-6 z-10 btn btn-ghost btn-circle glass text-white hover:bg-white/20 transition-all duration-300"
//                         title="Go Back"
//                     >
//                         <FaArrowLeft className="text-xl" />
//                     </button>
//                 )}

//                 <div className="hero-content text-neutral-content text-center w-full max-w-6xl">
//                     <div className="w-full">
//                         {!role && (
//                             <div className="card glass shadow-2xl p-8 border border-white/20 backdrop-blur-xs transform transition-all duration-500 hover:scale-105">
//                                 {/* Header Section */}
//                                 <div className="text-center mb-8">
//                                     <div className="flex justify-center mb-4">
//                                         <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
//                                             <FaGraduationCap className="text-3xl text-white" />
//                                         </div>
//                                     </div>
//                                     <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2">
//                                         Join Our Platform
//                                     </h1>
//                                     <p className="text-blue-100 text-lg opacity-90">
//                                         Choose your role to get started with your educational journey
//                                     </p>
//                                 </div>

//                                 {/* Role Selection Cards */}
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                                     {/* Student Card */}
//                                     <div
//                                         className="card bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group p-6 rounded-2xl"
//                                         onClick={() => setRole("student")}
//                                     >
//                                         <div className="card-body items-center text-center p-0">
//                                             <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
//                                                 <PiStudent className="text-2xl text-white" />
//                                             </div>
//                                             <h3 className="card-title text-white text-xl mb-2">Student</h3>
//                                             <p className="text-blue-100 opacity-80 text-sm mb-4">
//                                                 Access courses, track progress, and achieve your academic goals
//                                             </p>
//                                             <div className="flex justify-center gap-2 text-blue-200">
//                                                 <span className="badge badge-sm glass">Learn</span>
//                                                 <span className="badge badge-sm glass">Grow</span>
//                                                 <span className="badge badge-sm glass">Succeed</span>
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {/* Teacher Card */}
//                                     <div
//                                         className="card bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group p-6 rounded-2xl"
//                                         onClick={() => setRole("teacher")}
//                                     >
//                                         <div className="card-body items-center text-center p-0">
//                                             <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
//                                                 <PiChalkboardTeacherLight className="text-2xl text-white" />
//                                             </div>
//                                             <h3 className="card-title text-white text-xl mb-2">Teacher</h3>
//                                             <p className="text-blue-100 opacity-80 text-sm mb-4">
//                                                 Create courses, guide students, and share your knowledge
//                                             </p>
//                                             <div className="flex justify-center gap-2 text-purple-200">
//                                                 <span className="badge badge-sm glass">Teach</span>
//                                                 <span className="badge badge-sm glass">Inspire</span>
//                                                 <span className="badge badge-sm glass">Mentor</span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Additional Info */}
//                                 <div className="text-center">
//                                     <p className="text-blue-200 text-sm opacity-75">
//                                         Secure • Blockchain Powered • Easy to Use
//                                     </p>
//                                 </div>
//                             </div>
//                         )}

//                         {/* Registration Forms */}
//                         <div className="transform transition-all duration-500">
//                             {role === "student" && (
//                                 <div className="animate-fade-in">
//                                     <RegisterStudent role={role} setRole={setRole} />
//                                 </div>
//                             )}
//                             {role === "teacher" && (
//                                 <div className="animate-fade-in">
//                                     <RegisterTeacher role={role} setRole={setRole} />
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Custom CSS for animations */}
//             {/* <style jsx>{`
//                 @keyframes fade-in {
//                     from {
//                         opacity: 0;
//                         transform: translateY(20px);
//                     }
//                     to {
//                         opacity: 1;
//                         transform: translateY(0);
//                     }
//                 }
//                 .animate-fade-in {
//                     animation: fade-in 0.5s ease-out;
//                 }
//             `}</style> */}
//         </div>
//     );
// };

// export default Register;

import React, { useState } from 'react';
import RegisterStudent from '../../components/RegisterStudent';
import RegisterTeacher from '../../components/RegisterTeacher';
import { PiStudent, PiChalkboardTeacherLight } from "react-icons/pi";
import { FaArrowLeft, FaGraduationCap } from "react-icons/fa";
import registerPageLogo from "../../assets/register_page_logo_4.jpg";

const Register = () => {
    const [role, setRole] = useState(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div
                className="hero min-h-screen relative"
                style={{
                    backgroundImage: `url(${registerPageLogo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Enhanced Overlay */}
                <div className="hero-overlay bg-black/60"></div>

                {/* Back Button when role is selected */}
                {role && (
                    <button
                        onClick={() => setRole(null)}
                        className="absolute top-6 left-6 z-10 btn btn-ghost btn-circle glass text-white hover:bg-white/20 transition-all duration-300"
                        title="Go Back"
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>
                )}

                <div className="hero-content text-neutral-content text-center w-full max-w-6xl">
                    <div className="w-full">
                        {!role && (
                            <div className="card glass shadow-2xl p-8 border border-white/20 backdrop-blur-sm transform transition-all duration-500 hover:scale-105">
                                {/* Header Section */}
                                <div className="text-center mb-8">
                                    <div className="flex justify-center mb-4">
                                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                            <FaGraduationCap className="text-3xl text-white" />
                                        </div>
                                    </div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-2">
                                        Join Our Platform
                                    </h1>
                                    <p className="text-blue-100 text-lg opacity-90">
                                        Choose your role to get started with your educational journey
                                    </p>
                                </div>

                                {/* Role Selection Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {/* Student Card */}
                                    <div
                                        className="card bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group p-6 rounded-2xl"
                                        onClick={() => setRole("student")}
                                    >
                                        <div className="card-body items-center text-center p-0">
                                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <PiStudent className="text-2xl text-white" />
                                            </div>
                                            <h3 className="card-title text-white text-xl mb-2">Student</h3>
                                            <p className="text-blue-100 opacity-80 text-sm mb-4">
                                                Access courses, track progress, and achieve your academic goals
                                            </p>
                                            <div className="flex justify-center gap-2 text-blue-200">
                                                <span className="badge badge-sm glass">Learn</span>
                                                <span className="badge badge-sm glass">Grow</span>
                                                <span className="badge badge-sm glass">Succeed</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Teacher Card */}
                                    <div
                                        className="card bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group p-6 rounded-2xl"
                                        onClick={() => setRole("teacher")}
                                    >
                                        <div className="card-body items-center text-center p-0">
                                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <PiChalkboardTeacherLight className="text-2xl text-white" />
                                            </div>
                                            <h3 className="card-title text-white text-xl mb-2">Teacher</h3>
                                            <p className="text-blue-100 opacity-80 text-sm mb-4">
                                                Create courses, guide students, and share your knowledge
                                            </p>
                                            <div className="flex justify-center gap-2 text-purple-200">
                                                <span className="badge badge-sm glass">Teach</span>
                                                <span className="badge badge-sm glass">Inspire</span>
                                                <span className="badge badge-sm glass">Mentor</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="text-center">
                                    <p className="text-blue-200 text-sm opacity-75">
                                        Secure • Blockchain Powered • Easy to Use
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Registration Forms */}
                        <div className="transform transition-all duration-500">
                            {role === "student" && (
                                <div className="animate-fade-in">
                                    <RegisterStudent role={role} setRole={setRole} />
                                </div>
                            )}
                            {role === "teacher" && (
                                <div className="animate-fade-in">
                                    <RegisterTeacher role={role} setRole={setRole} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;