import React, { useState } from 'react';

function CreateLobbyModal({ isOpen, onClose, onCreate }) {
    const [lobbyName, setLobbyName] = useState('');
    const [username, setUsername] = useState('');
    const [rememberUsername, setRememberUsername] = useState(false);

    const handleCreate = () => {
        onCreate({ lobbyName, username, rememberUsername });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div>
            <h2>Create a new lobby</h2>
            <input
                value={lobbyName}
                onChange={e => setLobbyName(e.target.value)}
                placeholder="Lobby Name"
            />
            <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
            />
            <label>
                <input
                    type="checkbox"
                    checked={rememberUsername}
                    onChange={e => setRememberUsername(e.target.checked)}
                />
                Remember Username
            </label>
            <button onClick={handleCreate}>Create Lobby</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
}

export default CreateLobbyModal;
