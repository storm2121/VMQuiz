import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase.js';

function RootPage() {
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.currentUser) {
            navigate("/lobby");
        } else {
            navigate("/login");
        }
    }, [navigate]);

    return null;
}

export default RootPage;
