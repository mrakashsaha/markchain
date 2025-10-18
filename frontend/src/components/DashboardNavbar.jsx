// import React, { useContext } from 'react';
// import { BiSolidCoinStack } from 'react-icons/bi';
// import { PiPowerBold } from "react-icons/pi";
// import { Link } from 'react-router-dom';
// import { AuthContext } from '../contextAPI/AuthContext';
// import metamaskLogo from "../assets/metamask_logo.svg"
// import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';


// const DashBoardNavBar = () => {
//     const { account, loading } = useContext(AuthContext);
//     return (
//         <div className='bg-base-100 shadow-md'>
//             <div className="navbar p-4">
//                 <div className="flex-1">
//                     <Link to={"/dashboard"} className="btn btn-ghost text-xl">MarkChain</Link>
//                 </div>
//                 <div className="flex items-center md:gap-4">
//                     <div className=''>
//                         {loading ?
//                             <div>
//                                 <div className="flex items-center gap-2">
//                                     <div className="flex flex-col gap-2">
//                                         <div className="skeleton h-2 w-58"></div>
//                                         <div className="skeleton h-2 w-58"></div>
//                                     </div>
//                                     <div className="skeleton h-10 w-10 shrink-0 rounded-full"></div>
//                                 </div>
//                             </div>
//                             :
//                             <div>
//                                 {account ?
//                                     <div className='flex items-center gap-x-4'>
//                                         <div className="flex items-center gap-2 text-green-600">
//                                             <FaCheckCircle className="text-lg" />
//                                             <span>Connected: {account}</span>
//                                         </div>
//                                         <div className="w-8">
//                                             <img alt="MetaMask_Logo" src={metamaskLogo} />
//                                         </div>
//                                     </div>
//                                     :
//                                     <div className='flex items-center gap-x-4'>
//                                         <div className="flex items-center gap-2 text-red-600">
//                                             <FaTimesCircle className="text-lg" />
//                                             <span>No account connected</span>
//                                         </div>
//                                         <div className="w-8">
//                                             <img alt="MetaMask_Logo" src={metamaskLogo} />
//                                         </div>
//                                     </div>
//                                 }
//                             </div>
//                         }
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default DashBoardNavBar;

import React, { useContext } from 'react';
import { BiSolidCoinStack } from 'react-icons/bi';
import { PiPowerBold } from "react-icons/pi";
import { Link } from 'react-router-dom';
import { AuthContext } from '../contextAPI/AuthContext';
import metamaskLogo from "../assets/metamask_logo.svg";
import { FaCheckCircle, FaTimesCircle, FaHome, FaUser, FaCog } from 'react-icons/fa';

const DashBoardNavBar = () => {
    const { account, loading } = useContext(AuthContext);

    return (
        <div className='bg-gradient-to-r from-slate-900 to-purple-900 border-b border-white/10 shadow-lg'>
            <div className="navbar px-6 py-2">
                {/* Logo and Brand */}
                <div className="flex-1">
                    <Link
                        to={"/dashboard"}
                        className="flex items-center gap-3 text-2xl font-bold"
                    >
                        {/* <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <BiSolidCoinStack className="text-white text-sm" />
                        </div> */}
                        <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            MarkChain
                        </span>
                    </Link>
                </div>

                {/* Navigation Icons */}
                <div className="flex-none gap-2 mr-6">
                    <Link
                        to={"/dashboard"}
                        className="btn btn-ghost btn-circle text-white hover:bg-white/10 hover:text-blue-300 transition-all duration-300 tooltip"
                        data-tip="Dashboard"
                    >
                    </Link>
                    <Link
                        to={"/dashboard/profile"}
                        className="btn btn-ghost btn-circle text-white hover:bg-white/10 hover:text-purple-300 transition-all duration-300 tooltip"
                        data-tip="Profile"
                    >
                    </Link>
                    <Link
                        to={"/dashboard/settings"}
                        className="btn btn-ghost btn-circle text-white hover:bg-white/10 hover:text-green-300 transition-all duration-300 tooltip"
                        data-tip="Settings"
                    >
                    </Link>
                </div>

                {/* Wallet Status */}
                <div className='flex-none'>
                    {loading ? (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-2">
                                <div className="skeleton h-2 w-32 bg-white/20 rounded"></div>
                                <div className="skeleton h-2 w-28 bg-white/20 rounded"></div>
                            </div>
                            <div className="skeleton h-10 w-10 shrink-0 rounded-full bg-white/20"></div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            {account ? (
                                <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 hover:border-green-400/50 transition-all duration-300 group'>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <FaCheckCircle className="text-2xl text-green-400 group-hover:scale-110 transition-transform" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-sm font-medium">Wallet Connected</p>
                                            <p className="text-gray-300 text-sm font-mono">
                                                {account}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-base-400 rounded-full p-1 group-hover:scale-110 transition-transform">
                                        <img
                                            alt="MetaMask_Logo"
                                            src={metamaskLogo}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20 hover:border-red-400/50 transition-all duration-300 group'>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <FaTimesCircle className="text-2xl text-red-400 group-hover:scale-110 transition-transform" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-sm font-medium">Wallet Disconnected</p>
                                            <p className="text-gray-300 text-xs">Connect to continue</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-base-400 rounded-full p-1 group-hover:scale-110 transition-transform">
                                        <img
                                            alt="MetaMask_Logo"
                                            src={metamaskLogo}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashBoardNavBar;