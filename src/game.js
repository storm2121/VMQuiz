import React, { useState, useEffect, useRef } from 'react';
import { db, auth, firestoreDb } from './firebase.js';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, doc, onSnapshot, updateDoc, runTransaction } from "firebase/firestore";
import { ref, onValue, set, update } from "firebase/database";

function Game() {
    const [songs, setSongs] = useState([]);
    const [members, setMembers] = useState({});
    const [timeLeft, setTimeLeft] = useState(30);
    const [currentSong, setCurrentSong] = useState(null);
    const [guess, setGuess] = useState("");
    const [playedSongs, setPlayedSongs] = useState([]);
    const [reveal, setReveal] = useState(false);

    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const settings = location.state.settings;

    const roundsRef = useRef(0);
    const countdownInterval = useRef();
    const revealTimeout = useRef();

    const startCountdown = () => {
        setTimeLeft(settings.guessTime);
        countdownInterval.current = setInterval(() => {
            setTimeLeft((timeLeft) => {
                if (timeLeft <= 1) {
                    clearInterval(countdownInterval.current);
                    roundsRef.current++;
                    revealAnswer();
                    return settings.guessTime;
                }
                return timeLeft - 1;
            });
        }, 1000);
    };

    const revealAnswer = () => {
        setReveal(true);
        revealTimeout.current = setTimeout(() => {
            setReveal(false);
            playNextSong();
        }, 5000);
    }

    const endGame = async () => {
        const gameRef = ref(db, `/lobbies/${lobbyId}/game`);
        await set(gameRef, false); // Setting the 'game' property to false
        navigate(`/lobby/${lobbyId}`, { state: { reason: 'Rounds are finished.' } });
        console.log("endGame function");
    };
    



    function getUsernameFromEmail(email) {
        return email.split('@')[0];
    }

    

    useEffect(() => {
        const getSongs = async () => {
            console.log('Fetching songs...');
            const songCollection = collection(firestoreDb, "songs");
            const songSnapshot = await getDocs(songCollection);
            const songList = songSnapshot.docs.map(doc => {
                const data = doc.data();
                console.log('Fetched song data:', data);
                return { ...data, id: doc.id }
            });
            setSongs(songList);

            if (songList.length > 0) {
                console.log('First song after fetch:', songList[0]);
                playNextSong(songList);
            }
        };

        const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
        onValue(membersRef, snapshot => {
            setMembers(snapshot.val() || {});
        });

        getSongs();
    }, []);

    const playNextSong = (songList = songs) => {
        console.log("Preparing to play the next song...");

        if (roundsRef.current >= settings.numSongs) {
            console.log("Ending game because all rounds have been played");
            endGame();
            return;
        }

        console.log('Settings songGenre:', settings.songGenre);
        console.log('Settings songType:', settings.songType);
        console.log('Songs array:', songList);
        const validSongs = songList.filter(song => song.songGenre === settings.songGenre && song.type === settings.songType && !playedSongs.includes(song.id));
        console.log('Valid songs:', validSongs);

        if (validSongs.length === 0) {
            console.log("No valid songs remaining, ending game");
            revealTimeout.current = setTimeout(endGame, 5000);
            return;
        }

        const songToPlay = validSongs[Math.floor(Math.random() * validSongs.length)];
        console.log('Song to play:', songToPlay);

        setCurrentSong(songToPlay);
        setPlayedSongs(prevPlayedSongs => [...prevPlayedSongs, songToPlay.id]);
        console.log('Updated played songs...');

        startCountdown();
        console.log('Started countdown...');
    };

   const makeGuess = async () => {
    console.log('Preparing to make a guess...');
    
    if (!auth.currentUser) {
        console.log('auth.currentUser is not set');
        return;
    }

    if (!members) {
        console.log('members is not set');
        return;
    }
    
    const username = getUsernameFromEmail(auth.currentUser.email);
    
    console.log('Current user:', username);
    console.log('Members:', members);
    if (!guess) {
        console.log('guess is not set');
        return;
    }
    if (!currentSong) {
        console.log('currentSong is not set');
        return;
    }
    if (reveal) {
        console.log('Song is being revealed');
        return;
    }
    if (!members[username]) {
        console.log('Current user is not in members');
        return;
    }
    if (!guess || !currentSong || reveal || !members[username]) return;

    if (guess.toLowerCase() === currentSong.game.toLowerCase()) {
        const memberRef = ref(db, `/lobbies/${lobbyId}/members/${username}`);
        await update(memberRef, { score: (members[username].score || 0) + 1 });
        setGuess("");
        clearInterval(countdownInterval.current);
        roundsRef.current++;
        revealAnswer();
    }
};

    

    return (
        <div>
            <h1>Game {lobbyId}</h1>
            <h2>Time left: {timeLeft}</h2>
            <h3>Song: {reveal ? currentSong.game : '????'}</h3>
            <audio controls autoplay src={currentSong && currentSong.url}></audio>
            <input value={guess} onChange={e => setGuess(e.target.value)} />
            <button onClick={makeGuess}>Make a Guess</button>
            <h2>Scores:</h2>
            <ul>
              <ul>
    {Object.keys(members).map((key, index) => (
        <li key={index}>{key}: {members[key].score}</li>
    ))}
</ul>

            </ul>
        </div>
    );
}

export default Game;
