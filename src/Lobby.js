import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ref, onValue, remove, off, set, get } from "firebase/database";
import { db, auth } from './firebase.js';

function Lobby() {
    
    const [lobbyData, setLobbyData] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (!auth.currentUser) {
            navigate('/login');
        } else {
            setUserLoaded(true);
        }
    }, [navigate]);

    useEffect(() => {
        console.log("Fetching lobby data...");
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        const listener = onValue(lobbyRef, (snapshot) => {
            const lobby = snapshot.val();
            console.log("Lobby data fetched: ", lobby);

            setLobbyData(lobby);
        });

        return () => {
            off(lobbyRef, listener);
        };
    }, [lobbyId]);

    useEffect(() => {
        if (!userLoaded) return;
        
        const gameRef = ref(db, `/lobbies/${lobbyId}/game`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            const gameStarted = snapshot.val();
            if (gameStarted) {
                navigate(`/game/${lobbyId}`, { state: { settings: settings } });
            }
        });
    
        return () => unsubscribe();
    }, [lobbyId, userLoaded, navigate, settings]);
    
    useEffect(() => {
        const settingsRef = ref(db, `/lobbies/${lobbyId}/settings`);
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
            if (!members && location.state?.reason !== 'Rounds are finished.') {
                const gameRef = ref(db, `/lobbies/${lobbyId}/game`);
                get(gameRef).then((snapshot) => {
                    const gameStarted = snapshot.val();
                    if (!gameStarted) {
                        closeLobby();
                    }
                });
            }
        });

        return () => off(membersRef, membersUnsubscribe);
    }, [lobbyId, userLoaded, location.state]);

    useEffect(() => {
        if (!userLoaded) return;

        const username = auth.currentUser ? auth.currentUser.email.split('@')[0] : '';

        const addMember = async () => {
            const lobbyRef = ref(db, `/lobbies/${lobbyId}/members`);
            const membersSnapshot = await get(lobbyRef);
            const members = membersSnapshot.val();
        
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
            // cleanup();
        };
    }, [lobbyId, navigate, userLoaded]);

    const closeLobby = async () => {
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        await remove(lobbyRef);
        navigate('/lobby');
    };

    const startGame = async () => {
        console.log("Starting game with lobbyId:", lobbyId);
        const gameRef = ref(db, `/lobbies/${lobbyId}/game`);
        await set(gameRef, true);
        console.log("Starting game with lobbyId:", lobbyId);

    };

    if (!lobbyData) return 'Loading...';

    const hasMembers = lobbyData.members && Object.keys(lobbyData.members).length > 0;

    return (
        <div>
            <h1>{lobbyData.name}</h1>
            {settings && (
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

            {hasMembers && Object.keys(lobbyData.members)[0] === (auth.currentUser ? auth.currentUser.email.split('@')[0] : '') && (
                <button onClick={startGame}>Start Game</button>
            )}

            <button onClick={closeLobby}>Close Lobby</button>
        </div>
    );
}

export default Lobby;
