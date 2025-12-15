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

  // Mock user data - in a real app, this would come from auth context
  const user = {
    name: "Isaac",
    avatar: "https://ui-avatars.com/api/?name=Isaac&background=111827&color=fff",
  };

  const navItems = [
    { path: '/', label: 'Discovery' },
    { path: '/chat', label: 'Chat' },
    { path: '/scent-profile', label: 'Profile' },
    { path: '/my-collection', label: 'Collection' },
    { path: '/scan', label: 'Scan' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group no-underline">
            <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg">
              <span className="text-white font-bold text-lg">SC</span>
            </div>
            <span className="text-xl font-serif italic text-gray-900 tracking-wide group-hover:text-gray-700 transition-colors">Scentir</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Profile Image */}
          <Link
            to="/account"
            className="flex items-center gap-3 group no-underline"
          >
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden shadow-sm group-hover:border-gray-300 transition-colors">
              <img
                src={user.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {user.name}
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-lg">
        <div className="px-4 py-2 flex justify-center space-x-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
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
            <div className="pt-16 md:pt-16">
              <Navigation />
              <ScentProfile />
            </div>
          }
        />
        <Route
          path="/my-collection"
          element={
            <div className="pt-16 md:pt-16">
              <Navigation />
              <MyCollection />
            </div>
          }
        />
        <Route
          path="/search"
          element={
            <div className="pt-16 md:pt-16">
              <Navigation />
              <SearchResultsPage />
            </div>
          }
        />
        <Route
          path="/fragrance/:id"
          element={
            <div className="pt-16 md:pt-16">
              <Navigation />
              <FragranceDetails />
            </div>
          }
        />
        <Route
          path="/chat"
          element={
            <div className="pt-16 md:pt-16">
              <Navigation />
              <ChatPage />
            </div>
          }
        />
        <Route
          path="/scan"
          element={
            <div className="pt-16 md:pt-16">
              <Navigation />
              <ScanFragrance />
            </div>
          }
        />
        <Route
          path="/account"
          element={
            <div className="pt-16 md:pt-16">
              <Navigation />
              <UserProfile />
            </div>
          }
        />
        </Routes>
      </Router>
    </FragranceProvider>
  );
}

export default App;
