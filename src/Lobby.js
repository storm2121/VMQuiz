import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, remove, off, push, set, get , update } from "firebase/database";
import { db, auth } from './firebase.js';

function Lobby() {
    const [lobbyData, setLobbyData] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [lobbyActive, setLobbyActive] = useState(true);

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
            if (data) { // 
                setLobbyData(data);
            }
        });
    
        return () => unsubscribe();
    }, [lobbyId, userLoaded]);
    

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

        const gameStartRef = ref(db, `/lobbies/${lobbyId}/gameStarted`);
        const listener = onValue(gameStartRef, (snapshot) => {
            const hasStarted = snapshot.val();
            if (hasStarted) {
                navigate(`/game/${lobbyId}`);
            }
        });

        return () => off(gameStartRef, listener);
    }, [lobbyId, userLoaded, navigate]);

    useEffect(() => {
        if (!userLoaded) return;

        const username = auth.currentUser ? auth.currentUser.email.split('@')[0] : '';
        const addMember = async () => {
            if (lobbyActive) {
                const lobbyRef = ref(db, `/lobbies/${lobbyId}/members`);
                const membersSnapshot = await get(lobbyRef);
                const members = membersSnapshot.val();
                const username = auth.currentUser ? auth.currentUser.email.split('@')[0] : '';
                if (members && Object.keys(members).includes(username)) {
                    return;
                }
                const userRef = ref(db, `/lobbies/${lobbyId}/members/${username}`);
                set(userRef, { points: 0 }); // Initialize member with points property
            }
        };
        
        addMember();

        const cleanup = async () => {
            if (auth.currentUser) {
              const currentUserEmail = auth.currentUser.email;
              const currentUsername = currentUserEmail.split('@')[0];
              const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
              const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
              const userRef = ref(membersRef, currentUsername);
              await remove(userRef);
          
              // Get members after removal
              const membersSnapshot = await get(membersRef);
              const members = membersSnapshot.val();
          
              // If no members left, remove the lobby
              if (!members || Object.keys(members).length === 0) {
                await remove(lobbyRef);
              }
            }
          };

        window.addEventListener('beforeunload', cleanup);
        return () => {
            window.removeEventListener('beforeunload', cleanup);
        };
    }, [lobbyId, navigate, userLoaded]);

    const closeLobby = async () => {

        setLobbyActive(false);

        off(ref(db, `/lobbies/${lobbyId}/settings`));
        off(ref(db, `/lobbies/${lobbyId}/gameStarted`));
        off(ref(db, `/lobbies/${lobbyId}/members`));

        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        await remove(lobbyRef);
        navigate('/lobby');
    };

    const startGame = async () => {

        if (lobbyActive) {
            const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
            await update(lobbyRef, { gameStarted: true });
            navigate(`/game/${lobbyId}`);
        }
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        await update(lobbyRef, { gameStarted: true });
        navigate(`/game/${lobbyId}`);
    };

    if (!lobbyData) return 'Loading...';

    const hasMembers = lobbyData.members && Object.keys(lobbyData.members).length > 0;

    return (
        <div className="lobby-container">
        <h1>{lobbyData.name}</h1>
        
        {settings && (
            <div className="settings">
                <p>Number of songs: {settings.numSongs}</p>
                <p>Time to guess a song: {settings.guessTime}</p>
                <p>Song type: {settings.songType}</p>
                <p>Song genre: {settings.songGenre}</p>
            </div>
        )}
        
        <h2>Members:</h2>
        {hasMembers ? (
            <>
                <ul className="members-list">
                    {Object.keys(lobbyData.members).map(username => (
                        <li key={username}>{username}</li>
                    ))}
                </ul>
                <button onClick={startGame}>Start Game</button>
            </>
        ) : (
            <p>No members in this lobby yet.</p>
        )}

        <button onClick={closeLobby}>Close Lobby</button>
    </div>
    );
}

export default Lobby;