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
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import './App.css'; 
import './i18n';

function App() {
  const googleClientId = "708004000165-6ub0a6r0cselkeutlsl714kcqgndoal3.apps.googleusercontent.com"; 

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
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
              </Routes>
            </main>
            <Navbar />
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
