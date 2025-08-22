import React, { useState } from 'react';
import { DollarSign, Info, AlertCircle, Coins, Trophy, Sparkles, Target, Zap, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import AnimatedInput from '../components/ui/AnimatedInput';
import { AutoSwapper } from '../components/Swap/AutoSwapper';

const CreateBounty = () => {
  const { user, provider, account } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    reward: '',
    currency: 'STRK',
    deadline: '',
    difficulty: 'Medium',
    tags: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center font-['Inter',sans-serif]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AnimatedCard className="p-12 max-w-md mx-auto" glow={true}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-6"
            >
              <Trophy className="w-16 h-16 text-blue-600 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please connect your wallet to create a bounty and start earning rewards.
            </p>
            <AnimatedButton variant="primary" size="lg" icon={Zap}>
              Connect Wallet
            </AnimatedButton>
          </AnimatedCard>
        </motion.div>
      </div>
    );
  }

  const platformFee = 10; // $10 USD
  const rewardAmount = parseFloat(formData.reward) || 0;
  const totalStake = rewardAmount + platformFee;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.requirements.trim()) newErrors.requirements = 'Requirements are required';
    if (!formData.reward || rewardAmount <= 0) newErrors.reward = 'Valid reward amount is required';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/bounties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reward: parseFloat(formData.reward),
          tags: formData.tags.split(',').map(tag => tag.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create bounty');
      }

      // Reset form or redirect
      setFormData({
        title: '',
        description: '',
        requirements: '',
        reward: '',
        currency: 'STRK',
        deadline: '',
        difficulty: 'Medium',
        tags: '',
      });
      setErrors({});
      // Show success message
    } catch (error) {
      console.error(error);
      // Show error message
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950 font-['Inter',sans-serif]">
      {/* Animated Background Elements */}
      <motion.div 
        className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
        animate={{
          y: [-20, 20, -20],
          x: [-10, 10, -10],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
        animate={{
          y: [20, -20, 20],
          x: [10, -10, 10],
          scale: [1.1, 1, 1.1]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-xl"
            >
              <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white">
              Create 
              <motion.span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 ml-3"
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
                Bounty
              </motion.span>
            </h1>
          </motion.div>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Stake tokens and create a bounty for the community to solve. Winners are automatically paid through smart contracts.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <AnimatedCard className="p-8" glow={true} gradient={true}>
            {/* Important Notice */}
            <motion.div 
              className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 mb-8"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start space-x-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                </motion.div>
                <div>
                  <h3 className="font-black text-lg text-yellow-800 dark:text-yellow-200 mb-3">
                    Important Notice
                  </h3>
                  <ul className="text-yellow-700 dark:text-yellow-300 space-y-2 font-medium">
                    <li className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-yellow-500 rounded-full"
                      />
                      Funds are automatically locked in a smart contract
                    </li>
                    <li className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="w-2 h-2 bg-yellow-500 rounded-full"
                      />
                      No takebacks once bounty is created
                    </li>
                    <li className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        className="w-2 h-2 bg-yellow-500 rounded-full"
                      />
                      Winners are paid automatically upon selection
                    </li>
                    <li className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                        className="w-2 h-2 bg-yellow-500 rounded-full"
                      />
                      Platform fee: $10 USD (deducted from stake)
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AnimatedInput
                  label="Bounty Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={errors.title}
                  placeholder="e.g., Analyze DeFi TVL trends on Starknet"
                  icon={Target}
                  required
                />
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <motion.textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`input-field resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Describe what you want analyzed and the expected deliverables..."
                  whileFocus={{ scale: 1.01 }}
                />
                <AnimatePresence>
                  {errors.description && (
                    <motion.div 
                      className="mt-2 flex items-center text-sm text-red-600 font-medium"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Requirements */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Requirements & Deliverables <span className="text-red-500">*</span>
                </label>
                <motion.textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className={`input-field resize-none ${errors.requirements ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="List specific requirements, SQL queries needed, visualizations, etc..."
                  whileFocus={{ scale: 1.01 }}
                />
                <AnimatePresence>
                  {errors.requirements && (
                    <motion.div 
                      className="mt-2 flex items-center text-sm text-red-600 font-medium"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.requirements}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Reward */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Reward Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <motion.input
                      type="number"
                      name="reward"
                      value={formData.reward}
                      onChange={handleInputChange}
                      min="1"
                      step="0.01"
                      className={`flex-1 input-field rounded-r-none ${errors.reward ? 'border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="500"
                      whileFocus={{ scale: 1.01 }}
                    />
                    <motion.select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="px-4 py-3 border-2 border-l-0 border-gray-300 dark:border-gray-600 rounded-r-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                      whileHover={{ scale: 1.02 }}
                    >
                      <option value="STRK">STRK</option>
                      <option value="USDC">USDC</option>
                      <option value="ETH">ETH</option>
                    </motion.select>
                  </div>
                  <AnimatePresence>
                    {errors.reward && (
                      <motion.div 
                        className="mt-2 flex items-center text-sm text-red-600 font-medium"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {errors.reward}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Deadline */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <AnimatedInput
                    label="Submission Deadline"
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    error={errors.deadline}
                    required
                  />
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Difficulty */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <motion.select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="input-field"
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.01 }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </motion.select>
                </motion.div>

                {/* Tags */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <AnimatedInput
                    label="Tags (comma-separated)"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="DeFi, Analytics, SQL"
                    icon={Sparkles}
                  />
                </motion.div>
              </div>

              {/* Cost Breakdown */}
              <AnimatePresence>
                {rewardAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnimatedCard className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800" glow={true}>
                      <h3 className="font-black text-lg text-blue-900 dark:text-blue-200 mb-4 flex items-center">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="mr-3"
                        >
                          <Coins className="h-6 w-6" />
                        </motion.div>
                        Stake Breakdown
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">Reward Amount:</span>
                          <motion.span 
                            className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600"
                            whileHover={{ scale: 1.05 }}
                          >
                            {rewardAmount} {formData.currency}
                          </motion.span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 dark:text-blue-300 font-medium">Platform Fee:</span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">${platformFee} USD</span>
                        </div>
                        <div className="border-t-2 border-blue-200 dark:border-blue-800 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-900 dark:text-blue-100 font-black text-lg">Total Stake Required:</span>
                            <motion.span 
                              className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
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
                              {rewardAmount} {formData.currency} + ${platformFee} USD
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AutoSwapper */}
              <AnimatePresence>
                {rewardAmount > 0 && provider && account && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <AutoSwapper provider={provider} account={account} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div 
                className="flex justify-end pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <AnimatedButton
                  type="submit"
                  variant="success"
                  size="lg"
                  icon={isCreating ? Zap : DollarSign}
                  disabled={isCreating || !rewardAmount}
                  loading={isCreating}
                  className="px-8 py-4 text-lg"
                >
                  {isCreating ? 'Creating Bounty...' : 'Stake & Create Bounty'}
                </AnimatedButton>
              </motion.div>
            </form>
          </AnimatedCard>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateBounty;
