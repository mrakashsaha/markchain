import React, { useContext } from 'react';
import { AuthContext } from '../contextAPI/AuthContext';
import LoadingSpiner from './LoadingSpiner';
import { FaUser, FaWallet, FaTimesCircle } from "react-icons/fa";
import moment from 'moment';

const RejectedAccount = () => {
    const { userInfo, loading } = useContext(AuthContext);

    console.log(userInfo)

    if (loading) {
        return <LoadingSpiner />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300 text-center p-6">
                {/* Top Section */}
                <div className="flex flex-col items-center gap-3">
                    <div className="text-error animate-pulse">
                        <FaTimesCircle className="text-4xl" />
                    </div>

                    <h2 className="text-2xl font-bold text-error">
                        Account Rejected
                    </h2>

                    <p className="text-gray-400 text-sm max-w-sm">
                        Hi <span className="font-semibold text-gray-400">{userInfo?.studentName || userInfo?.teacherName}</span>,
                        unfortunately your account request has been rejected by the admin.
                        Please contact support for more details.
                    </p>
                </div>

                <div className="divider"></div>

                {/* Info Section */}
                <div className="space-y-3 text-left">
                    <p className="flex items-center gap-2 text-gray-400">
                        <FaUser className="text-error" />
                        <span>{userInfo?.studentName || userInfo?.teacherName}</span>
                    </p>

                    <p className="flex items-center gap-2 text-gray-400 truncate">
                        <FaWallet className="text-error" />
                        <span className="truncate">{userInfo?.walletAddress}</span>
                    </p>

                    <p className="flex items-center gap-2 text-gray-400">
                        <FaTimesCircle className="text-error" />
                        <span>Created At: {moment(userInfo?.updatedAt || userInfo?.createdAt).format("MMMM Do YYYY, h:mm A")}</span>
                    </p>
                </div>

                <footer className="mt-6 text-sm text-gray-400">
                    Need help? Contact support.
                </footer>
            </div>
        </div>
    );
};

export default RejectedAccount;
