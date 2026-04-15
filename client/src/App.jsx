import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './views/Home';
import Community from './views/Community';
import Search from './views/Search';
import Profile from './views/Profile';
import Recommendations from './views/Recommendations';
import Settings from './views/Settings';
import Login from './views/Login';
import Register from './views/Register';
import ListView from './views/ListView';
import Lists from './views/Lists';
import ItemDetail from './views/ItemDetail';
import UserProfile from './views/UserProfile';
import Chat from './views/Chat';
import ToastSystem from './components/ToastSystem';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { io } from 'socket.io-client';
import './index.css'; 
import './i18n';

// Connect to Node.js Socket server
export const socket = io(import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000', {
  withCredentials: true
});

/**
 * PrivateRoute: redirects to /login if user is not authenticated.
 * Returns a minimal inline loader during auth check to avoid blanking the page.
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
      <div className="loader" style={{ width: '32px', height: '32px' }}></div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const googleClientId = "708004000165-6ub0a6r0cselkeutlsl714kcqgndoal3.apps.googleusercontent.com"; 

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <SocketHandler />
          <ToastSystem />
          <MainLayout />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

const MainLayout = () => {
    const { isAuthenticated, loading } = useAuth();

    // Always show the full chrome (Header + Navbar) if authenticated,
    // even during re-auth checks (e.g. after Spotify OAuth redirect).
    // Only show the full-screen loading spinner on the very first app load.
    if (loading && !isAuthenticated) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className={`app-container ${!isAuthenticated ? 'no-ui' : ''}`}>
            {isAuthenticated && <Header />}
            <main className="main-content">
                <Routes>
                    {/* Public or Guarded routes */}
                    <Route path="/" element={isAuthenticated ? <Home /> : <Login />} />
                    <Route path="/search" element={isAuthenticated ? <Search /> : <Navigate to="/" />} />
                    <Route path="/community" element={isAuthenticated ? <Community /> : <Navigate to="/" />} />
                    <Route path="/recommendations" element={isAuthenticated ? <Recommendations /> : <Navigate to="/" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes */}
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Settings />
                        </PrivateRoute>
                    } />
                    <Route path="/lists" element={
                        <PrivateRoute>
                            <Lists />
                        </PrivateRoute>
                    } />
                    <Route path="/list/:id" element={
                        <PrivateRoute>
                            <ListView />
                        </PrivateRoute>
                    } />
                    <Route path="/chat/:friendId" element={
                        <PrivateRoute>
                            <Chat />
                        </PrivateRoute>
                    } />
                    <Route path="/movie/:id" element={
                        <PrivateRoute>
                            <ItemDetail type="movie" />
                        </PrivateRoute>
                    } />
                    <Route path="/song/:id" element={
                        <PrivateRoute>
                            <ItemDetail type="song" />
                        </PrivateRoute>
                    } />
                    <Route path="/user/:id" element={
                        <PrivateRoute>
                            <UserProfile />
                        </PrivateRoute>
                    } />
                </Routes>
            </main>
            {isAuthenticated && <Navbar />}
        </div>
    );
};

const SocketHandler = () => {
    const { user } = useAuth();
    
    useEffect(() => {
        if (user) {
            socket.emit('register_user', user.id);
            
            socket.on('friend_request', (data) => {
                window.dispatchEvent(new CustomEvent('toast', { 
                    detail: { 
                        title: 'Nueva solicitud', 
                        message: `${data.from} quiere ser tu amigo`, 
                        type: 'friend_request' 
                    } 
                }));
            });

            socket.on('friend_accepted', (data) => {
                window.dispatchEvent(new CustomEvent('toast', { 
                    detail: { 
                        title: '¡Solicitud aceptada!', 
                        message: `${data.friend_name} ahora es tu amigo`, 
                        type: 'friend_accepted' 
                    } 
                }));
            });

            socket.on('user_status', (data) => {
                // Global status update - other components can listen if they want
                // For now just keep it in socket internal state if needed
            });
        }
        
        return () => {
            socket.off('friend_request');
            socket.off('friend_accepted');
            socket.off('user_status');
        };
    }, [user]);
    
    return null;
};

export default App;
