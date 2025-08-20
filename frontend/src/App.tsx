import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Transcript from './pages/Transcript';
import Sidebar from './components/Sidebar';
import { Clinics } from './pages/Clinics';
import { Veterinarians } from './pages/Veterinarians';
import { Patients } from './pages/Patients';
import { useTaskStore } from './store';
import GlobalHeader from './components/GlobarHeader';

const SPLASH_TEXT = `MedVextract is an AI-powered system to aid VetRec extracting veterinary SOAP notes, follow-up tasks, medication instructions, client reminders, and veterinarian to-dos from consult transcripts. Built with BAML for LLM-powered extraction, FastAPI for the backend, and React for the frontend, it supports Practice Management System (PiMS) integration (e.g., Ezyvet), HIPAA/SOC 2 compliance, and scalability for multi-clinic veterinary practices.`;

const Splash: React.FC<{ onFinish: () => void; fadeOut: boolean }> = ({ onFinish, fadeOut }) => {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), fadeOut ? 700 : 3000);
    return () => clearTimeout(timer);
  }, [onFinish, fadeOut]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-blue-50 ${fadeOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="max-w-2xl mx-auto p-8 rounded-2xl shadow-xl border border-blue-100 text-center">
        <Link to="/" className="text-4xl font-extrabold text-blue-900 mb-4 block hover:underline">Medvextract</Link>
        <p className="text-lg text-blue-800 leading-relaxed mt-2">{SPLASH_TEXT}</p>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { setTasks } = useTaskStore();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (location.pathname !== '/') {
      setShowSplash(false);
    }
  }, [location]);

  const handleSplashFinish = () => setFadeOutSplash(true);

  useEffect(() => {
    if (fadeOutSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        setFadeOutSplash(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [fadeOutSplash]);

  return (
    <>
      {showSplash && location.pathname === '/' && (
        <Splash onFinish={handleSplashFinish} fadeOut={fadeOutSplash} />
      )}
      {!showSplash && (
        <div className="min-h-screen flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <div className="flex-1 flex flex-col">
            <GlobalHeader onHamburger={() => setSidebarOpen(true)} />
            <main className="flex-1 bg-blue-50 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<Transcript />} />
                <Route path="/transcripts" element={<Transcript />} />
                <Route path="/clinics" element={<Clinics />} />
                <Route path="/veterinarians" element={<Veterinarians />} />
                <Route path="/patients" element={<Patients />} />
              </Routes>
            </main>
          </div>
        </div>
      )}
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;