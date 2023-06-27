import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { ref, onValue, off, push, set } from "firebase/database";
import CreateLobbyModal from './CreateLobbyModal';
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

    const handleCreateLobby = async (lobbyName) => {
        // Get the part of the email before the '@' sign
        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        const newLobbyRef = push(ref(db, '/lobbies'));
        await set(newLobbyRef, { name: lobbyName, username });
        navigate(`/lobby/${newLobbyRef.key}`);
    };

    const handleJoinLobby = async (lobbyId) => {
        // Get the part of the email before the '@' sign
        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        // Update the members field in the database
        const lobbyRef = ref(db, `/lobbies/${lobbyId}/members`);
        const newMemberRef = push(lobbyRef);
        await set(newMemberRef, { username });

        // Navigate to the lobby
        navigate(`/lobby/${lobbyId}`);
    };

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={() => setIsModalOpen(true)}>Create Lobby</button>
            {lobbies.map(lobby => (
                <div key={lobby.id}>
                    <h2>{lobby.name}</h2>
                    <p>Username: {lobby.username}</p>
                    <button onClick={() => handleJoinLobby(lobby.id)}>Join</button>
                </div>
            ))}
            <CreateLobbyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={(lobbyName) => handleCreateLobby(lobbyName)}
            />
        </div>
    );
}

export default LobbyPage;
