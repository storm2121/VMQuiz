import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase.js";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.currentUser) {
      navigate("/lobby");
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        navigate("/lobby");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("Error code: ", errorCode);
        console.log("Error message: ", errorMessage);
        alert("Failed to log in. Please check your email and password.");
      });
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit">Log In</button>
      </form>
      <button onClick={handleRegisterClick}>Register</button>
    </div>
  );
}

export default LoginPage;
