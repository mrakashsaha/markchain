import { useContext } from 'react';
import { AuthContext } from '../../contextAPI/AuthContext';
import { useNavigate } from 'react-router-dom';
import { nodeBackend } from '../../axios/axiosInstance';
import metamaskLogo from "../../assets/metamask_logo.svg"
import LoadingSpiner from '../../components/LoadingSpiner';


const ContinueWithMetaMask = () => {
    const navigate = useNavigate();
    const { account, loading, connectWallet} = useContext(AuthContext);


    console.log(loading)
    console.log(account)

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
            }
            )
            .catch(error => console.log(error))
    }

    else {
        return (
            <div className='hero bg-base-200 min-h-screen'>
                <button className='btn btn-lg bg-[#2F2F2F] text-white' onClick={connectWallet}>
                    <img className='w-8 mr-2' src={metamaskLogo} alt="metamasklogo" />
                    <span>Connect with MetaMask</span>
                </button>
            </div>
        )

    }
};

export default ContinueWithMetaMask;