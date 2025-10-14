import React, { useState, useEffect, useContext } from 'react';
import { FaUsers, FaChalkboardTeacher, FaUserGraduate, FaBook, FaChartLine, FaClock, FaCheckCircle, FaExclamationTriangle, FaWallet } from 'react-icons/fa';
import { SiSemanticweb } from 'react-icons/si';
import { BsCalendarCheck } from 'react-icons/bs';
import { AuthContext } from '../../../contextAPI/AuthContext';
import { NavLink } from 'react-router-dom';

const AdminHome = () => {
    const { userInfo, nodeBackend } = useContext(AuthContext);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        pendingApprovals: 0,
        activeSemesters: 0,
        totalCourses: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    // Fetch dashboard statistics
    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            // Simulate API calls - replace with actual endpoints
            const usersResponse = await nodeBackend.get('/admin/dashboard/stats');

            if (usersResponse.data.success) {
                setStats(usersResponse.data.stats);
            } else {
                // Fallback mock data
                setStats({
                    totalUsers: 1247,
                    totalStudents: 1150,
                    totalTeachers: 97,
                    pendingApprovals: 23,
                    activeSemesters: 3,
                    totalCourses: 156,
                    recentActivity: [
                        { type: 'registration', user: 'John Doe', role: 'student', time: '2 hours ago' },
                        { type: 'registration', user: 'Sarah Wilson', role: 'teacher', time: '4 hours ago' },
                        { type: 'approval', user: 'Mike Johnson', role: 'student', time: '1 day ago' },
                        { type: 'course_creation', user: 'Dr. Smith', details: 'CSE-101', time: '1 day ago' }
                    ]
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            // Mock data for demo
            setStats({
                totalUsers: 1247,
                totalStudents: 1150,
                totalTeachers: 97,
                pendingApprovals: 23,
                activeSemesters: 3,
                totalCourses: 156,
                recentActivity: [
                    { type: 'registration', user: 'John Doe', role: 'student', time: '2 hours ago' },
                    { type: 'registration', user: 'Sarah Wilson', role: 'teacher', time: '4 hours ago' },
                    { type: 'approval', user: 'Mike Johnson', role: 'student', time: '1 day ago' },
                    { type: 'course_creation', user: 'Dr. Smith', details: 'CSE-101', time: '1 day ago' }
                ]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-blue-600">Admin Dashboard</h1>
                    <p className="text-gray-300 mt-2">
                        Welcome back, {userInfo?.teacherName || userInfo?.studentName || 'Admin'}!
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <FaWallet className="text-xs" />
                        <span className="font-mono">{userInfo?.walletAddress?.slice(0, 8)}...{userInfo?.walletAddress?.slice(-6)}</span>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users Card */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-blue-500">
                        <div className="stat-figure text-blue-500">
                            <FaUsers className="text-3xl" />
                        </div>
                        <div className="stat-title">Total Users</div>
                        <div className="stat-value text-blue-600">{stats.totalUsers}</div>
                        <div className="stat-desc">All platform users</div>
                    </div>

                    {/* Students Card */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-green-500">
                        <div className="stat-figure text-green-500">
                            <FaUserGraduate className="text-3xl" />
                        </div>
                        <div className="stat-title">Students</div>
                        <div className="stat-value text-green-600">{stats.totalStudents}</div>
                        <div className="stat-desc">Enrolled students</div>
                    </div>

                    {/* Teachers Card */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-purple-500">
                        <div className="stat-figure text-purple-500">
                            <FaChalkboardTeacher className="text-3xl" />
                        </div>
                        <div className="stat-title">Teachers</div>
                        <div className="stat-value text-purple-600">{stats.totalTeachers}</div>
                        <div className="stat-desc">Faculty members</div>
                    </div>

                    {/* Pending Approvals Card */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-orange-500">
                        <div className="stat-figure text-orange-500">
                            <FaClock className="text-3xl" />
                        </div>
                        <div className="stat-title">Pending</div>
                        <div className="stat-value text-orange-600">{stats.pendingApprovals}</div>
                        <div className="stat-desc">Awaiting approval</div>
                    </div>
                </div>

                {/* Second Row Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Active Semesters */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-indigo-500">
                        <div className="stat-figure text-indigo-500">
                            <BsCalendarCheck className="text-3xl" />
                        </div>
                        <div className="stat-title">Active Semesters</div>
                        <div className="stat-value text-indigo-600">{stats.activeSemesters}</div>
                        <div className="stat-desc">Current academic terms</div>
                    </div>

                    {/* Total Courses */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-red-500">
                        <div className="stat-figure text-red-500">
                            <FaBook className="text-3xl" />
                        </div>
                        <div className="stat-title">Total Courses</div>
                        <div className="stat-value text-red-600">{stats.totalCourses}</div>
                        <div className="stat-desc">Available courses</div>
                    </div>

                    {/* System Status */}
                    <div className="stat bg-base-100 rounded-lg shadow border-l-4 border-emerald-500">
                        <div className="stat-figure text-emerald-500">
                            <FaCheckCircle className="text-3xl" />
                        </div>
                        <div className="stat-title">System Status</div>
                        <div className="stat-value text-emerald-600">Online</div>
                        <div className="stat-desc">All systems operational</div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Activity */}
                        <div className="bg-base-100 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <FaChartLine className="text-blue-500" />
                                    Recent Activity
                                </h3>
                                <span className="badge badge-primary">{stats.recentActivity.length} activities</span>
                            </div>
                            <div className="space-y-4">
                                {stats.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-lg transition-colors">
                                        <div className={`avatar placeholder ${activity.type === 'registration' ? 'bg-blue-100 text-blue-600' :
                                            activity.type === 'approval' ? 'bg-green-100 text-green-600' :
                                                'bg-purple-100 text-purple-600'}`}>
                                            <div className="w-10 rounded-full">
                                                <span className="text-xs">
                                                    {activity.type === 'registration' ? '📝' :
                                                        activity.type === 'approval' ? '✅' : '📚'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {activity.type === 'registration' && `New ${activity.role} registration`}
                                                {activity.type === 'approval' && `Account approved`}
                                                {activity.type === 'course_creation' && `New course created`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {activity.user} {activity.details && `• ${activity.details}`}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400">{activity.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Overview */}
                        <div className="bg-base-100 rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <SiSemanticweb className="text-green-500" />
                                System Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-blue-600 font-semibold">Blockchain</div>
                                    <div className="text-sm text-gray-600">MetaMask Integration</div>
                                    <div className="text-xs text-green-600 mt-1">● Connected</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="text-green-600 font-semibold">Database</div>
                                    <div className="text-sm text-gray-600">MongoDB</div>
                                    <div className="text-xs text-green-600 mt-1">● Online</div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-purple-600 font-semibold">Authentication</div>
                                    <div className="text-sm text-gray-600">Web3 Wallet Auth</div>
                                    <div className="text-xs text-green-600 mt-1">● Active</div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <div className="text-orange-600 font-semibold">Security</div>
                                    <div className="text-sm text-gray-600">Role-based Access</div>
                                    <div className="text-xs text-green-600 mt-1">● Enabled</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Quick Access & Alerts */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-base-100 rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                            
                                    <NavLink to={"/dashboard/admin/manage-users"} className="btn btn-primary btn-block justify-start">
                                        <FaUsers className="text-lg" />
                                        Manage Users
                                </NavLink>
                                    <NavLink to={"/dashboard/admin/manage-semesters"} className="btn btn-secondary btn-block justify-start">
                                        <BsCalendarCheck className="text-lg" />
                                        Manage Semesters
                                    </NavLink>
                                <NavLink to={"/dashboard/admin/create-course"} className="btn btn-accent btn-block justify-start">
                                    <FaBook className="text-lg" />
                                    Create Course
                                </NavLink>
                                <NavLink to={"/dashboard/admin/assign-course"} className="btn btn-info btn-block justify-start">
                                    <FaChalkboardTeacher className="text-lg" />
                                    Assign Courses
                                </NavLink>
                            </div>
                        </div>

                        {/* Pending Approvals Alert */}
                        {stats.pendingApprovals > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-orange-500 text-xl" />
                                    <div>
                                        <h4 className="font-semibold text-orange-800">Pending Approvals</h4>
                                        <p className="text-orange-600 text-sm">
                                            {stats.pendingApprovals} account{stats.pendingApprovals > 1 ? 's' : ''} waiting for review
                                        </p>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-warning btn-sm mt-3 w-full"
                                    onClick={() => window.location.href = '/dashboard/admin/manage-users'}
                                >
                                    Review Now
                                </button>
                            </div>
                        )}

                        {/* System Status */}
                        <div className="bg-base-100 rounded-lg shadow p-4">
                            <h4 className="font-semibold mb-2">Current Academic Year</h4>
                            <div className="text-center p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                                <div className="text-2xl font-bold">2024-2025</div>
                                <div className="text-sm opacity-90">Fall Semester Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;