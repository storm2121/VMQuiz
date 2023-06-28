import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';  
import { useNavigate } from 'react-router-dom';

function AuthWrapper({ children }) {
    const [isLoading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        return onAuthStateChanged(auth, (user) => {
            setLoading(false);
            if (!user) navigate("/login");
        });
    }, [navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    } else {
        return children;
    }
}

export default AuthWrapper;
