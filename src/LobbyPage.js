import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { ref, onValue, off, push, set, get, child, remove } from "firebase/database";
import CreateLobbyModal from './CreateLobbyModal';
import { useNavigate } from 'react-router-dom';

function LobbyPage() {
    const [lobbies, setLobbies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const cleanup = async () => {
            const currentLobby = window.localStorage.getItem('currentLobby');

            if (currentLobby) {
                const email = auth.currentUser.email;
                const username = email.split('@')[0];

                const membersRef = ref(db, `/lobbies/${currentLobby}/members`);
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

                window.localStorage.removeItem('currentLobby');
            }
        };

        cleanup();

        const lobbyRef = ref(db, '/lobbies');
        const listener = onValue(lobbyRef, (snapshot) => {
            const lobbies = snapshot.val();
            const lobbyList = [];
            for(let id in lobbies) {
                lobbyList.push({ id, ...lobbies[id] });
            }
            setLobbies(lobbyList);
        });

        return () => {
            off(lobbyRef, listener);
        };
    }, []);

    const handleCreateLobby = async ({ lobbyName }) => {
        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        const newLobbyRef = push(ref(db, '/lobbies'));
        await set(newLobbyRef, { name: lobbyName, members: { host: { username } } });

        window.localStorage.setItem('currentLobby', newLobbyRef.key);

        navigate(`/lobby/${newLobbyRef.key}`);
    };

    const handleJoinLobby = async (lobbyId) => {
        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        const lobbyRef = ref(db, `/lobbies/${lobbyId}/members`);
        const newMemberRef = push(lobbyRef);
        await set(newMemberRef, { username });

        window.localStorage.setItem('currentLobby', lobbyId);

        navigate(`/lobby/${lobbyId}`);
    };

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={() => setIsModalOpen(true)}>Create Lobby</button>
            {lobbies.map(lobby => (
                <div key={lobby.id}>
                    <h2>{lobby.name}</h2>
                    <button onClick={() => handleJoinLobby(lobby.id)}>Join</button>
                </div>
            ))}
            <CreateLobbyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateLobby}
            />
        </div>
    );
}

export default LobbyPage;
