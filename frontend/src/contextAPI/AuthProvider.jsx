import { AuthContext } from "./AuthContext";
import { useEffect, useState } from "react";
import { nodeBackend } from "../axios/axiosInstance";

const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

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
        setUserInfo(null);
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
            setLoading(false);
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

    const fetchUserInfo = async () => {
        if (!account) {
            setUserInfo(null);
            return;
        }

        try {
            const res = await nodeBackend.get(`/userinfo?wallet=${account}`);
            setUserInfo(res.data);
        } catch (error) {
            console.error("Failed to fetch user info:", error);
            setUserInfo(null);
        }
    };

    // fetch when wallet changes
    useEffect(() => {
        fetchUserInfo();
    }, [account]);


    const authInfo = {
        account,
        loading,
        userInfo,
        connectWallet,
        disconnectWallet,
        refreshUserInfo: fetchUserInfo,
    };

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
