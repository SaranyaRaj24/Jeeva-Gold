
import React, { useState } from "react";
import logo from "../../Assets/logo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Home.css";
import { BACKEND_SERVER_URL } from "../../Config/Config";

function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BACKEND_SERVER_URL}/api/auth/login`, {
        username,
        password,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userRole", res.data.role); 
        navigate("/customer");
      } else {
        setError("Invalid username or password.");
      }
    } catch (err) {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="home-container">
      <div className="left-side">
        <img src={logo} alt="Logo" className="large-logo" />{" "}
      </div>
      <div className="right-side">
        <div className="login-box">
          <div className="login-header">
            <i className="fas fa-user-circle"></i>
            <h2>Login</h2>
          </div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="password-toggle-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}{" "}
                </span>
              </div>
            </div>
            {error && <div className="error-message">{error}</div>}{" "}
            <button type="submit" className="submit-btn">
              Sign In
            </button>
          </form>
          <div className="login-footer">
          
            <a href="/register">Sign Up</a>
          </div>
        </div> 
      </div>
    </div>
  );
}

export default Home;
