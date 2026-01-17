import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { SignInPage, SignUpPage, ProtectedRoute, UserButton } from './components/Auth';
import { useUser } from '@clerk/clerk-react';
import Background from './components/Background';
import LandingPage from './components/LandingPage';
import ScentProfile from './components/ScentProfile';
import MyCollection from './components/MyCollection';
import FragranceDetails from './components/FragranceDetails';
import SearchResultsPage from './components/SearchResultsPage';
import UserProfile from './components/UserProfile';
import ScanFragrance from './components/ScanFragrance';
import ChatPage from './components/ChatPage';
import Swipe from './components/Swipe';
import SwipeResults from './components/SwipeResults';

const Navigation = () => {
  const location = useLocation();
  const { isSignedIn } = useUser();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Close menu when route changes
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Discovery' },
    { path: '/chat', label: 'Chat' },
    { path: '/account', label: 'Profile' },
    { path: '/my-collection', label: 'Collection' },
    { path: '/scan', label: 'Scan' },
    { path: '/swipe', label: 'Swipe' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo Section */}
          <Link to="/" className="flex items-center group no-underline z-50">
            <span className="text-2xl sm:text-3xl md:text-5xl font-serif italic text-white tracking-wide group-hover:text-blue-300 transition-colors leading-none">Scentir</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button & Auth */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Auth Buttons */}
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 md:w-10 md:h-10",
                    userButtonPopoverCard: "shadow-xl bg-gray-800 border border-gray-700"
                  }
                }}
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/sign-in"
                  className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-up"
                  className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 border border-blue-500/50"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-800/50 focus:outline-none z-50 transition-colors"
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <div className="w-6 h-6 flex items-center justify-center relative">
                {isMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <div className="w-6 h-5 relative flex flex-col justify-between">
                    <span className="w-full h-0.5 bg-current rounded-full" />
                    <span className="w-full h-0.5 bg-current rounded-full" />
                    <span className="w-full h-0.5 bg-current rounded-full" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <div 
        className={`md:hidden absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl transition-all duration-300 ease-out origin-top overflow-hidden ${
          isMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'
        }`}
      >
        <div className="px-3 py-4">
          <div className="flex flex-wrap justify-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Backdrop blur effect for the rest of the screen */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 top-14 md:top-16 bg-black/20 backdrop-blur-[2px] z-[-1] md:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Background>
            <Navigation />
            <LandingPage />
          </Background>
        </ProtectedRoute>
      } />
      <Route path="/scent-profile" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <ScentProfile />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/my-collection" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <MyCollection />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/search" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <SearchResultsPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/fragrance/:id" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <FragranceDetails />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/chat" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <ChatPage />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/scan" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <ScanFragrance />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/swipe-results" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <SwipeResults />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/swipe" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <Swipe />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <div className="pt-16 md:pt-16">
            <Navigation />
            <UserProfile />
          </div>
        </ProtectedRoute>
      } />

      {/* Clerk Auth Routes - catch-all for Clerk's auth flow */}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
    </Routes>
  );
}

export default App;
