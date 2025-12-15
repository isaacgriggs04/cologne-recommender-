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
// import logo from './assets/scentir-logo.png'; // Logo file doesn't exist

const Navigation = () => {
  const location = useLocation();

  return (
    <>
      <Link to="/" className="fixed top-3 left-3 sm:top-6 sm:left-6 z-[100] flex items-center gap-2 sm:gap-3 group no-underline">
        <div className="logo-mobile h-8 w-8 sm:h-24 sm:w-24 bg-gray-900 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300 drop-shadow-lg">
          <span className="text-white font-bold text-sm sm:text-lg">SC</span>
        </div>
        <span className="text-lg sm:text-2xl font-serif italic text-gray-900 tracking-wide group-hover:text-gray-700 transition-colors drop-shadow-sm">Scentir</span>
      </Link>

      <nav className="nav-mobile nav-tablet nav-desktop fixed top-3 right-3 sm:top-6 sm:right-6 z-[100] flex gap-1 sm:gap-3">
        <Link
          to="/"
          className={`nav-link px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-target ${
            location.pathname === '/'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Discovery
        </Link>
        <Link
          to="/chat"
          className={`nav-link px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-target ${
            location.pathname === '/chat'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Chat
        </Link>
        <Link
          to="/scent-profile"
          className={`nav-link px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-target ${
            location.pathname === '/scent-profile'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Profile
        </Link>
        <Link
          to="/my-collection"
          className={`nav-link px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-target ${
            location.pathname === '/my-collection'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Collection
        </Link>
        <Link
          to="/scan"
          className={`nav-link px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 touch-target ${
            location.pathname === '/scan'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200'
          }`}
        >
          Scan
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
