import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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


    const createAccountWithEmail = (email, password) => {

        return createUserWithEmailAndPassword(auth, email, password)
    }


    const signInWithEmail = (email, password) => {
        setLoading(true);
        return signInWithEmailAndPassword(auth, email, password)
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
        signOutFromAccount,
    }

    return (
        <AuthContext.Provider value={authInfo}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;