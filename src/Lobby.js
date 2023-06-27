import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, remove, child, get, update } from "firebase/database";
import { db, auth } from './firebase.js';  

function Lobby() {
    const [lobbyData, setLobbyData] = useState(null);
    const { lobbyId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const lobbyRef = ref(db, `/lobbies/${lobbyId}`);
        const unsubscribe = onValue(lobbyRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                navigate('/lobby');
                return;
            }
            setLobbyData(data);

            if (!data.members || Object.keys(data.members).length === 0) {
                remove(lobbyRef);
                navigate('/lobby');
            }
        });

        // remove user when the window is closed or reloaded
        window.onbeforeunload = async (event) => {
            const email = auth.currentUser.email;
            const username = email.split('@')[0];

            const membersRef = child(lobbyRef, 'members');
            const snapshot = await get(membersRef);
            const members = snapshot.val();

            let userId;
            for (let id in members) {
                if (members[id].username === username) {
                    userId = id;
                    break;
                }
            }

            if (userId) {
                const userRef = child(membersRef, userId);
                await remove(userRef);
            }
        };

        return () => {
            unsubscribe();
            window.onbeforeunload = null; // cleanup
        };
    }, [lobbyId, navigate]);

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
