import { useContext } from 'react';
import { AuthContext } from '../../contextAPI/AuthContext';
import { useNavigate } from 'react-router-dom';
import { nodeBackend } from '../../axios/axiosInstance';


const ContinueWithMetaMask = () => {
    const navigate = useNavigate();
    const { account, loading, connectWallet, disconnectWallet } = useContext(AuthContext);

    if (loading) {
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h3>Checking connection...</h3>
            </div>
        );
    }

    if (account) {
        nodeBackend.get(`userinfo?wallet=${account}`)
        .then ((res)=> {
            if(!res.data) {
                navigate("/register")
            }
        }
        )
        .catch(error=>console.log(error))
    }

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            {account ? (
                <>
                    <h2>Connected: {account}</h2>
                    <button onClick={disconnectWallet}>Logout</button>
                </>
            ) : (
                <button onClick={connectWallet}>Connect with MetaMask</button>
            )}
        </div>
    );
};

export default ContinueWithMetaMask;