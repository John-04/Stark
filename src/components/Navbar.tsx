import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, User, Crown, LogOut, ChevronDown, Trophy, BarChart3, Database, Sparkles, Zap, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConnectWallet from './ConnectWallet';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, signOut, disconnect } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    if (user?.authMethod === 'wallet') {
      await disconnect();
    } else {
      signOut();
    }
    setShowUserMenu(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: '/query', label: 'Query Editor', icon: Code2 },
    { to: '/dashboard', label: 'Dashboard Builder', icon: BarChart3 },
    { to: '/starknet-dashboard', label: 'Starknet Dashboard', icon: Zap },
    { to: '/bounties', label: 'Bounties', icon: Trophy },
    { to: '/docs', label: 'Docs', icon: BookOpen },
  ];

  return (
    <motion.nav 
      className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-900/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center space-x-3 group">
                <motion.div 
                  className="relative p-2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl group-hover:shadow-xl transition-all duration-300"
                  whileHover={{ 
                    rotate: 360,
                    boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.4)"
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <Database className="h-6 w-6 text-white" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20"
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </motion.div>
                <motion.span 
                  className="font-black text-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
                  whileHover={{
                    backgroundImage: "linear-gradient(45deg, #3B82F6, #8B5CF6, #EC4899)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  Starklytics
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 flex-grow justify-center">
            {user && navLinks.map(({ to, label, icon: Icon }, index) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={to}
                    className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                      isActive(to)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <motion.div
                      animate={isActive(to) ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.div>
                    {label}
                    {isActive(to) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl opacity-20"
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    )}
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {user ? (
              <>
                {/* Premium Badge */}
                {!user.isPremium && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ 
                      scale: 1.1,
                      boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      to="/premium" 
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                    >
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Crown className="h-4 w-4" />
                      </motion.div>
                      <span>Upgrade</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 opacity-0 hover:opacity-20"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </Link>
                  </motion.div>
                )}

                {/* Create Bounty Button */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(34, 197, 94, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/create-bounty"
                    className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Trophy className="w-4 h-4" />
                    </motion.div>
                    Create
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 hover:opacity-20"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </Link>
                </motion.div>

                {/* User Menu */}
                <div className="relative">
                  <motion.button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div 
                      className="h-10 w-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
                      whileHover={{ 
                        boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.4)",
                        scale: 1.1
                      }}
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{
                        backgroundSize: "200% 200%"
                      }}
                    >
                      <span className="text-white font-black text-lg">
                        {user.name ? user.name.charAt(0).toUpperCase() : 
                         user.address ? user.address.slice(2, 4).toUpperCase() : 
                         user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-white/20 rounded-full"
                        animate={{
                          scale: [0, 2, 0],
                          opacity: [0, 0.3, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: showUserMenu ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-3 z-50 backdrop-blur-xl"
                      >
                        {/* User Info */}
                        <motion.div 
                          className="px-4 py-3 border-b border-gray-200 dark:border-gray-700"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {user.name || 'Anonymous User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {user.email || (user.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : '')}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <motion.span 
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                              whileHover={{ scale: 1.05 }}
                            >
                              {user.authMethod}
                            </motion.span>
                            {user.isPremium && (
                              <motion.span 
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm"
                                whileHover={{ scale: 1.05 }}
                                animate={{
                                  boxShadow: [
                                    "0 0 0 0 rgba(245, 158, 11, 0.4)",
                                    "0 0 0 8px rgba(245, 158, 11, 0)",
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <motion.div
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                  <Crown className="h-3 w-3" />
                                </motion.div>
                                Premium
                              </motion.span>
                            )}
                          </div>
                        </motion.div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          {[
                            { to: '/portfolio', label: 'Portfolio', icon: User },
                            { to: '/profile', label: 'Profile Settings', icon: User },
                          ].map((item, index) => (
                            <motion.div
                              key={item.to}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + index * 0.05 }}
                            >
                              <Link
                                to={item.to}
                                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <motion.div
                                  className="group-hover:scale-110 transition-transform duration-200"
                                >
                                  <item.icon className="h-4 w-4 mr-3" />
                                </motion.div>
                                {item.label}
                              </Link>
                            </motion.div>
                          ))}
                          
                          {!user.isPremium && (
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Link
                                to="/premium"
                                className="flex items-center px-4 py-3 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 transition-all duration-200 group"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <motion.div
                                  className="group-hover:scale-110 transition-transform duration-200"
                                  animate={{ rotate: [0, 360] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                >
                                  <Crown className="h-4 w-4 mr-3 text-yellow-500" />
                                </motion.div>
                                Upgrade to Premium
                                <motion.div
                                  className="ml-auto"
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <Sparkles className="h-3 w-3 text-yellow-500" />
                                </motion.div>
                              </Link>
                            </motion.div>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                          <motion.button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 group"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            whileHover={{ x: 5 }}
                          >
                            <motion.div
                              className="group-hover:scale-110 transition-transform duration-200"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                            </motion.div>
                            Sign Out
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signin"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-4 py-2 text-sm font-bold transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  >
                    Sign In
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                  >
                    <span className="relative z-10">Sign Up</span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 hover:opacity-20"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  <ConnectWallet />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close menu */}
      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
