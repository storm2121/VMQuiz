import React, { useState } from 'react';

function CreateLobbyModal({ isOpen, onClose, onCreate }) {
    const [lobbyName, setLobbyName] = useState('');

    const handleCreate = () => {
        onCreate(lobbyName);
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
            <button onClick={handleCreate}>Create Lobby</button>
            <button onClick={onClose}>Cancel</button>
        </div>
    );
}

export default CreateLobbyModal;
