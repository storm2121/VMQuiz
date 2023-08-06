import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isGameEnded, setIsGameEnded] = useState(false); // Add this line

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
      isMountedRef.current = false; // Add this line
      off(membersRef);
      clearInterval(gameIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [lobbyId, navigate, guessTime]);

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
    const playRound = async () => {
      if (rounds >= numSongs || playedSongs.size >= songs.length) {
        clearInterval(gameIntervalRef.current);
        navigate(`/lobby/${lobbyId}`);
        return;
      }
  
      let randomSong;
      do {
        
        randomSong = songs[Math.floor(Math.random() * songs.length)];
      } while (playedSongs.has(randomSong.url));  // use url for comparison
      playedSongs.add(randomSong.url);  // add url to the set
  
      await set(lobbySongsRef, {
        url: randomSong.url,
        game: randomSong.game
      });
  
      // reset hasGuessed for all members at the start of each round
      const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
      const membersSnapshot = await get(membersRef);
      const membersData = membersSnapshot.val() || {};
      
      for (const userId in membersData) {
        await set(ref(db, `/lobbies/${lobbyId}/members/${userId}`), { ...membersData[userId], hasGuessed: false });
      }
  
      rounds++;
    };

    playRound();
    gameIntervalRef.current = setInterval(playRound, (guessTime + 3) * 1000);
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
      <input type="text" value={guess} onChange={handleGuessChange} />
      {
        filteredGameNames.length > 0 &&
        <ul>
          {filteredGameNames.map((gameName, index) => (
            <li key={index} onClick={() => setGuess(gameName)}>{gameName}</li>
          ))}
        </ul>
      }
      <button onClick={submitGuess}>Submit Guess</button>
      <div>Current Song: {currentSongName}</div>
      <audio ref={audioRef} controls src={currentSongUrl} autoPlay></audio>
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
