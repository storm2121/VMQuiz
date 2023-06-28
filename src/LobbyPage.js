import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { signOut } from 'firebase/auth';
import { ref, onValue, off, push, set } from "firebase/database";
import CreateLobbyModal from './CreateLobbyModal.js';
import SettingsModal from './SettingsModal.js'; 
import { useNavigate } from 'react-router-dom';

function LobbyPage() {
    const [lobbies, setLobbies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState({
        numSongs: 10,
        guessTime: 30,
        songType: "opening",
        songGenre: "eroge"
    });
    const [lobbyName, setLobbyName] = useState("");
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

    const handleCreateLobby = async ({ lobbyName }) => {
        setLobbyName(lobbyName);
        setIsSettingsOpen(true);
    };

    const handleJoinLobby = async (lobbyId) => {
        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        const lobbyRef = ref(db, `/lobbies/${lobbyId}/members`);
        const newMemberRef = push(lobbyRef);
        await set(newMemberRef, { username });

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

    const handleSettingsSave = async (newSettings) => {
        setSettings(newSettings);

        const email = auth.currentUser.email;
        const username = email.split('@')[0];

        const newLobbyRef = push(ref(db, '/lobbies'));
        await set(newLobbyRef, { 
            name: lobbyName, 
            members: { host: { username } }, 
            settings: newSettings
        });

        navigate(`/lobby/${newLobbyRef.key}`);
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
            <CreateLobbyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreateLobby}
            />
            <SettingsModal
                isOpen={isSettingsOpen}
                settings={settings}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSettingsSave}
            />
        </div>
    );
}

export default LobbyPage;
