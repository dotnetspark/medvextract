// frontend/src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Transcript from './components/Transcript';
import TranscriptForm from './components/TranscriptForm';
import TaskDisplay from './components/TaskDisplay';
import { useTaskStore } from './store';

const SPLASH_TEXT = `MedVextract is an AI-powered system to aid VetRec extracting veterinary SOAP notes, follow-up tasks, medication instructions, client reminders, and veterinarian to-dos from consult transcripts. Built with BAML for LLM-powered extraction, FastAPI for the backend, and React for the frontend, it supports Practice Management System (PiMS) integration (e.g., Ezyvet), HIPAA/SOC 2 compliance, and scalability for multi-clinic veterinary practices.`;

const Splash: React.FC<{ onFinish: () => void; fadeOut: boolean }> = ({ onFinish, fadeOut }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, fadeOut ? 700 : 3000); // 700ms for fade-out, 3s for initial display
    return () => clearTimeout(timer);
  }, [onFinish, fadeOut]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-blue-50 bg-opacity-100 ${fadeOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="max-w-2xl mx-auto p-8 rounded-2xl shadow-xl border border-blue-100 text-center">
        <Link to="/" className="text-4xl font-extrabold text-blue-900 mb-4 block hover:underline">Medvextract</Link>
        <p className="text-lg text-blue-800 leading-relaxed mt-2">{SPLASH_TEXT}</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { setTasks } = useTaskStore();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  const location = window.location.pathname;

  useEffect(() => {
    if (location !== '/') {
      setShowSplash(false);
    }
  }, [location]);

  useEffect(() => {
    if (fadeOutSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        setFadeOutSplash(false);
        window.history.replaceState({}, '', '/');
      }, 700); // match fade-out duration
      return () => clearTimeout(timer);
    }
  }, [fadeOutSplash]);

  const handleSplashFinish = () => {
    setFadeOutSplash(true);
  };

  return (
    <Router>
      {showSplash && location === '/' && <Splash onFinish={handleSplashFinish} fadeOut={fadeOutSplash} />}
      {!showSplash && (
        <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-start py-8">
          <header className="w-full max-w-5xl mx-auto px-4 mb-8">
            <Link to="/" className="text-4xl font-extrabold text-blue-900 text-center mb-2 block hover:underline">Medvextract</Link>
            <p className="text-lg text-blue-800 text-center mb-4">LLM-Powered Medical Visit Action Extraction System</p>
          </header>
          <main className="w-full px-4 flex-1" style={{ marginLeft: 10, marginRight: 10 }}>
            <Routes>
              <Route path="/" element={<Transcript />} />
              <Route path='/transcript-form' element={<TranscriptForm onSubmit={setTasks} />} />
              <Route path='/transcript-form/:taskId' element={<TranscriptForm onSubmit={setTasks} />} />
              <Route path="/task-display/:taskId" element={<TaskDisplay />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
};

export default App;