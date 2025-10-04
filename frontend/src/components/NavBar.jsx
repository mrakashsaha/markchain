import React, { useContext } from 'react';
import { AuthContext } from '../contextAPI/AuthContext';
import { Link } from 'react-router-dom';
import metamaskLogo from "../assets/metamask_logo.svg"

const NavBar = () => {
    const { account, loading } = useContext(AuthContext);
    return (
        <div className='bg-base-100'>
            <div className="navbar max-w-7xl mx-auto  shadow-sm">
                <div className="flex-1">
                    <Link to={"/"} className="text-xl">MarkChain</Link>
                </div>
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
                        <div>
                            {account ?
                                <div className='flex items-center gap-x-4'>
                                    <span>Connected: {account}</span>
                                    <div className="w-8">
                                        <img alt="MetaMask_Logo" src={metamaskLogo} />
                                    </div>
                                </div>
                                :
                                <div className='flex items-center gap-x-4'>
                                    <span>No account connected</span>
                                    <div className="w-8">
                                        <img alt="MetaMask_Logo" src={metamaskLogo} />
                                    </div>
                                </div>

                            }
                        </div>}
                </div>
            </div>
        </div>
    );
};

export default NavBar;