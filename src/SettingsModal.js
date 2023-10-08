import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

function SettingsModal({ isOpen, onClose, onSave }) {
  const [numSongs, setNumSongs] = useState(10); 
  const [guessTime, setGuessTime] = useState(30);
  const [songType, setSongType] = useState('opening');
  const [songGenre, setSongGenre] = useState('eroge');

  const handleSave = () => {
    onSave({ numSongs, guessTime, songType, songGenre });
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Game Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
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
              <option value="non-eroge">Non-E</option>
              <option value="eroge">E</option>

            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={handleSave}>Save Changes</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default SettingsModal;
