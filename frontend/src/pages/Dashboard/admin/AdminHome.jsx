import React, { useState, useEffect, useContext } from 'react';
import Swal from 'sweetalert2';
import { FaUser, FaEnvelope, FaClock, FaCheck, FaTimes, FaEye, FaWallet, FaBan, FaUsers } from 'react-icons/fa';
import { SiSemanticweb } from 'react-icons/si';
import moment from 'moment';
import { AuthContext } from './../../../contextAPI/AuthContext';

const AdminHome = () => {
    const { userInfo, nodeBackend } = useContext(AuthContext);
    const [totalUsers, setTotalUsers] = useState([]);
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showModal, setShowModal] = useState(false);
    console.log(pendingAccounts);

    // Fetch total users from your backend API
    useEffect(() => {
        const fetchTotalUsers = async () => {
            try {
                const response = await fetch('dashboard/admin/total-users');
                if (response.ok) {
                    const data = await response.json();
                    setTotalUsers(data.users);
                } else {
                    throw new Error(response.data.message);
                }
            } catch (error) {
                console.error("Error fetching total users:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load total users'
                });
            }
        };

        fetchTotalUsers();
    }, []);

    // Fetch pending accounts from your backend API
    const fetchPendingAccounts = async () => {
        try {
            setLoading(true);
            const response = await fetch('dashboard/admin/pending-accounts');

            if (response.ok) {
                const data = await response.json();
                setPendingAccounts(data.pendingAccounts);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error("Error fetching pending accounts:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load pending accounts'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo?.role === 'admin') {
            fetchPendingAccounts();
        }
    }, [userInfo]);

    // Approve account
    const approveAccount = async (accountId, walletAddress) => {
        try {
            const result = await Swal.fire({
                title: 'Approve Account?',
                text: 'This will grant the user access to the system',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, Approve!'
            });

            if (result.isConfirmed) {
                const response = await nodeBackend.post('/admin/approve-account', {
                    accountId,
                    walletAddress,
                    approvedBy: userInfo.walletAddress
                });

                if (response.data.success) {
                    setPendingAccounts(prev => prev.filter(account => account._id !== accountId));

                    Swal.fire({
                        icon: 'success',
                        title: 'Approved!',
                        text: 'Account has been approved successfully',
                        timer: 2000
                    });
                } else {
                    throw new Error(response.data.message);
                }
            }
        } catch (error) {
            console.error("Error approving account:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to approve account'
            });
        }
    };

    // Reject account
    const rejectAccount = async (accountId, walletAddress) => {
        try {
            const result = await Swal.fire({
                title: 'Reject Account?',
                text: 'This will permanently reject this account request',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#EF4444',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Yes, Reject!'
            });

            if (result.isConfirmed) {
                const response = await nodeBackend.post('/admin/reject-account', {
                    accountId,
                    walletAddress,
                    rejectedBy: userInfo.walletAddress
                });

                if (response.data.success) {
                    setPendingAccounts(prev => prev.filter(account => account._id !== accountId));

                    Swal.fire({
                        icon: 'success',
                        title: 'Rejected!',
                        text: 'Account has been rejected',
                        timer: 2000
                    });
                } else {
                    throw new Error(response.data.message);
                }
            }
        } catch (error) {
            console.error("Error rejecting account:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to reject account'
            });
        }
    };

    // View account details
    const viewAccountDetails = (account) => {
        setSelectedAccount(account);
        setShowModal(true);
    };

    // Format wallet address for display
    const formatWalletAddress = (address) => {
        if (!address) return 'N/A';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Check if user is admin
    if (userInfo?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="text-center">
                    <FaBan className="text-error text-6xl mb-4 mx-auto" />
                    <h2 className="text-2xl font-bold text-error mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
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
                        Welcome back, {userInfo?.teacherName || userInfo?.studentName || 'Admin'}
                    </p>
                    {/* <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <FaWallet className="text-xs" />
                        <span className="font-mono">{userInfo?.walletAddress?.slice(0, 8)}...{userInfo?.walletAddress?.slice(-6)}</span>
                    </div> */}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total Users Card */}
                    <div className="stat bg-base-100 rounded-lg shadow">
                        <div className="stat-figure text-blue-500">
                            <FaUsers className="text-3xl" />
                        </div>
                        <div className="stat-title">Total Users</div>
                        <div className="stat-value text-blue-600">{totalUsers.length}</div>
                        <div className="stat-desc">All platform users</div>
                    </div>
                    <div className="stat bg-base-100 rounded-lg shadow">
                        <div className="stat-figure text-primary">
                            <FaUser className="text-3xl" />
                        </div>
                        <div className="stat-title">Total Pending</div>
                        <div className="stat-value text-primary">{pendingAccounts.length}</div>
                        <div className="stat-desc">Awaiting approval</div>
                    </div>

                    <div className="stat bg-base-100 rounded-lg shadow">
                        <div className="stat-figure text-secondary">
                            <FaUser className="text-3xl" />
                        </div>
                        <div className="stat-title">Students</div>
                        <div className="stat-value text-secondary">
                            {pendingAccounts.filter(acc => acc.role === 'student').length}
                        </div>
                        <div className="stat-desc">Pending students</div>
                    </div>

                    <div className="stat bg-base-100 rounded-lg shadow">
                        <div className="stat-figure text-accent">
                            <FaUser className="text-3xl" />
                        </div>
                        <div className="stat-title">Teachers</div>
                        <div className="stat-value text-accent">
                            {pendingAccounts.filter(acc => acc.role === 'teacher').length}
                        </div>
                        <div className="stat-desc">Pending teachers</div>
                    </div>

                    <div className="stat bg-base-100 rounded-lg shadow">
                        <div className="stat-figure text-info">
                            <FaWallet className="text-3xl" />
                        </div>
                        <div className="stat-title">Your Wallet</div>
                        <div className="stat-value text-info text-lg">
                            {formatWalletAddress(userInfo?.walletAddress)}
                        </div>
                        <div className="stat-desc">Connected</div>
                    </div>
                </div>

                {/* Pending Accounts Table */}
                <div className="bg-base-100 rounded-lg shadow">
                    <div className="p-6 border-b border-base-300">
                        <h2 className="text-xl font-semibold">Pending Account Requests</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Review and approve or reject account requests
                        </p>
                    </div>

                    {pendingAccounts.length === 0 ? (
                        <div className="p-8 text-center">
                            <FaUser className="text-4xl text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600">No Pending Requests</h3>
                            <p className="text-gray-500">All account requests have been processed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Wallet Address</th>
                                        <th>Email</th>
                                        <th>Requested On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingAccounts.map((account) => (
                                        <tr key={account._id}>
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar placeholder">
                                                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                                                            <span className="text-xs">
                                                                {account.studentName?.charAt(0) || account.teacherName?.charAt(0) || 'U'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">
                                                            {account.studentName || account.teacherName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {account.phone || 'No phone'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${account.role === 'student' ? 'badge-primary' : 'badge-secondary'}`}>
                                                    {account.role}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <FaWallet className="text-gray-400" />
                                                    <span className="font-mono text-sm">
                                                        {formatWalletAddress(account.walletAddress)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="truncate max-w-xs">{account.email}</td>
                                            <td>
                                                {moment(account.createdAt).format("MMM Do YYYY")}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => viewAccountDetails(account)}
                                                        className="btn btn-sm btn-ghost btn-square"
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    <button
                                                        onClick={() => approveAccount(account._id, account.walletAddress)}
                                                        className="btn btn-sm btn-success"
                                                    >
                                                        <FaCheck />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => rejectAccount(account._id, account.walletAddress)}
                                                        className="btn btn-sm btn-error"
                                                    >
                                                        <FaTimes />
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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

            {/* Account Details Modal */}
            {showModal && selectedAccount && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Account Details</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Full Name</span>
                                    </label>
                                    <p>{selectedAccount.studentName || selectedAccount.teacherName}</p>
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Role</span>
                                    </label>
                                    <span className={`badge ${selectedAccount.role === 'student' ? 'badge-primary' : 'badge-secondary'}`}>
                                        {selectedAccount.role}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Email</span>
                                    </label>
                                    <p>{selectedAccount.email}</p>
                                </div>
                                <div>
                                    <label className="label">
                                        <span className="label-text font-semibold">Phone</span>
                                    </label>
                                    <p>{selectedAccount.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Wallet Address</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <FaWallet className="text-gray-400" />
                                    <p className="font-mono text-sm break-all">{selectedAccount.walletAddress}</p>
                                </div>
                            </div>

                            {selectedAccount.role === 'student' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">Enrolled Program</span>
                                            </label>
                                            <p>{selectedAccount.enrollProgram || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">HSC Roll</span>
                                            </label>
                                            <p>{selectedAccount.hscRoll || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">HSC CGPA</span>
                                            </label>
                                            <p>{selectedAccount.hscCGPA || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">Date of Birth</span>
                                            </label>
                                            <p>{selectedAccount.studentDOB ? moment(selectedAccount.studentDOB).format("MMMM Do YYYY") : 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedAccount.role === 'teacher' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">Subject</span>
                                            </label>
                                            <p>{selectedAccount.subject || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">Qualification</span>
                                            </label>
                                            <p>{selectedAccount.qualification || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">Experience</span>
                                            </label>
                                            <p>{selectedAccount.experience ? `${selectedAccount.experience} years` : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text font-semibold">Gender</span>
                                            </label>
                                            <p>{selectedAccount.gender ? selectedAccount.gender.charAt(0).toUpperCase() + selectedAccount.gender.slice(1) : 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="label">
                                    <span className="label-text font-semibold">Requested On</span>
                                </label>
                                <p>{moment(selectedAccount.createdAt).format("MMMM Do YYYY, h:mm A")}</p>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHome;