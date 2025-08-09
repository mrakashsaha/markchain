import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSideBar from '../components/AdminSideBar';
import AdminNavbar from '../components/AdminNavbar';

const AdminLayout = () => {
    return (
        <div className=''>
            <div className='fixed top-0 left-0 right-0 z-30'>
                <AdminNavbar></AdminNavbar>
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