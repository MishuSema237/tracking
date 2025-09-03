import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import ThemeToggle from './components/ThemeToggle';
import Navbar from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Track from './pages/Track';
import Login from './pages/Login';
import AdministrationAndDevelopment from './pages/AdministrationAndDevelopment';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { AuthProvider } from './contexts/AuthContext';
import FAQ from './pages/FAQ';
import { TrackingProvider } from './contexts/TrackingContext';
import LiveChat from './components/LiveChat';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TrackingProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
              <ToastContainer position="top-right" />
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/track" element={<Track />} />
                  <Route path="/track/:trackingNumber" element={<Track />} />
                  <Route path="/administration_and_development/login" element={<Login />} />
                  <Route
                    path="/administration_and_development"
                    element={
                      <PrivateRoute>
                        <AdministrationAndDevelopment />
                      </PrivateRoute>
                    }
                  />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <ThemeToggle />
              <Footer />
            </div>
            <LiveChat />
          </Router>
        </TrackingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App; 