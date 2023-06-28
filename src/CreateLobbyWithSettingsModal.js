import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function CreateLobbyWithSettingsModal({ isOpen, onClose, onCreate }) {
    const [lobbyName, setLobbyName] = useState('');
    const [numSongs, setNumSongs] = useState(10); 
    const [guessTime, setGuessTime] = useState(30);
    const [songType, setSongType] = useState('opening');
    const [songGenre, setSongGenre] = useState('non-eroge');

    const handleSubmit = (e) => {
        e.preventDefault();

        onCreate({
            lobbyName,
            settings: { numSongs, guessTime, songType, songGenre }
        });

        setLobbyName('');
        onClose();
    };

    return (
        <Modal show={isOpen} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Create Lobby</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>Lobby Name</Form.Label>
                        <Form.Control type="text" value={lobbyName} onChange={e => setLobbyName(e.target.value)} required />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Number of Songs</Form.Label>
                        <Form.Control type="number" value={numSongs} onChange={e => setNumSongs(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Time to Guess</Form.Label>
                        <Form.Control type="number" value={guessTime} onChange={e => setGuessTime(e.target.value)} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Song Type</Form.Label>
                        <Form.Control as="select" value={songType} onChange={e => setSongType(e.target.value)}>
                            <option value="opening">Opening</option>
                            <option value="background">Background Music</option>
                            <option value="ending">Ending</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Song Genre</Form.Label>
                        <Form.Control as="select" value={songGenre} onChange={e => setSongGenre(e.target.value)}>
                            <option value="eroge">Eroge</option>
                            <option value="non-eroge">Non-Eroge</option>
                        </Form.Control>
                    </Form.Group>
                    <Button variant="primary" type="submit">Create Lobby</Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default CreateLobbyWithSettingsModal;
