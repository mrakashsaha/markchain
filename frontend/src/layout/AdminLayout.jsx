import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSideBar from '../components/AdminSideBar';
import DashboardNavbar from '../components/DashboardNavbar';
import NavBar from '../components/NavBar';

const AdminLayout = () => {
    return (
        <div className=''>
            <div className='fixed top-0 left-0 right-0 z-30'>
                <NavBar></NavBar>
            </div>
            <div className=''>
                <div className='fixed top-20 z-30'>
                    <AdminSideBar></AdminSideBar>
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

export default AdminLayout;