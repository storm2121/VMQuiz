import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, off, set, get } from "firebase/database";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db, firestore, auth } from './firebase.js';
import { useNavigate, useParams } from 'react-router-dom';

function Game() {
  const [songs, setSongs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentSongName, setCurrentSongName] = useState("???");
  const [currentSongUrl, setCurrentSongUrl] = useState("");
  const [currentSongGame, setCurrentSongGame] = useState("");
  const [guess, setGuess] = useState("");
  const [members, setMembers] = useState([]);
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef();
  const gameIntervalRef = useRef();
  const countdownIntervalRef = useRef();

  useEffect(() => {
    const initializeMembers = async () => {
      const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
      const membersSnapshot = await get(membersRef);
      const membersData = membersSnapshot.val() || {};
      
      for (const userId in membersData) {
        if (!membersData[userId].points) {
          await set(ref(db, `/lobbies/${lobbyId}/members/${userId}`), { points: 0 });
        }
      }
      
      setMembers(Object.entries(membersData).map(([userId]) => ({
        name: userId,
        points: membersData[userId].points || 0,
      })));
    };

    initializeMembers();

    const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
    onValue(membersRef, (snapshot) => {
      const membersData = snapshot.val() || {};
      setMembers(Object.entries(membersData).map(([userId, userData]) => ({
        name: userId,
        points: userData.points || 0,
      })));
    });

    const lobbySettingsRef = ref(db, `/lobbies/${lobbyId}/settings`);
    onValue(lobbySettingsRef, async (snapshot) => {
      const settings = snapshot.val();
      const fetchedSongs = await fetchSongs(settings.songGenre);
      if (fetchedSongs.length > 0) {
        startGame(fetchedSongs, settings.guessTime, settings.numSongs);
      }
    });

    return () => {
      off(membersRef);
      clearInterval(gameIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [lobbyId, navigate]);

  // ... Rest of the code ...

  const fetchSongs = async (songGenre) => {
    const songsRef = collection(firestore, '/songs');
    const q = query(songsRef, where('songGenre', '==', songGenre));
    const querySnapshot = await getDocs(q);
    const filteredSongs = [];

    querySnapshot.forEach((doc) => {
      filteredSongs.push(doc.data());
    });

    setSongs(filteredSongs);
    return filteredSongs;
  };

  const startGame = (songs, guessTime, numSongs) => {
    let rounds = 0;
    const playedSongs = new Set();
    const playRound = () => {
      if (rounds >= numSongs || playedSongs.size >= songs.length) {
        clearInterval(gameIntervalRef.current);
        navigate(`/lobby/${lobbyId}`);
        return;
      }

      let randomSong;
      do {
        randomSong = songs[Math.floor(Math.random() * songs.length)];
      } while (playedSongs.has(randomSong.url));
      playedSongs.add(randomSong.url);

      setCurrentSongUrl(randomSong.url);
      setCurrentSongGame(randomSong.game);
      setTimeLeft(guessTime);

      clearInterval(countdownIntervalRef.current); // Clear previous interval
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prevTimeLeft => {
          if (prevTimeLeft <= 1) {
            clearInterval(countdownIntervalRef.current);
            endRound();
          }
          return prevTimeLeft - 1;
        });
      }, 1000);

      rounds++;
    };

    playRound();
    gameIntervalRef.current = setInterval(playRound, (guessTime + 5) * 1000);
  };

  const endRound = () => {
    setCurrentSongName(currentSongGame);
  };

  const submitGuess = async () => {
    try {
      if (auth.currentUser && guess === currentSongGame) {
        const email = auth.currentUser.email;
        const userId = email.split('@')[0];
        const memberRef = ref(db, `/lobbies/${lobbyId}/members/${userId}`);
        const memberSnapshot = await get(memberRef);
        const memberData = memberSnapshot.val() || { points: 0 };
        const memberPoints = memberData.points + 1;
        await set(memberRef, { points: memberPoints });
      }
  
      setGuess("");
    } catch (error) {
      console.error("Error submitting guess:", error);
    }
  };

  useEffect(() => {
    if (currentSongUrl) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [currentSongUrl]);

  return (
    <div>
      <h1>Guess the Song!</h1>
      <div>Time left: {timeLeft}</div>
      <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} />
      <button onClick={submitGuess}>Submit Guess</button>
      <div>Current Song: {currentSongName}</div>
      <audio ref={audioRef} controls src={currentSongUrl}></audio>
      <button onClick={() => navigate(`/lobby/${lobbyId}`)}>Back to Lobby</button>
      <div>
        <h2>Members:</h2>
        {members.map(member => (
          <div key={member.name}>{member.name}: {member.points || 0} points</div>
        ))}
      </div>
    </div>
  );
}

export default Game;
