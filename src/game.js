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
  const [isGameActive, setIsGameActive] = useState(false); // New line

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
  const initializeMembers = async () => {
    console.log(`Initializing members for lobby: ${lobbyId}`);

      const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
      const membersSnapshot = await get(membersRef);
      const membersData = membersSnapshot.val() || {};
      console.log(`[Game] Current members data before initialization:`, membersData);

      for (const userId in membersData) {
        console.log(`[Game] Checking member: ${userId}`);

          if (!membersData[userId].points || !membersData[userId].hasGuessed) {
            console.log(`[Game] Setting initial points and hasGuessed for member: ${userId}`);

              await set(ref(db, `/lobbies/${lobbyId}/members/${userId}`), { points: 0, hasGuessed: false });
          }
      }
      
      console.log(`[Game] Members initialization completed for lobby: ${lobbyId}`);

      setMembers(Object.entries(membersData).map(([userId]) => ({
          name: userId,
          points: membersData[userId].points || 0,
          hasGuessed: membersData[userId].hasGuessed || false,
      })));
  };

  initializeMembers();

  const membersRef = ref(db, `/lobbies/${lobbyId}/members`);
  const memSubscription = onValue(membersRef, (snapshot) => {
      const membersData = snapshot.val() || {};
      setMembers(Object.entries(membersData).map(([userId, userData]) => ({
          name: userId,
          points: userData.points || 0,
          hasGuessed: userData.hasGuessed || false,
      })));
  });

  return () => {
      off(membersRef, memSubscription);
  };
}, [lobbyId]);
useEffect(() => {
  // Lobby Settings
  const lobbySettingsRef = ref(db, `/lobbies/${lobbyId}/settings`);
  const settingSubscription = onValue(lobbySettingsRef, async (snapshot) => {
      const settings = snapshot.val();
      if (settings){
        setGuessTime(settings.guessTime);
        const fetchedSongs = await fetchSongs(settings.songGenre);
        if (fetchedSongs.length > 0 && !isGameActive) {
            console.log("Game is not active, starting game.");
            executeGameLogic(fetchedSongs, settings.guessTime, settings.numSongs);
        }
      }
      
  });

  return () => {
      off(lobbySettingsRef, settingSubscription);
  };
}, [lobbyId, isGameActive]);
useEffect(() => {
  const lobbySongsRef = ref(db, `/lobbies/${lobbyId}/currentSong`);
  const songSubscription = onValue(lobbySongsRef, (snapshot) => {
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
      clearInterval(countdownIntervalRef.current);
      off(lobbySongsRef, songSubscription);
  };
}, [lobbyId, guessTime]);


useEffect(() => {
  return () => {
      clearInterval(gameIntervalRef.current);
      console.log("this is the clearinterval function")
      setIsGameActive(false);
  };
}, []);


  useEffect(() => {

    if (isGameEnded) {
      console.log("Game ended state detected, navigating to lobby.");

      navigate(`/lobby/${lobbyId}`);
    }
  },  [isGameEnded]);


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

  const executeGameLogic = (songs, guessTime, numSongs) => {
    if (!isGameActive) {
      console.log("Setting game to active.");
      setIsGameActive(true);
      return; // Early return. The next cycle should continue the game logic.
  }

    console.log("Executing game logic. isGameActive:", isGameActive);

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
        console.log(isGameActive,rounds,numSongs,playedSongs.size,songs.length);
        console.log("Game is ending due to one of the conditions met.");

        endGame();
      } else {
        console.log("Game continues to next round.");
        playRound();
      }
    }, (guessTime + 3) * 1000);
    
};



useEffect(() => {
  const runAsync = async () => {
      const lobbySettingsRef = ref(db, `/lobbies/${lobbyId}/settings`);
      const settingsSnapshot = await get(lobbySettingsRef);
      const settings = settingsSnapshot.val();

      if (isGameActive && settings) {
          const fetchedSongs = await fetchSongs(settings.songGenre);
          executeGameLogic(fetchedSongs, settings.guessTime, settings.numSongs);
      }
  };
  runAsync();
}, [isGameActive, lobbyId]);



  
  const endGame = async () => {
    clearInterval(gameIntervalRef.current);
    console.log("EndGame function initiated. Stopping game.");
    const gameStartedRef = ref(db, `/lobbies/${lobbyId}/gameStarted`);
    await set(gameStartedRef, false);
    
    setIsGameEnded(prevState => true);  // Use prevState for clarity
    console.log("This is the endgame function")
    setIsGameActive(prevState => false);  // Use prevState for clarity

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
<div className="game-container">

<div className="scoreboard">
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

<div className="game-actions">
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
</div>

<div className="audio-container">
  <h2>Now Playing: {currentSongName}</h2>
  <audio controls ref={audioRef} src={currentSongUrl} autoPlay loop />
</div>

</div>

  );
}

export default Game;