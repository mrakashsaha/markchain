import React, { useContext } from 'react';
import { TbLayoutSidebarLeftCollapseFilled } from 'react-icons/tb';
import { NavLink } from 'react-router-dom';
import { RiHome9Line } from 'react-icons/ri';
import { MdAddTask, MdOutlineAssignmentTurnedIn, MdOutlineClass, MdOutlineManageAccounts } from 'react-icons/md';
import { AuthContext } from '../contextAPI/AuthContext';
import { IoCreateOutline } from "react-icons/io5";
import { SiGoogleclassroom } from 'react-icons/si';
import { FaChartLine, FaUserShield, FaChalkboardTeacher, FaUserGraduate, FaHistory } from 'react-icons/fa';
import { GiClassicalKnowledge } from 'react-icons/gi';
import { PiStudent } from 'react-icons/pi';

const SideBar = () => {
    const { userInfo } = useContext(AuthContext);

    const adminSidebar = (
        <>
            <NavLink 
                to={"/dashboard/admin/home"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <RiHome9Line className='text-xl' />
                <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/admin/manage-users"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <MdOutlineManageAccounts className='text-xl' />
                <span>Manage Users</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/admin/manage-semesters"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <MdOutlineClass className='text-xl' />
                <span>Manage Semesters</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/admin/create-course"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <IoCreateOutline className='text-xl' />
                <span>Create Course</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/admin/assign-course"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <MdOutlineAssignmentTurnedIn className='text-xl' />
                <span>Assign & Offer</span>
            </NavLink>
        </>
    );

    const studentSidebar = (
        <>
            <NavLink 
                to={"/dashboard/student/home"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-green-50 text-green-600 border-green-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <RiHome9Line className='text-xl' />
                <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/student/my-course"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-green-50 text-green-600 border-green-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <SiGoogleclassroom className='text-xl' />
                <span>My Courses</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/student/enroll-courses"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-green-50 text-green-600 border-green-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <MdAddTask className='text-xl' />
                <span>Enroll Course</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/student/results"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-green-50 text-green-600 border-green-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <FaChartLine className='text-xl' />
                <span>Results</span>
            </NavLink>

            <NavLink 
                to={"/dashboard/student/detail-report"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-green-50 text-green-600 border-green-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <FaHistory className='text-xl' />
                <span>Detailed Report</span>
            </NavLink>
        </>
    );

    const teacherSidebar = (
        <>
            <NavLink 
                to={"/dashboard/teacher/home"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <RiHome9Line className='text-xl' />
                <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/teacher/my-courses"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <GiClassicalKnowledge className='text-xl' />
                <span>My Courses</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/teacher/student-list"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <PiStudent className='text-xl' />
                <span>Students</span>
            </NavLink>
            
            <NavLink 
                to={"/dashboard/teacher/grade-submission"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <MdOutlineAssignmentTurnedIn className='text-xl' />
                <span>Submit Grades</span>
            </NavLink>

            <NavLink 
                to={"/dashboard/teacher/edit-grade"} 
                className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border-l-4 ${
                        isActive 
                            ? 'bg-purple-50 text-purple-600 border-purple-600 font-semibold' 
                            : 'text-gray-200 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-300'
                    }`
                }
            >
                <MdOutlineAssignmentTurnedIn className='text-xl' />
                <span>Edit Grades</span>
            </NavLink>
        </>
    );

    return (
        <div>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col items-center justify-center">
                    <label 
                        htmlFor="my-drawer-2" 
                        className="m-4 btn btn-ghost btn-square drawer-button lg:hidden"
                    >
                        <TbLayoutSidebarLeftCollapseFilled className='text-2xl text-gray-600' />
                    </label>
                </div>
                <div className="drawer-side">
                    <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                    <div className="bg-[#080f25] min-h-full w-64 p-4 border-r border-none">
                        {/* Sidebar Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-gray-300 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <TbLayoutSidebarLeftCollapseFilled className="text-white text-sm" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white text-lg">MarkChain</h2>
                                <p className="text-xs text-gray-200 capitalize tracking-wider">{userInfo?.role} Panel</p>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="space-y-1">
                            {userInfo?.role === "admin" && adminSidebar}
                            {userInfo?.role === "teacher" && teacherSidebar}
                            {userInfo?.role === "student" && studentSidebar}
                        </nav>

                        {/* User Info */}
                        <div className="absolute bottom-6 left-4 right-4 mb-18">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                    {userInfo?.studentName?.charAt(0) || userInfo?.teacherName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">
                                        {userInfo?.studentName || userInfo?.teacherName || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-700 capitalize">{userInfo?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SideBar;