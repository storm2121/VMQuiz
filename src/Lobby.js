import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, remove } from "firebase/database";
import { db } from './firebase.js';  

function Lobby() {
    const [lobbyData, setLobbyData] = useState(null);
    const { lobbyId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        const unsubscribe = onValue(lobbyRef, (snapshot) => {
            const data = snapshot.val();
            setLobbyData(data);
        });

        return () => unsubscribe();
    }, [lobbyId]);

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
            {hasMembers ? (
                <>
                    <h2>Members:</h2>
                    <ul>
                        {Object.keys(lobbyData.members).map(memberId => (
                            <li key={memberId}>{lobbyData.members[memberId].username}</li>
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
