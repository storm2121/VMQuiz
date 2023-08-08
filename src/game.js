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
  const [guessTime, setGuessTime] = useState(0);
  const [gameNames, setGameNames] = useState([]);
  const [filteredGameNames, setFilteredGameNames] = useState([]);
  const [isGameEnded, setIsGameEnded] = useState(false); // Add this line
  const [isGameActive, setIsGameActive] = useState(true); // New line

  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef();
  const gameIntervalRef = useRef();
  const countdownIntervalRef = useRef();
  const isMountedRef = useRef(true); // Add this line

  const navigateToLobby = useCallback(() => navigate(`/lobby/${lobbyId}`), [navigate, lobbyId]); // Add this line

  useEffect(() => {
    const fetchGameNames = async () => {
      const gameNamesRef = collection(firestore, '/songs');
      const gameNamesQuerySnapshot = await getDocs(gameNamesRef);
      const gameNames = [];

      gameNamesQuerySnapshot.forEach((doc) => {
        gameNames.push(doc.data().game);
      });

      setGameNames([...new Set(gameNames)]);
    };

    fetchGameNames();
  }, []);

  useEffect(() => {
    console.log("Members or lobby settings have changed. Starting initialization process.");

    const initializeMembers = async () => {
      const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
      const membersSnapshot = await get(membersRef);
      const membersData = membersSnapshot.val() || {};
      
      for (const userId in membersData) {
        if (!membersData[userId].points || !membersData[userId].hasGuessed) {
          await set(ref(db, `/lobbies/${lobbyId}/members/${userId}`), { points: 0, hasGuessed: false });
        }
      }
      
      setMembers(Object.entries(membersData).map(([userId]) => ({
        name: userId,
        points: membersData[userId].points || 0,
        hasGuessed: membersData[userId].hasGuessed || false,
      })));
    };

   

    initializeMembers();

    const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
    onValue(membersRef, (snapshot) => {
      const membersData = snapshot.val() || {};
      setMembers(Object.entries(membersData).map(([userId, userData]) => ({
        name: userId,
        points: userData.points || 0,
        hasGuessed: userData.hasGuessed || false,
      })));
    });

    const lobbySettingsRef = ref(db, `/lobbies/${lobbyId}/settings`);
    onValue(lobbySettingsRef, async (snapshot) => {
      const settings = snapshot.val();
      setGuessTime(settings.guessTime);
      const fetchedSongs = await fetchSongs(settings.songGenre);
      if (fetchedSongs.length > 0) {
        // Make sure to only start the game if it's not already active
        if (!isGameActive) {
          console.log("Game is not active, starting game.");
          startGame(fetchedSongs, settings.guessTime, settings.numSongs);
        } else {
          console.log("Game is already active, not starting a new game.");
        }
      }
    });

    const lobbySongsRef = ref(db, `/lobbies/${lobbyId}/currentSong`);
    onValue(lobbySongsRef, (snapshot) => {
      const currentSongData = snapshot.val();

      if (currentSongData) {
        setTimeLeft(guessTime);
        setCurrentSongUrl(currentSongData.url);
        setCurrentSongGame(currentSongData.game);
        setCurrentSongName("???");

        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setTimeLeft(prevTimeLeft => {
            if (prevTimeLeft <= 1) {
              clearInterval(countdownIntervalRef.current);
              setCurrentSongName(currentSongData.game);
            }
            return prevTimeLeft - 1;
          });
        }, 1000);
      }
    });

    return () => {
      isMountedRef.current = false; // Add this line
      console.log("Component unmounted. isMountedRef:", isMountedRef.current);

      off(membersRef);
      off(lobbySongsRef);
      clearInterval(gameIntervalRef.current);
      clearInterval(countdownIntervalRef.current);
      setIsGameActive(false); // New line
      console.log("Cleanup done. isGameActive:", isGameActive);


    };
  }, [lobbyId, navigateToLobby, guessTime, isGameActive]);

  useEffect(() => {
    console.log("Game ended state detected, navigating to lobby.");

    if (isGameEnded) {
      console.log("Game ended state detected, navigating to lobby.");

      navigate(`/lobby/${lobbyId}`);
    }
  }, [isGameEnded, lobbyId, navigate]);


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
    if (isMountedRef.current) {
      setIsGameActive(true);
    }    console.log("StartGame function initiated. isGameActive:", isGameActive);

    const lobbySongsRef = ref(db, `/lobbies/${lobbyId}/currentSong`);
  
    let rounds = 0;
    const playedSongs = new Set();
    const playRound = async () => {
      let randomSong;
      do {
        
        randomSong = songs[Math.floor(Math.random() * songs.length)];
        console.log("Chose new song: ", randomSong.game);

      } while (playedSongs.has(randomSong.url));  // use url for comparison
      playedSongs.add(randomSong.url);  // add url to the set
  
      await set(lobbySongsRef, {
        url: randomSong.url,
        game: randomSong.game
      });
  
      rounds++;
    };
  
    playRound();
    console.log("Starting game with ", numSongs, " songs and ", guessTime, " seconds guess time.");

    gameIntervalRef.current = setInterval(async () => {
      console.log("Interval function started. Rounds:", rounds, "Played songs:", playedSongs.size, "isGameActive:", isGameActive);

      if (!isGameActive || rounds >= numSongs || playedSongs.size >= songs.length) {  
        console.log("Game is ending due to one of the conditions met.");

        endGame();
      } else {
        console.log("Game continues to next round.");
        playRound();
      }
    }, (guessTime + 3) * 1000);
    
  };
  
  const endGame = async () => {
    clearInterval(gameIntervalRef.current);
    console.log("EndGame function initiated. Stopping game.");
    const gameStartedRef = ref(db, `/lobbies/${lobbyId}/gameStarted`);
    await set(gameStartedRef, false);
    setIsGameEnded(true);
    setIsGameActive(false);  
    console.log("Game ended. isGameEnded:", isGameEnded, "isGameActive:", isGameActive);

  };

  const submitGuess = async () => {
    if (guess.toLowerCase() === currentSongGame.toLowerCase()) {
      const email = auth.currentUser.email;
      const userId = email.split('@')[0];
      const userRef = ref(db, `/lobbies/${lobbyId}/members/${userId}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();

      if (userData) {
        await set(userRef, {
          points: (userData.points || 0) + 1,
          hasGuessed: true,
        });
      }

      setGuess("");
    }
  };

  const handleGuessChange = (e) => {
    setGuess(e.target.value);
    setFilteredGameNames(
      gameNames.filter(gameName => gameName.toLowerCase().startsWith(e.target.value.toLowerCase()))
    );
  };

  return (
<div>
      <h1>Guess the Song!</h1>
      <div>Time left: {timeLeft}</div>
      <input type="text" value={guess} onChange={handleGuessChange} list="gameNames" />
      <datalist id="gameNames">
        {filteredGameNames.map((gameName, i) => (
          <option key={i} value={gameName} />
        ))}
      </datalist>
      <button onClick={submitGuess}>Submit Guess</button>
      <button onClick={endGame}>Leave Game</button>

      <h1>Song: {currentSongName}</h1>
      <audio controls ref={audioRef} src={currentSongUrl} autoPlay loop />
      <h1>Scoreboard</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {members.sort((a, b) => b.points - a.points).map((member, i) => (
            <tr key={i}>
              <td>{member.name}</td>
              <td>{member.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Game;