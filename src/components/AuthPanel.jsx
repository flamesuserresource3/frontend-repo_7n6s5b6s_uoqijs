import React, { useState, useEffect } from 'react';
import { User, LogIn, LogOut } from 'lucide-react';

export default function AuthPanel({ onAuthChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('aisubs_user');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const persistUser = (user) => {
    localStorage.setItem('aisubs_user', JSON.stringify(user));
    setCurrentUser(user);
    onAuthChange?.(user);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    // Demo-only auth using localStorage; replace with real API as needed
    const usersKey = 'aisubs_users';
    const users = JSON.parse(localStorage.getItem(usersKey) || '{}');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (mode === 'signup') {
      if (users[email]) {
        setError('Account already exists. Try logging in.');
        return;
      }
      users[email] = { email, password, createdAt: Date.now() };
      localStorage.setItem(usersKey, JSON.stringify(users));
      persistUser({ email });
    } else {
      if (!users[email] || users[email].password !== password) {
        setError('Invalid credentials');
        return;
        }
      persistUser({ email });
    }
    setEmail('');
    setPassword('');
  };

  const handleLogout = () => {
    localStorage.removeItem('aisubs_user');
    setCurrentUser(null);
    onAuthChange?.(null);
  };

  if (currentUser) {
    return (
      <div className="w-full flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white text-sm">Signed in as</p>
            <p className="text-white/90 font-medium">{currentUser.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/10 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-white font-semibold">{mode === 'login' ? 'Login' : 'Create an account'}</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/60">{mode === 'login' ? "Don't have an account?" : 'Already a member?'}</span>
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-indigo-300 hover:text-indigo-200 underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/40"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
        >
          {mode === 'login' ? 'Login' : 'Sign up'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
