import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import LobbyPage from "./LobbyPage";
import Lobby from "./Lobby";
import AuthWrapper from "./AuthWrapper";
import Game from "./game"; // Import the Game component
import RootPage from "./RootPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lobby" element={<AuthWrapper><LobbyPage /></AuthWrapper>} />
        <Route path="/lobby/:lobbyId" element={<AuthWrapper><Lobby /></AuthWrapper>} />
        <Route path="/game/:lobbyId" element={<Game />} /> {/* Add this route */}
      </Routes>
    </Router>
  );
}

export default App;
