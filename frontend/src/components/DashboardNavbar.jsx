import React, { useContext } from 'react';
import { BiSolidCoinStack } from 'react-icons/bi';
import { PiPowerBold } from "react-icons/pi";
import { Link } from 'react-router-dom';
import { AuthContext } from '../contextAPI/AuthContext';
import metamaskLogo from "../assets/metamask_logo.svg"
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';


const DashBoardNavBar = () => {
    const { account, loading } = useContext(AuthContext);
    return (
        <div className='bg-base-100 shadow-md'>
            <div className="navbar p-4">
                <div className="flex-1">
                    <Link to={"/dashboard"} className="btn btn-ghost text-xl">MarkChain</Link>
                </div>
                <div className="flex items-center md:gap-4">
                    <div className=''>
                        {loading ?
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="skeleton h-2 w-58"></div>
                                        <div className="skeleton h-2 w-58"></div>
                                    </div>
                                    <div className="skeleton h-10 w-10 shrink-0 rounded-full"></div>
                                </div>
                            </div>
                            :
                            // <div>
                            //     {account ?
                            //         <div className='flex items-center gap-x-4'>
                            //             <span>Connected: {account}</span>
                            //             <div className="w-8">
                            //                 <img alt="MetaMask_Logo" src={metamaskLogo} />
                            //             </div>
                            //         </div>
                            //         :
                            //         <div className='flex items-center gap-x-4'>
                            //             <span>No account connected</span>
                            //             <div className="w-8">
                            //                 <img alt="MetaMask_Logo" src={metamaskLogo} />
                            //             </div>
                            //         </div>

                            //     }
                            // </div>
                            <div>
                                {account ?
                                    <div className='flex items-center gap-x-4'>
                                        <div className="flex items-center gap-2 text-green-600">
                                            <FaCheckCircle className="text-lg" />
                                            <span>Connected: {account}</span>
                                        </div>
                                        <div className="w-8">
                                            <img alt="MetaMask_Logo" src={metamaskLogo} />
                                        </div>
                                    </div>
                                    :
                                    <div className='flex items-center gap-x-4'>
                                        <div className="flex items-center gap-2 text-red-600">
                                            <FaTimesCircle className="text-lg" />
                                            <span>No account connected</span>
                                        </div>
                                        <div className="w-8">
                                            <img alt="MetaMask_Logo" src={metamaskLogo} />
                                        </div>
                                    </div>
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashBoardNavBar;