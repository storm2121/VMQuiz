import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import LobbyPage from "./LobbyPage";
import Lobby from "./Lobby";
import AuthWrapper from "./AuthWrapper";
import RootPage from "./RootPage"; // Add this line

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootPage />} /> // Replace LoginPage with RootPage
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lobby" element={<AuthWrapper><LobbyPage /></AuthWrapper>} />
        <Route path="/lobby/:lobbyId" element={<AuthWrapper><Lobby /></AuthWrapper>} />
      </Routes>
    </Router>
  );
}

export default App;
