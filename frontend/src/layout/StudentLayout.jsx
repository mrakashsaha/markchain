import React from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import StudentSidebar from '../components/StudentSidebar';
import { Outlet } from 'react-router-dom';

const StudentLayout = () => {
    return (
        <div className=''>
            <div className='fixed top-0 left-0 right-0 z-30'>
                <DashboardNavbar></DashboardNavbar>
            </div>
            <div className=''>
                <div className='fixed top-20 z-30'>
                    <StudentSidebar></StudentSidebar>
                </div>
                <div className='flex-grow shadow-md border-t-2 bg-base-200'>
                    <div className='p-8 lg:p-16 mt-20 lg:ml-60 min-h-dvh'>
                        <Outlet></Outlet>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentLayout;