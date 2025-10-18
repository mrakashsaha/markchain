import React, { useContext } from 'react';
import { AuthContext } from '../contextAPI/AuthContext';
import { Link } from 'react-router-dom';
import metamaskLogo from "../assets/metamask_logo.svg";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const NavBar = () => {
    const { account, loading } = useContext(AuthContext);

    return (
        <div className='bg-gradient-to-r from-slate-900 to-purple-900 border-b border-white/10 z-50 fixed top-0 right-0 left-0 backdrop-blur-lg'>
            <div className="navbar max-w-7xl mx-auto px-6 py-2">
                {/* Logo/Brand */}
                <div className="flex-1">
                    <Link
                        to={"/"}
                        className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
                    >
                        MarkChain
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className="flex-none gap-4 mr-6">
                    <Link
                        to={"/"}
                        className="btn btn-ghost text-white hover:bg-white/10 hover:text-blue-300 transition-all duration-300 group"
                    >
                    </Link>
                    <Link
                        to={"/register"}
                        className="btn btn-ghost text-white hover:bg-white/10 hover:text-purple-300 transition-all duration-300 group"
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
                                <div className='flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 hover:border-blue-400/50 transition-all duration-300 group'>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <FaCheckCircle className="text-2xl text-green-400 group-hover:scale-110 transition-transform" />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-sm font-medium">Connected</p>
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
                                            <p className="text-white text-sm font-medium">Not Connected</p>
                                            <p className="text-gray-300 text-xs">Connect Wallet</p>
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

export default NavBar;