import React, { useContext } from 'react';
import { AuthContext } from '../../contextAPI/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreDB } from '../../firebase/firebaseConfig';
import { useNavigate } from 'react-router-dom';


const UserLogin = () => {

    const { signInWithEmail, setUserFlag} = useContext(AuthContext);

    const navigate = useNavigate();
    // Checking firestore Read Data.

    const handleSubmit = (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        // Convert FormData into an object
        const data = Object.fromEntries(formData.entries());

        console.log("Form Data:", data);


        // Calling Signin Function for Login with Firebase
        signInWithEmail(data.email, data.password)
            .then(async (userCredential) => {

                const docSnap = await getDoc(doc(firestoreDB, "usersCollection", userCredential.user.email))

                console.log(docSnap)

                if (docSnap.exists()) {
                    console.log("Document data:", docSnap.data());
                    setUserFlag(docSnap.data());
                    if (docSnap.data().isDefaultPassword === true) {
                        navigate("/change-password")
                    }

                    else if (docSnap.data().role==="student") {
                        navigate("/student")
                    }

                    else if (docSnap.data().role==="teacher") {
                        navigate("/teacher")
                    }
                    else {
                        console.log("somthing went wrong while login")
                    }

                } else {
                    // docSnap.data() will be undefined in this case
                    console.log("No such document!");
                }

            })
            .catch((error) => {
                const errorCode = error.code;
                console.log(errorCode)
            });


    }

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col lg:flex-row-reverse">
                <div className="text-center lg:text-left">
                    <h1 className="text-5xl font-bold">Login now!</h1>
                    <p className="py-6">
                        User your credential for login
                    </p>
                </div>
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <div className="card-body">
                        <form onSubmit={handleSubmit} className="fieldset">
                            <label className="label">Email</label>
                            <input name='email' type="email" className="input" placeholder="Email" />
                            <label className="label">Password</label>
                            <input name='password' type="password" className="input" placeholder="Password" />
                            <div><a className="link link-hover">Forgot password?</a></div>
                            <button className="btn btn-neutral mt-4">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserLogin;