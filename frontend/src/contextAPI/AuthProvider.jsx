import { AuthContext } from './AuthContext';

const AuthProvider = ({children}) => {
    return (
        <AuthContext.Provider value={"green"}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;