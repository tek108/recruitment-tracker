import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Sidebar from './components/Sidebar';
import DailyDigest from './components/DailyDigest';
import RoleDashboard from './components/RoleDashboard';
import RoleDetail from './components/RoleDetail';
import TalentPool from './components/TalentPool';
import Search from './components/Search';
import CandidateCard from './components/CandidateCard';
import WeeklySummary from './components/WeeklySummary';

export const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);

export default function App() {
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);

  return (
    <DataProvider>
      <UIContext.Provider value={{
        openCandidate: setSelectedCandidateId,
        closeCandidate: () => setSelectedCandidateId(null),
        openWeeklySummary: () => setShowWeeklySummary(true),
        closeWeeklySummary: () => setShowWeeklySummary(false),
      }}>
        <Router>
          <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<DailyDigest />} />
                <Route path="/roles" element={<RoleDashboard />} />
                <Route path="/roles/:roleId" element={<RoleDetail />} />
                <Route path="/talent-pool" element={<TalentPool />} />
                <Route path="/search" element={<Search />} />
              </Routes>
            </main>
          </div>

          {selectedCandidateId && (
            <CandidateCard
              candidateId={selectedCandidateId}
              onClose={() => setSelectedCandidateId(null)}
            />
          )}

          {showWeeklySummary && (
            <WeeklySummary onClose={() => setShowWeeklySummary(false)} />
          )}
        </Router>
      </UIContext.Provider>
    </DataProvider>
  );
}
