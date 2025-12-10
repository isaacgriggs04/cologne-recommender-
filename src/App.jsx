import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FragranceProvider } from './context/FragranceContext';
import Background from './components/Background';
import LandingPage from './components/LandingPage';
import ScentProfile from './components/ScentProfile';
import MyCollection from './components/MyCollection';
import FragranceDetails from './components/FragranceDetails';
import SearchResultsPage from './components/SearchResultsPage';
import UserProfile from './components/UserProfile';
import ScanFragrance from './components/ScanFragrance';

import ChatPage from './components/ChatPage';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <>
      <Link to="/" className="fixed top-6 left-6 z-[100] flex items-center gap-3 group no-underline">
        <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-serif text-xl italic shadow-lg group-hover:scale-105 transition-transform duration-300">
          S
        </div>
        <span className="text-2xl font-serif italic text-gray-900 tracking-wide group-hover:text-gray-700 transition-colors drop-shadow-sm">Scentir</span>
      </Link>

      <nav className="fixed top-6 right-6 z-[100] flex gap-3">
        <Link
          to="/"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            location.pathname === '/'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Chat
        </Link>
        <Link
          to="/scent-profile"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            location.pathname === '/scent-profile'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Scent Profile
        </Link>
        <Link
          to="/my-collection"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            location.pathname === '/my-collection'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          My Collection
        </Link>
        <Link
          to="/scan"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            location.pathname === '/scan'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Scan
        </Link>
        <Link
          to="/account"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            location.pathname === '/account'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Account
        </Link>
      </nav>
    </>
  );
};

function App() {
  return (
    <FragranceProvider>
      <Router>
        <Routes>
        <Route
          path="/"
          element={
            <Background>
              <Navigation />
              <LandingPage />
            </Background>
          }
        />
        <Route
          path="/scent-profile"
          element={
            <>
              <Navigation />
              <ScentProfile />
            </>
          }
        />
        <Route
          path="/my-collection"
          element={
            <>
              <Navigation />
              <MyCollection />
            </>
          }
        />
        <Route
          path="/search"
          element={
            <>
              <Navigation />
              <SearchResultsPage />
            </>
          }
        />
        <Route
          path="/fragrance/:id"
          element={
            <>
              <Navigation />
              <FragranceDetails />
            </>
          }
        />
        <Route
          path="/chat"
          element={
            <>
              <Navigation />
              <ChatPage />
            </>
          }
        />
        <Route
          path="/scan"
          element={
            <>
              <Navigation />
              <ScanFragrance />
            </>
          }
        />
        <Route
          path="/account"
          element={
            <>
              <Navigation />
              <UserProfile />
            </>
          }
        />
        </Routes>
      </Router>
    </FragranceProvider>
  );
}

export default App;
