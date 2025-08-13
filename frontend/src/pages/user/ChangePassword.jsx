import React, { useContext, useState } from 'react';
import { AuthContext } from '../../contextAPI/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { firestoreDB } from '../../firebase/firebaseConfig';

const ChangePassword = () => {
    const { changePassword, user } = useContext(AuthContext);
    const [errorMsg, setErrorMsg] = useState("");
    const [isDisabled, setIsDisabled] = useState(true);
    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });


    const validatePasswords = (password, confirmPassword) => {
        // Basic strong password regex: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (!strongPasswordRegex.test(password)) {
            setErrorMsg("Password must be at least 8 characters long and include uppercase, lowercase, and a number.");
            setIsDisabled(true);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            setIsDisabled(true);
            return;
        }

        setErrorMsg("");
        setIsDisabled(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);
        validatePasswords(updatedFormData.password, updatedFormData.confirmPassword);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!errorMsg) {
            // Call your change password function here
            changePassword(formData.password)
                .then(async () => {
                    console.log("passwordChange Sucessfully");

                    try {
                        await updateDoc(doc(firestoreDB, "usersCollection", `${user?.email}`), {isDefaultPassword: false});
                        console.log("Default password flag update was sucessfull")

                        // Now generate the encryption key  for the user
                    }
                    catch (error) {
                        console.log("Error while upading defaultPassword Flag" + error);
                    }
                    
                })
                .catch(error => console.log("Error while changing password", error));

        }
    };

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                    <h1 className="text-5xl font-bold">Change Password!</h1>
                    <p className="py-6">Change Password</p>
                </div>
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="fieldset">
                            <label className="label">Email</label>
                            <input disabled defaultValue={user?.email} name="email" type="email" className="input" placeholder="Email" />
                            <label className="label">New Password</label>
                            <input
                                name="password"
                                type="password"
                                className="input"
                                placeholder="Create a Password"
                                value={formData.password}
                                onChange={handleChange}
                            />

                            <label className="label">Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                className="input"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />

                            {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}

                            <button
                                className="btn btn-neutral mt-4"
                                type="submit"
                                disabled={isDisabled}
                            >
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
