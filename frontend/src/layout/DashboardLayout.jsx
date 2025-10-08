import React from 'react';
import { Outlet } from 'react-router-dom';
import DashBoardNavBar from '../components/DashboardNavbar';
import SideBar from '../components/SideBar';

const DashBoardLayout = () => {

    return (
        <div className=''>
            <div className='fixed top-0 left-0 right-0 z-30'><DashBoardNavBar></DashBoardNavBar></div>
            <div className=''>
                <div className='fixed top-18 z-30'><SideBar></SideBar></div>
                <div className='flex-grow shadow-md border-t-2 bg-base-200'>
                    <div className='p-8 mt-20 lg:ml-60 min-h-dvh'>
                        <Outlet></Outlet>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashBoardLayout;