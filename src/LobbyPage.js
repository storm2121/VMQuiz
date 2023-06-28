import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { signOut } from 'firebase/auth';
import { ref, onValue, off, push, set, remove, onDisconnect } from "firebase/database";
import CreateLobbyWithSettingsModal from './CreateLobbyWithSettingsModal.js';
import { useNavigate } from 'react-router-dom';

function LobbyPage() {
    const [lobbies, setLobbies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
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

   const handleCreateLobby = async ({ lobbyName, settings }) => {
    const email = auth.currentUser.email;
    const username = email.split('@')[0];

    const newLobbyRef = push(ref(db, '/lobbies'));
    await set(newLobbyRef, { 
        name: lobbyName, 
        members: { [username]: true }, 
        settings
    });

    navigate(`/lobby/${newLobbyRef.key}`);
};


    const handleJoinLobby = async (lobbyId) => {
        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        const userRef = ref(db, `/lobbies/${lobbyId}/members/${username}`);
        await set(userRef, true);

        // Monitor connection status
        const connectedRef = ref(db, '.info/connected');
        onValue(connectedRef, async snapshot => {
            if (snapshot.val() === false) return;
            await onDisconnect(userRef).remove();
        });

        navigate(`/lobby/${lobbyId}`);
    };

    const handleLogout = () => {
        signOut(auth)
            .then(() => {
                navigate('/login');
            })
            .catch((error) => {
                console.error('Logout Error', error);
            });
    };

    const handleCreateClick = () => {
        setIsModalOpen(true);
    }

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={handleCreateClick}>Create Lobby</button>
            <button onClick={handleLogout}>Logout</button>
            {lobbies.map(lobby => (
                <div key={lobby.id}>
                    <h2>{lobby.name}</h2>
                    <button onClick={() => handleJoinLobby(lobby.id)}>Join</button>
                </div>
            ))}
            <CreateLobbyWithSettingsModal
                isOpen={isModalOpen}
                onCreate={handleCreateLobby}
            />
        </div>
    );
}

export default LobbyPage;
