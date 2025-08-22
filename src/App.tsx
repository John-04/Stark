import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import SwapPage from './pages/SwapPage';
import Portfolio from './pages/Portfolio';
import DashboardBuilder from './pages/DashboardBuilder';
import AdvancedQueryEditorPage from './pages/AdvancedQueryEditorPage';
import ContractVerification from './pages/ContractVerification';
import PublicDashboardView from './pages/PublicDashboardView';
import BountyDetail from './pages/BountyDetail';
import CreateBounty from './pages/CreateBounty';
import Profile from './pages/Profile';
import Premium from './pages/Premium';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import { AuthProvider } from './contexts/AuthContext';
import Bounties from './pages/Bounties';
import { SQLSandboxPage } from './pages/SQLSandboxPage';
import { APITest } from './components/APITest';
import Docs from './pages/Docs';
import StarknetDashboard from './pages/StarknetDashboard';
import { RPCTest } from './components/RPCTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/query" element={<AdvancedQueryEditorPage />} />
              <Route path="/sql-sandbox" element={<SQLSandboxPage />} />
              <Route path="/dashboard" element={<DashboardBuilder />} />
              <Route path="/starknet-dashboard" element={<StarknetDashboard />} />
              <Route path="/contracts" element={<ContractVerification />} />
              <Route path="/d/:id" element={<PublicDashboardView />} />
              <Route path="/bounty/:id" element={<BountyDetail />} />
              <Route path="/create-bounty" element={<CreateBounty />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/bounties" element={<Bounties />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/api-test" element={<APITest />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/rpc-test" element={<RPCTest />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
