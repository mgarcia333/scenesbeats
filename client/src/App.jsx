import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Community from './views/Community';
import Profile from './views/Profile';
import Recommendations from './views/Recommendations';
import Settings from './views/Settings';
import Login from './views/Login';
import Register from './views/Register';
import ListView from './views/ListView';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { io } from 'socket.io-client';
import './App.css'; 
import './i18n';

// Connect to Node.js Socket server
export const socket = io(import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000', {
  withCredentials: true
});

function App() {
  const googleClientId = "708004000165-6ub0a6r0cselkeutlsl714kcqgndoal3.apps.googleusercontent.com"; 

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <SocketHandler />
          <div className="app-container">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/community" element={<Community />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/list/:id" element={<ListView />} />
              </Routes>
            </main>
            <Navbar />
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

const SocketHandler = () => {
    const { user } = useAuth();
    
    useEffect(() => {
        if (user) {
            console.log("Socket: Registering user", user.id);
            socket.emit('register_user', user.id);
        }
        
        socket.on('connect', () => console.log("Socket: Connected with ID", socket.id));
        socket.on('notification', (data) => console.log("Socket: Notification received", data));
        
        return () => {
            socket.off('connect');
            socket.off('notification');
        };
    }, [user]);
    
    return null;
};

export default App;
