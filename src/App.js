import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import LobbyPage from "./LobbyPage";
import Lobby from "./Lobby";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/lobby/:lobbyId" element={<Lobby />} />
      </Routes>
    </Router>
  );
}

export default App;
