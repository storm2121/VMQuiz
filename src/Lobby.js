import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, remove, off, push, set, get } from "firebase/database";
import { db, auth } from './firebase.js';  

function Lobby() {
    const [lobbyData, setLobbyData] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null); // Add this line

    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/login');
        } else {
            setUserLoaded(true);
        }
    }, [navigate]);

    useEffect(() => {
        if (!userLoaded) return;
        
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        const unsubscribe = onValue(lobbyRef, (snapshot) => {
            const data = snapshot.val();
            setLobbyData(data);
        });

        return () => unsubscribe();
    }, [lobbyId, userLoaded]);

    useEffect(() => {
        const settingsRef = ref(db, `/lobbies/${lobbyId}/settings`); // Add this block
        const listener = onValue(settingsRef, snapshot => {
          const settings = snapshot.val();
          setSettings(settings);
        });

        return () => {
          off(settingsRef, listener);
        };
    }, [lobbyId]);

    useEffect(() => {
        if (!userLoaded) return;
        
        const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
        const membersUnsubscribe = onValue(membersRef, (snapshot) => {
            const members = snapshot.val();
            if (!members) {
                closeLobby();
            }
        });

        return () => off(membersRef, membersUnsubscribe);
    }, [lobbyId, userLoaded]);

    useEffect(() => {
        if (!userLoaded) return;

        const username = auth.currentUser ? auth.currentUser.email.split('@')[0] : '';

        const addMember = async () => {
            const lobbyRef = ref(db, `/lobbies/${lobbyId}/members`);
            const membersSnapshot = await get(lobbyRef);
            const members = membersSnapshot.val();
            const username = auth.currentUser ? auth.currentUser.email.split('@')[0] : '';
        
            // Don't add the user if they're already a member
            if (members && Object.keys(members).includes(username)) {
                return;
            }
        
            const userRef = ref(db, `/lobbies/${lobbyId}/members/${username}`);
            set(userRef, true);
        };
        

        addMember();

        const cleanup = async () => {
            if (auth.currentUser) {
                const currentUserEmail = auth.currentUser.email;
                const currentUsername = currentUserEmail.split('@')[0];
                const userRef = ref(db, `/lobbies/${lobbyId}/members/${currentUsername}`);
                await remove(userRef);
            }
        };
        
        window.addEventListener('beforeunload', cleanup);

        return () => {
            window.removeEventListener('beforeunload', cleanup);
            cleanup();
        };
    }, [lobbyId, navigate, userLoaded]);

    const closeLobby = async () => {
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        await remove(lobbyRef);
        navigate('/lobby');
    };

    if (!lobbyData) return 'Loading...';

    const hasMembers = lobbyData.members && Object.keys(lobbyData.members).length > 0;

    return (
        <div>
            <h1>{lobbyData.name}</h1>
            {settings && ( // Add this block
                <div>
                    <p>Number of songs: {settings.numSongs}</p>
                    <p>Time to guess a song: {settings.guessTime}</p>
                    <p>Song type: {settings.songType}</p>
                    <p>Song genre: {settings.songGenre}</p>
                </div>
            )}
           {hasMembers ? (
    <>
        <h2>Members:</h2>
        <ul>
            {Object.keys(lobbyData.members).map(username => (
                <li key={username}>{username}</li>
            ))}
        </ul>
    </>
) : (
    <p>No members in this lobby yet.</p>
)}

            <button onClick={closeLobby}>Close Lobby</button>
        </div>
    );
}

export default Lobby;
