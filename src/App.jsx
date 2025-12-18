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

const Navigation = () => {
  const location = useLocation();
  const { isSignedIn } = useUser();

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
          <Link to="/" className="flex items-center group no-underline">
            <span className="text-5xl font-serif italic text-gray-900 tracking-wide group-hover:text-gray-700 transition-colors leading-none">Scentir</span>
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

          {/* Auth Buttons or User Profile */}
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl"
                }
              }}
            />
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                Sign Up
              </Link>
            </div>
          )}
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
        {!isSignedIn && (
          <div className="px-4 py-2 flex justify-center space-x-2 border-t border-gray-200/50">
            <Link
              to="/sign-in"
              className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="px-3 py-2 text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
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
