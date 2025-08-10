import React from 'react';
import { Link } from 'react-router-dom';

const StudentSidebar = () => {
    return (
        <div>
            <div className="drawer lg:drawer-open">
                <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col items-center justify-center">
                    {/* Page content here */}
                    <label htmlFor="my-drawer-2" className="btn btn-primary drawer-button lg:hidden">
                        Open drawer
                    </label>
                </div>
                <div className="drawer-side -mt-4">
                    <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
                    <ul className="menu bg-base-100 text-base-content min-h-full w-64 p-4">
                        {/* Sidebar content here */}
                        <li><Link to={"/student"}>Home</Link></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StudentSidebar;