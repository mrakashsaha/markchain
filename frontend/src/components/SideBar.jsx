import React, { useContext } from 'react';
import { TbLayoutSidebarLeftCollapseFilled } from 'react-icons/tb';
import { NavLink } from 'react-router-dom';
import { RiHome9Line } from 'react-icons/ri';
import { MdAddTask, MdClass, MdOutlineAssignmentTurnedIn, MdOutlineClass, MdOutlineManageAccounts } from 'react-icons/md';
import { BsDatabaseGear } from 'react-icons/bs';
import { AuthContext } from '../contextAPI/AuthContext';
import { IoCreateOutline, IoCreateSharp } from "react-icons/io5";
import { SiGoogleclassroom } from 'react-icons/si';
import { FaChartLine } from 'react-icons/fa';
import { GiClassicalKnowledge } from 'react-icons/gi';
import { PiStudent } from 'react-icons/pi';

const SideBar = () => {

    const { userInfo } = useContext(AuthContext);


    const adminSidebar =
        <>
            <li><NavLink to={"/dashboard/admin/home"}><RiHome9Line className='text-lg'></RiHome9Line> Home</NavLink></li>
            <li><NavLink to={"/dashboard/admin/manage-users"}><MdOutlineManageAccounts className='text-lg'></MdOutlineManageAccounts> Manage Users</NavLink></li>
            <li><NavLink to={"/dashboard/admin/manage-semesters"}><MdOutlineClass className='text-lg'></MdOutlineClass> Manage Semesters</NavLink></li>
            <li><NavLink to={"/dashboard/admin/create-course"}><IoCreateOutline className='text-lg'></IoCreateOutline> Create Course</NavLink></li>
            <li><NavLink to={"/dashboard/admin/assign-course"}><MdOutlineAssignmentTurnedIn className='text-lg'></MdOutlineAssignmentTurnedIn> Assign & Offer Course</NavLink></li>
        </>

    const studentSidebar =
        <>
            <li><NavLink to={"/dashboard/student/home"}><RiHome9Line className='text-lg' /> Home</NavLink></li>
            <li><NavLink to={"/dashboard/student/my-course"}><SiGoogleclassroom className='text-lg' /> My Courses</NavLink></li>
            <li><NavLink to={"/dashboard/student/enroll-courses"}><MdAddTask className='text-lg' /> Enroll Course</NavLink></li>
            <li><NavLink to={"/dashboard/student/results"}><FaChartLine className='text-lg' /> Results</NavLink></li>
        </>

    const teacherSidebar =
        <>
            <li><NavLink to={"/dashboard/teacher/home"}><RiHome9Line className='text-lg' /> Home</NavLink></li>
            <li><NavLink to={"/dashboard/teacher/my-courses"}><GiClassicalKnowledge className='text-lg' /> My Courses</NavLink></li>
            <li><NavLink to={"/dashboard/teacher/student-list"}><PiStudent className='text-lg' /> Enrolled Students</NavLink></li>
            <li><NavLink to={"/dashboard/teacher/grade-submission"}><MdOutlineAssignmentTurnedIn className='text-lg' /> Submit Grades</NavLink></li>
        </>

    return (
        <div>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col items-center justify-center">
                    {/* Page content here */}
                    <label htmlFor="my-drawer-2" className="m-2 flex justify-center btn btn-square bg-[#0bb990] hover:bg-[#3cc7a6] text-white drawer-button lg:hidden">
                        <TbLayoutSidebarLeftCollapseFilled className='text-2xl'></TbLayoutSidebarLeftCollapseFilled>
                    </label>
                </div>
                <div className="drawer-side shadow-xl border-t-2 border-base-200">
                    <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                    <ul className="menu bg-base-100 text-base-content min-h-full w-60 p-4 space-y-2">
                        {userInfo?.role === "admin" && adminSidebar}
                        {userInfo?.role === "teacher" && teacherSidebar}
                        {userInfo?.role === "student" && studentSidebar}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SideBar;