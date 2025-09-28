
import { AuthContext } from './AuthContext';
import { useEffect, useState } from 'react';

const AuthProvider = ({ children }) => {

    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true); // 🔹 loading state

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts",
                });
                setAccount(accounts[0]);
                setLoading(false);
            } catch (error) {
                console.error("User rejected request", error);
                setLoading(false);
            }
        } else {
            alert("MetaMask not installed!");
            setLoading(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
    };

    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({
                        method: "eth_accounts",
                    });
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    } else {
                        setAccount(null);
                    }
                } catch (err) {
                    console.error("Error checking connection:", err);
                    setAccount(null);
                }
            }
            setLoading(false); // 🔹 stop loading after check
        };

        checkConnection();

        if (window.ethereum) {
            window.ethereum.on("accountsChanged", (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    disconnectWallet();
                }
            });
        }
    }, []);

    const authInfo = {
        account, loading, connectWallet, disconnectWallet
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;