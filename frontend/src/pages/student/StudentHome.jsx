import React from 'react';

const StudentHome = () => {

    const handleViewGrades = () => {
        // Logic to view grades
        console.log('Viewing grades...');
    };

    const handleLogout = () => {
        // Logic to logout
        console.log('Logging out...');
    };

    return (
        <div>
            {/* <h1>Student Dashboard</h1> */}
            <p>Welcome to your dashboard!</p>
            <div className='my-6 p-3 border'>
                {/* add all subjects marks */}
                <button onClick={handleViewGrades} className='btn btn-wide btn-neutral'>View Marks</button>
            </div>
            <div className='flex justify-end'>
                <button onClick={handleLogout} className='btn btn-wide btn-neutral'>Logout</button>
            </div>
        </div>
    );
};

export default StudentHome;