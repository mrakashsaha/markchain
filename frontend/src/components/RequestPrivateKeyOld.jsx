import React, { useContext, useState } from "react";
import { AuthContext } from "../contextAPI/AuthContext";
import CustomToast from "../Toast/CustomToast";
import { FaCopy, FaDownload, FaKey, FaEye, FaEyeSlash, FaInfoCircle, FaSave } from "react-icons/fa";
import { nodeBackend } from "../axios/axiosInstance";
import { Navigate, useNavigate } from "react-router-dom";
import LoadingSpiner from "./LoadingSpiner";

const RequestPrivateKey = () => {
    const { userInfo, refreshUserInfo, loading } = useContext(AuthContext);
    const walletAddress = userInfo?.walletAddress || "";

    const [generated, setGenerated] = useState(false);
    const [privKey, setPrivKey] = useState("");
    const [pubKey, setPubKey] = useState("");
    const [ack, setAck] = useState(false);
    const [showPriv, setShowPriv] = useState(true);
    const [copied, setCopied] = useState({ priv: false, pub: false });
    const navigate = useNavigate();

    if (loading || !userInfo) return <LoadingSpiner></LoadingSpiner>

    if (userInfo?.publicKey) {
        if (userInfo?.role === "admin") return <Navigate to="/dashboard/admin/home"></Navigate>
        if (userInfo?.role === "student") return <Navigate to="/dashboard/student/home"></Navigate>
        if (userInfo?.role === "teacher") return <Navigate to="/dashboard/teacher/home"></Navigate>
    }

    const handleRequestClick = () => {
        console.log("this button hited"); // your logic will go here later
        nodeBackend.get("/generate-keys")
            .then(res => {
                console.log(res.data);
                setGenerated(true);
                setPrivKey(res.data?.privateKey);
                setPubKey(res.data?.publicKey);
                setAck(false);

            })
            .catch(error => {
                console.log(error);
                CustomToast({ icon: "error", title: "Key Generation Failed, See Console to Know More" })
            })
    };

    const copy = async (text, which) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied((p) => ({ ...p, [which]: true }));
            setTimeout(() => setCopied((p) => ({ ...p, [which]: false })), 1200);
            CustomToast({ icon: "success", title: "Copied to clipboard" });
        } catch {
            CustomToast({ icon: "error", title: "Copy failed" });
        }
    };

    const downloadPrivateTxt = () => {
        const short = walletAddress ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : "wallet";
        const content = [
            "DO NOT SHARE THIS FILE.",
            "If you lose this private key, you will lose access/control.",
            "",
            `Wallet: ${walletAddress || "N/A"}`,
            `Public Key: ${pubKey || "N/A"}`,
            `Private Key: ${privKey || "N/A"}`,
            "",
            "Store it securely.",
        ].join("\n");

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `private-${short}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSavePublicKey = () => {
        nodeBackend.patch("/store-public-key", { walletAddress: userInfo?.walletAddress, publicKey: pubKey })
            .then(res => {
                console.log(res.data)
                if (res.data.modifiedCount) {
                    refreshUserInfo();
                    CustomToast({ icon: "success", title: "Public key Stored Sucessfully" });
                    if (userInfo?.role === "admin") {
                        navigate("/dashboard/admin/home");
                    }

                    else if (userInfo?.role === "student") {
                        navigate("/dashboard/student/home")
                    }
                    else if (userInfo?.role === "teacher") {
                        navigate("/dashboard/teacher/home")
                    }
                    else {
                        navigate("/dashboard")
                    }

                }

                else if (res.data.modifiedCount === 0 && res.data.matchedCount === 1) {
                    CustomToast({ icon: "info", title: "Public Key Already stored" });
                }

                else {
                    CustomToast({ icon: "error", title: "Unknown error occur" });
                }
            })
            .catch(error => {
                console.log(error);
                CustomToast({ icon: "error", title: "Public Key Store in the System is Failed" });

            })
    };



    return (
        <div className="min-h-screen bg-base-200 text-base-content mt-12 px-4 md:px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">Request Private Key
                    </h1>
                </div>

                {/* Important notice */}
                <div className="alert alert-info">
                    <div className="flex items-start gap-3">
                        <FaInfoCircle className="mt-1" />
                        <div>
                            <p className="font-semibold">Important</p>
                            <ul className="list-disc pl-5 text-sm">
                                <li>Your private key is generated in your browser and never leaves your device.</li>
                                <li>Only the public key is saved to the system.</li>
                                <li className="font-medium">If you lose the private key, you will lose control of key-protected actions.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div className="card bg-base-100 border border-base-300">
                    <div className="card-body gap-6">
                        {/* Row: wallet + request */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="min-w-0">
                                <div className="text-sm text-base-content/70">Wallet</div>
                                <div className="font-mono break-all">{walletAddress || "—"}</div>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleRequestClick}
                                disabled={!walletAddress}
                                title={!walletAddress ? "Login required" : "Generate public/private key pair"}
                            >
                                Request Private Key
                            </button>
                        </div>

                        {generated && (
                            <div className="space-y-5">
                                {/* Step 1: Private key */}
                                <div>
                                    <div className="mb-2 text-sm font-semibold">Step 1 — Save your Private Key</div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-base-content/70">
                                                Private Key (shown once, keep it secret)
                                            </span>
                                        </label>
                                        <div className="flex gap-2 items-stretch">
                                            <input
                                                type={showPriv ? "text" : "password"}
                                                readOnly
                                                className="input input-bordered w-full font-mono select-all"
                                                value={privKey}
                                                placeholder="0x..."
                                            />
                                            <button
                                                className="btn btn-ghost"
                                                onClick={() => setShowPriv((v) => !v)}
                                                title={showPriv ? "Hide private key" : "Show private key"}
                                            >
                                                {showPriv ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                            <button className="btn" onClick={() => copy(privKey, "priv")}>
                                                <FaCopy />
                                                <span className="hidden sm:inline">&nbsp;Copy</span>
                                            </button>
                                            <button className="btn btn-neutral" onClick={downloadPrivateTxt}>
                                                <FaDownload />
                                                <span className="hidden sm:inline">&nbsp;Download .txt</span>
                                            </button>
                                        </div>
                                        {copied.priv && <div className="mt-1 text-xs text-success">Copied!</div>}
                                        <div className="mt-2 text-xs text-error">
                                            Never share your private key. Keep it in a secure manager or offline storage.
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Public key */}
                                <div>
                                    <div className="mb-2 text-sm font-semibold">Step 2 — Save your Public Key</div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text text-base-content/70">
                                                Public Key (will be saved in the system)
                                            </span>
                                        </label>
                                        <div className="flex gap-2 items-stretch">
                                            <input
                                                type="text"
                                                readOnly
                                                className="input input-bordered w-full font-mono select-all"
                                                value={pubKey}
                                                placeholder="0x..."
                                            />
                                            <button className="btn" onClick={() => copy(pubKey, "pub")}>
                                                <FaCopy />
                                                <span className="hidden sm:inline">&nbsp;Copy</span>
                                            </button>
                                        </div>
                                        {copied.pub && <div className="mt-1 text-xs text-success">Copied!</div>}
                                    </div>
                                </div>

                                {/* Acknowledge */}
                                <label className="cursor-pointer flex items-start gap-3 mt-1">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary mt-1"
                                        checked={ack}
                                        onChange={(e) => setAck(e.target.checked)}
                                    />
                                    <span className="text-sm">
                                        I have securely saved my private key. I understand that if I lose it, I will lose access/control.
                                    </span>
                                </label>

                                {/* Save public key */}
                                <div className="flex justify-end">
                                    <button
                                        className="btn btn-primary"
                                        disabled={!ack || !pubKey || !privKey}
                                        onClick={handleSavePublicKey}
                                        title={!ack ? "Please confirm you saved your private key" : "Save public key to system"}
                                    >
                                        <FaSave />
                                        <span className="hidden sm:inline">Save and Continue</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer tip */}
                <p className="text-xs text-base-content/70">
                    Tip: Store your private key offline storage or write it down and keep it in a secure place. Never share it.
                </p>
            </div>
        </div>
    );
};

export default RequestPrivateKey;