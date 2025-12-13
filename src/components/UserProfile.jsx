import React, { useState } from 'react';
import FloatingChatButton from './FloatingChatButton';

const UserProfile = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  // Mock user data for when logged in
  const user = {
    name: formData.name || "Isaac",
    email: formData.email || "isaac@example.com",
    avatar: `https://ui-avatars.com/api/?name=${formData.name || "Isaac"}&background=111827&color=fff`,
    joined: "December 2025",
    stats: {
      collection: 15,
      wishlist: 5,
      reviews: 12
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setIsLoggedIn(true);
    }, 500);
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 pt-24 flex justify-center">
        <div className="w-full max-w-4xl animate-fade-in">
          {/* Profile Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800"></div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="flex items-end">
                  <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-4 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-sm text-gray-500">Member since {user.joined}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <div className="text-2xl font-bold text-gray-900">{user.stats.collection}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Fragrances</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <div className="text-2xl font-bold text-gray-900">{user.stats.wishlist}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Wishlist</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-2xl">
                  <div className="text-2xl font-bold text-gray-900">{user.stats.reviews}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Reviews</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Account Settings</h2>
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="flex gap-4">
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Change</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="flex gap-4">
                  <input 
                    type="password" 
                    value="********" 
                    disabled 
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500"
                  />
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Reset</button>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Preferences</h3>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">Email Notifications</span>
                  <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">Public Profile</span>
                  <div className="w-11 h-6 bg-gray-900 rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 right-0.5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row animate-fade-in">
        <div className="p-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif italic text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-500">
              {isSignUp ? 'Join our community of fragrance enthusiasts' : 'Sign in to access your collection'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-0 transition-colors bg-gray-50 focus:bg-white text-gray-900"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-0 transition-colors bg-gray-50 focus:bg-white text-gray-900"
                placeholder="hello@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-0 transition-colors bg-gray-50 focus:bg-white text-gray-900"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl mt-6"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-gray-900 hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default UserProfile;

