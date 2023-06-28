import React, { useState, useEffect } from 'react';
import { ref, onValue, off, push, set, remove } from "firebase/database";
import { db, auth, realtimeDB } from './firebase.js';
import { useNavigate, useParams } from 'react-router-dom';

function Game() {
    const [songs, setSongs] = useState([]);
    const [timeLeft, setTimeLeft] = useState(null);
    const [scores, setScores] = useState({});
    const [currentSongName, setCurrentSongName] = useState("");
    const [guess, setGuess] = useState("");
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    let guessTime, numSongs, songType;

    useEffect(() => {
        const lobbySettingsRef = ref(db, `/lobbies/${lobbyId}/settings`);
        const lobbySettingsListener = onValue(lobbySettingsRef, (snapshot) => {
            const settings = snapshot.val();
            guessTime = settings.guessTime;
            numSongs = settings.numSongs;
            songType = settings.songType;
        });

        const songRef = ref(db, '/songs');
        const songListener = onValue(songRef, (snapshot) => {
            const allSongs = snapshot.val();
            const filteredSongs = Object.values(allSongs).filter(song => song.type === songType);

            if (filteredSongs.length === 0) {
                console.error("No songs of selected type in the database");
                navigate(`/lobby/${lobbyId}`);
            } else {
                setSongs(filteredSongs);
                startGame(filteredSongs);
            }
        });

        return () => {
            off(songRef, songListener);
            off(lobbySettingsRef, lobbySettingsListener);
        };
    }, []);

    const startGame = (songs) => {
        let rounds = 0;

        const gameInterval = setInterval(() => {
            if (rounds >= numSongs) {
                clearInterval(gameInterval);
                navigate(`/lobby/${lobbyId}`);
            } else {
                setCurrentSongName("");
                const randomSong = songs[Math.floor(Math.random() * songs.length)];
                setTimeLeft(guessTime);
                // You can play the song here using randomSong.url
                
                const countdownInterval = setInterval(() => {
                    setTimeLeft(timeLeft => {
                        if (timeLeft === 1) {
                            clearInterval(countdownInterval);
                            setCurrentSongName(randomSong.name);
                        }
                        return timeLeft - 1;
                    });
                }, 1000);

                rounds++;
            }
        }, (guessTime + 5) * 1000); // guessTime + 5 seconds for showing the answer and a little break
    };

    const handleGuessSubmit = (e) => {
        e.preventDefault();
        
        // This is a very basic check, you may need a more complex logic depending on your song names
        if (guess.toLowerCase() === currentSongName.toLowerCase()) {
            const email = auth.currentUser.email;
            const username = email.split('@')[0];
            setScores(scores => ({
                ...scores,
                [username]: (scores[username] || 0) + 1
            }));
        }

        setGuess("");
    };

    return (
        <div>
            <h1>Game</h1>
            <p>Time left: {timeLeft}</p>
            <form onSubmit={handleGuessSubmit}>
                <input 
                    value={guess}
                    onChange={e => setGuess(e.target.value)}
                    placeholder="Guess the song"
                    autoComplete="off"
                />
                <button type="submit">Submit Guess</button>
            </form>
            {currentSongName && <p>The song was: {currentSongName}</p>}
            <h2>Scores:</h2>
            {Object.entries(scores).map(([username, score]) => (
                <p key={username}>{username}: {score}</p>
            ))}
        </div>
    );
}

export default Game;
