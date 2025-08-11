import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { AuthContext } from './AuthContext';
import { auth } from '../firebase/firebaseConfig';
import { useEffect, useState } from 'react';

const AuthProvider = ({ children }) => {


    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState(null);
    const [userFlag, setUserFlag] = useState({});


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            } else {
                console.log('no user found');
                setLoading(false);
            }

            return () => unsubscribe();
        });

    }, [user, loading]);

    console.log(user);


    const createAccountWithEmail = (email, password) => {

        return createUserWithEmailAndPassword(auth, email, password)
    }


    const signInWithEmail = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password)
    }


    const changePassword = (newPassword) => {
        setLoading(true);
        return updatePassword(auth.currentUser, newPassword)
    }


    const signOutFromAccount = () => {
        setLoading(true);
        return signOut(auth);
    }


    const authInfo = {
        loading,
        setUser,
        user,
        userFlag, 
        setUserFlag,
        setLoading,
        createAccountWithEmail,
        signInWithEmail,
        changePassword,
        signOutFromAccount,
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;