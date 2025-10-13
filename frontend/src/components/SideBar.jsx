import React, { useContext } from 'react';
import { TbLayoutSidebarLeftCollapseFilled } from 'react-icons/tb';
import { NavLink } from 'react-router-dom';
import { RiHome9Line } from 'react-icons/ri';
import { MdOutlineManageAccounts } from 'react-icons/md';
import { BsDatabaseGear } from 'react-icons/bs';
import { AuthContext } from '../contextAPI/AuthContext';

const SideBar = () => {

    const { userInfo } = useContext(AuthContext);


    const adminSidebar =
        <>
            <li><NavLink to={"/dashboard/admin/home"}><RiHome9Line className='text-lg'></RiHome9Line> Home</NavLink></li>
            <li><NavLink to={"/dashboard/admin/manage-users"}><MdOutlineManageAccounts className='text-lg'></MdOutlineManageAccounts> Manage Users</NavLink></li>
            <li><NavLink to={"/dashboard/admin/manage-semesters"}><BsDatabaseGear className='text-lg'></BsDatabaseGear> Manage Semesters</NavLink></li>
            <li><NavLink to={"/dashboard/admin/create-course"}><BsDatabaseGear className='text-lg'></BsDatabaseGear> Create Course</NavLink></li>
            <li><NavLink to={"/dashboard/admin/assign-course"}><BsDatabaseGear className='text-lg'></BsDatabaseGear> Assign Course</NavLink></li>
        </>

    const studentSidebar =
        <>
            <li><NavLink to={"/dashboard/student/home"}><RiHome9Line className='text-lg' /> Home</NavLink></li>
            <li><NavLink to={"/dashboard/student/offer-course"}><BsDatabaseGear className='text-lg' /> Offer Courses</NavLink></li>
            <li><NavLink to={"/dashboard/student/enrolled-courses"}><BsDatabaseGear className='text-lg' /> Enrolled Courses</NavLink></li>
            <li><NavLink to={"/dashboard/student/results"}><BsDatabaseGear className='text-lg' /> Results</NavLink></li>
        </>

    const teacherSidebar =
        <>
            <li><NavLink to={"/dashboard/teacher/home"}><RiHome9Line className='text-lg' /> Home</NavLink></li>
            <li><NavLink to={"/dashboard/teacher/my-courses"}><BsDatabaseGear className='text-lg' /> My Courses</NavLink></li>
            <li><NavLink to={"/dashboard/teacher/student-list"}><BsDatabaseGear className='text-lg' /> Enrolled Students</NavLink></li>
            <li><NavLink to={"/dashboard/teacher/grade-submission"}><BsDatabaseGear className='text-lg' /> Submit Grades</NavLink></li>
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