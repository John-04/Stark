import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, Clock, Code, FileText, Send, ExternalLink, Link as LinkIcon } from 'lucide-react';
import SocialShare from '../components/SocialShare';
import { getDashboards } from '../services/dashboardStore';
import { useAuth } from '../contexts/AuthContext';
import { AutoSwapper } from '../components/Swap/AutoSwapper';
import AnimatedButton from '../components/ui/AnimatedButton';

const BountyDetail = () => {
  const { id } = useParams();
  const { user, provider, account } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<'sql' | 'dashboard' | 'both'>('sql');
  const [submission, setSubmission] = useState({
    query: '-- Your SQL analysis query\nSELECT \n  date_trunc(\'day\', block_timestamp) as day,\n  COUNT(*) as transaction_count,\n  AVG(gas_used) as avg_gas\nFROM starknet_transactions\nWHERE block_timestamp >= \'2024-01-01\'\nGROUP BY 1\nORDER BY 1;',
    insights: '',
    methodology: '',
    dashboardLink: '',
    selectedDashboardId: ''
  });
  const [myDashboards, setMyDashboards] = useState<any[]>([]);
  useEffect(() => {
    if (showSubmissionModal) {
      setMyDashboards(getDashboards());
    }
  }, [showSubmissionModal]);

  // Mock bounty data
  const bounty = {
    id: '1',
    title: 'Analyze DeFi TVL Trends on Starknet',
    description: 'Create a comprehensive analysis of Total Value Locked across top DeFi protocols on Starknet over the last 6 months. We need insights into growth patterns, protocol adoption, and user behavior trends.',
    requirements: `
1. SQL queries analyzing TVL data from major DeFi protocols (Jediswap, mySwap, 10KSwap, etc.)
2. Time-series analysis showing TVL growth over 6 months
3. Protocol comparison and market share analysis
4. Identification of key growth drivers and trends
5. Visual charts and graphs to support findings
6. Executive summary with actionable insights
    `.trim(),
    reward: 500,
    currency: 'STRK',
    status: 'live' as const,
    submissions: 12,
    deadline: '2024-02-15',
    tags: ['DeFi', 'TVL', 'Analytics'],
    difficulty: 'Medium' as const,
    creator: {
      name: 'StarkWare',
      address: '0x1234...5678',
      reputation: 98
    },
    createdAt: '2024-01-10',
    contractAddress: '0xa1b2c3d4e5f6789012345678901234567890abcd'
  };

  const timeLeft = () => {
    const deadline = new Date(bounty.deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Build payload
    const payload = {
      bountyId: bounty.id,
      query: submissionMode !== 'dashboard' ? submission.query : undefined,
      insights: submission.insights,
      methodology: submission.methodology,
      dashboardLink: submission.dashboardLink || (submission.selectedDashboardId ? `${window.location.origin}/d/${submission.selectedDashboardId}` : ''),
      submittedAt: Date.now(),
    };

    // Mock submission persistence
    setTimeout(() => {
      console.log('Submitted payload:', payload);
      setIsSubmitting(false);
      setShowSubmissionModal(false);
      alert('Submission successful!');
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bounty Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bounty.title}
                  </h1>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                    {bounty.status}
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                    {bounty.difficulty}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {bounty.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300">{bounty.description}</p>
              </div>
              
              <div className="text-right ml-6">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {bounty.reward} {bounty.currency}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {bounty.submissions} submissions
                </div>
                <div className="text-sm text-red-600 font-medium">
                  {timeLeft()}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(bounty.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>By {bounty.creator.name}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <SocialShare title={bounty.title} url={`/bounty/${bounty.id}`} />
                <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Solution</span>
                </button>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Requirements & Deliverables
            </h2>
            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {bounty.requirements}
            </pre>
          </div>

          {/* Contract Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Related Contract
            </h2>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div>
                <div className="font-mono text-sm text-gray-900 dark:text-white">
                  {bounty.contractAddress}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Main contract for analysis
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigator.clipboard.writeText(bounty.contractAddress)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Copy
                </button>
                <a
                  href={`https://voyager.online/contract/${bounty.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Voyager</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bounty Creator</h3>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {bounty.creator.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {bounty.creator.name}
                </div>
                <div className="text-sm text-gray-500">
                  {bounty.creator.address}
                </div>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600 dark:text-gray-400">Reputation</span>
                <span className="font-medium text-green-600">{bounty.creator.reputation}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${bounty.creator.reputation}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bounty Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bounty Stats</h3>
            <div className="space-y-3">
              {user?.address === bounty.creator.address && (
                <AnimatedButton
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full mb-4"
                >
                  Withdraw Funds
                </AnimatedButton>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Reward</span>
                <span className="font-semibold text-green-600">{bounty.reward} {bounty.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Submissions</span>
                <span className="font-medium">{bounty.submissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                <span className="font-medium">{new Date(bounty.deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                  {bounty.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Withdraw Funds</h2>
            </div>
            <div className="p-6">
              {provider && account ? (
                <AutoSwapper provider={provider} account={account} />
              ) : (
                <p>Please connect your wallet to withdraw funds.</p>
              )}
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <AnimatedButton onClick={() => setShowWithdrawModal(false)}>
                Close
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Submit Your Solution</h2>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <label className="inline-flex items-center gap-1">
                  <input type="radio" name="mode" checked={submissionMode==='sql'} onChange={()=>setSubmissionMode('sql')} /> SQL
                </label>
                <label className="inline-flex items-center gap-1">
                  <input type="radio" name="mode" checked={submissionMode==='dashboard'} onChange={()=>setSubmissionMode('dashboard')} /> Dashboard
                </label>
                <label className="inline-flex items-center gap-1">
                  <input type="radio" name="mode" checked={submissionMode==='both'} onChange={()=>setSubmissionMode('both')} /> Both
                </label>
              </div>
            </div>
            
            <form onSubmit={handleSubmission} className="p-6 space-y-6">
              {/* SQL Query */}
              {(submissionMode === 'sql' || submissionMode === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SQL Query {submissionMode==='both' ? '' : '*'}
                  </label>
                  <textarea
                    value={submission.query}
                    onChange={(e) => setSubmission({ ...submission, query: e.target.value })}
                    required={submissionMode === 'sql' || submissionMode === 'both'}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Write your SQL analysis query here..."
                  />
                </div>
              )}

              {/* Dashboard Link */}
              {(submissionMode === 'dashboard' || submissionMode === 'both') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attach Dashboard
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={submission.dashboardLink}
                      onChange={(e) => setSubmission({ ...submission, dashboardLink: e.target.value })}
                      placeholder="Paste public dashboard link e.g., https://your-host/d/123"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <select
                      value={submission.selectedDashboardId}
                      onChange={(e) => setSubmission({ ...submission, selectedDashboardId: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select from My Dashboards</option>
                      {myDashboards.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Ensure your selected dashboard is public (set in Dashboard Builder) to be viewable by judges.</p>
                </div>
              )}

              {/* Insights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Insights & Findings *
                </label>
                <textarea
                  value={submission.insights}
                  onChange={(e) => setSubmission({ ...submission, insights: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Summarize your key findings and insights..."
                />
              </div>

              {/* Methodology */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Methodology (Optional)
                </label>
                <textarea
                  value={submission.methodology}
                  onChange={(e) => setSubmission({ ...submission, methodology: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Explain your analysis approach and methodology..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Solution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BountyDetail;
