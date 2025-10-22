import { useContext } from 'react';
import { AuthContext } from '../../contextAPI/AuthContext';
import { useNavigate } from 'react-router-dom';
import { nodeBackend } from '../../axios/axiosInstance';
import metamaskLogo from "../../assets/metamask_logo.svg";
import LoadingSpiner from '../../components/LoadingSpiner';
import { FaArrowRight, FaRocket, FaShieldAlt, FaWallet } from 'react-icons/fa';

const ContinueWithMetaMask = () => {
    const navigate = useNavigate();
    const { account, loading, connectWallet } = useContext(AuthContext);

    if (loading) {
        return <LoadingSpiner></LoadingSpiner>
    }

    else if (account) {
        nodeBackend.get(`userinfo?wallet=${account}`)
            .then((res) => {
                if (res.data) {
                    navigate("/pending")
                }
                else {
                    navigate("/register")
                }
            })
            .catch(error => console.log(error))
    }

    else {
        return (
            <div className="min-h-screen bg-[#080f25] flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12 mt-16">
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">MarkChain</span>
                        </h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            The future of decentralized education. Connect your wallet to begin your learning journey.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Left Side - Features */}
                        <div className="space-y-6">
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-400/30 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <FaShieldAlt className="text-blue-400 text-xl" />
                                    </div>
                                    <h3 className="text-white text-lg font-semibold">Secure & Private</h3>
                                </div>
                                <p className="text-gray-300">
                                    Your data remains secure with blockchain technology. No central authority controls your credentials.
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-400/30 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <FaRocket className="text-purple-400 text-xl" />
                                    </div>
                                    <h3 className="text-white text-lg font-semibold">Instant Access</h3>
                                </div>
                                <p className="text-gray-300">
                                    Get immediate access to courses, certificates, and learning materials with Web3 authentication.
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-400/30 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <FaWallet className="text-green-400 text-xl" />
                                    </div>
                                    <h3 className="text-white text-lg font-semibold">Own Your Data</h3>
                                </div>
                                <p className="text-gray-300">
                                    Your achievements and certificates are stored on the blockchain - you truly own your educational journey.
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Connect Button */}
                        <div className="flex justify-center">
                            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 shadow-2xl max-w-md w-full">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <FaWallet className="text-white text-2xl" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
                                    <p className="text-gray-300">
                                        Connect with MetaMask to access the MarkChain platform
                                    </p>
                                </div>

                                <button
                                    className="btn w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-none text-white text-lg font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                                    onClick={connectWallet}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <img
                                            className='w-8 h-8'
                                            src={metamaskLogo}
                                            alt="metamasklogo"
                                        />
                                        <span>Connect with MetaMask</span>
                                        <FaArrowRight className="text-lg group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>

                                <div className="mt-6 text-center">
                                    <p className="text-gray-400 text-sm">
                                        Don't have MetaMask?{' '}
                                        <a
                                            href="https://metamask.io/download/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline transition-colors"
                                        >
                                            Install it here
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="text-center mt-12">
                        <div className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Secure Blockchain</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <span>Decentralized</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                <span>User Owned</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
};

export default ContinueWithMetaMask;