import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { ref, onValue, off, push, set } from "firebase/database";
import CreateLobbyModal from './CreateLobbyModal';

function LobbyPage() {
    const [lobbies, setLobbies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleCreateLobby = ({ lobbyName, username, rememberUsername }) => {
        const newLobbyRef = push(ref(db, '/lobbies'));
        set(newLobbyRef, { name: lobbyName, username, rememberUsername });
    };

    return (
        <div>
            <h1>Lobby</h1>
            <button onClick={() => setIsModalOpen(true)}>Create Lobby</button>
            {lobbies.map(lobby => (
                <div key={lobby.id}>
                    <h2>{lobby.name}</h2>
                    <p>Username: {lobby.username}</p>
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
