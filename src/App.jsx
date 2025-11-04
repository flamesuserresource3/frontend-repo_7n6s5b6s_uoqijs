import React, { useEffect, useState } from 'react';
import HeroSection from './components/HeroSection';
import AuthPanel from './components/AuthPanel';
import UploadTranscribe from './components/UploadTranscribe';
import HistoryDashboard from './components/HistoryDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('aisubs_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (entry) => {
    const next = [entry, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem('aisubs_history', JSON.stringify(next));
  };

  const handleSelectHistory = (item) => {
    // Scroll to the viewer and show this text by dispatching a custom event
    window.dispatchEvent(new CustomEvent('aisubs_show_transcription', { detail: item }));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aisubs_history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      <HeroSection />

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 -mt-10 md:-mt-16 relative z-10 space-y-6">
        <AuthPanel onAuthChange={setCurrentUser} />

        <UploadTranscribe
          currentUser={currentUser}
          onSaveHistory={saveHistory}
        />

        <HistoryDashboard
          items={history}
          onSelect={handleSelectHistory}
          onClear={handleClearHistory}
        />

        <FooterNote />
      </main>
    </div>
  );
}

function FooterNote() {
  return (
    <div className="w-full text-center text-xs text-white/50 py-8">
      Built with a modern, responsive UI. Connect your backend at VITE_BACKEND_URL to enable real transcriptions.
    </div>
  );
}
