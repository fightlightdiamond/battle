import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import {
  CardListPage,
  CardCreatePage,
  CardEditPage,
} from "./features/cards/pages";
import {
  BattleSetupPage,
  BattleArenaPage,
  BattleHistoryListPage,
  BattleHistoryDetailPage,
  BattleReplayPage,
} from "./features/battle/pages";
// BetBattleSetupPage, BetBattleArenaPage, BetHistoryPage are deprecated
// Redirects are used instead - see routes below
import {
  MatchupListPage,
  MatchupDetailPage,
  MatchupCreatePage,
  MatchupBetHistoryPage,
  MatchupAdminListPage,
  MatchupAdminPage,
} from "./features/matchup/pages";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          <Route path="/" element={<Navigate to="/cards" replace />} />
          <Route path="/cards" element={<CardListPage />} />
          <Route path="/cards/new" element={<CardCreatePage />} />
          <Route path="/cards/:id/edit" element={<CardEditPage />} />
          <Route path="/battle/setup" element={<BattleSetupPage />} />
          <Route path="/battle/arena" element={<BattleArenaPage />} />
          <Route path="/history" element={<BattleHistoryListPage />} />
          <Route path="/history/:id" element={<BattleHistoryDetailPage />} />
          <Route path="/history/:id/replay" element={<BattleReplayPage />} />
          {/* Admin creates matchups at /matchups/create, redirect old route */}
          <Route
            path="/bet-battle"
            element={<Navigate to="/matchups/create" replace />}
          />
          {/* Keep arena for legacy support but redirect to matchups */}
          <Route
            path="/bet-battle/arena"
            element={<Navigate to="/matchups" replace />}
          />
          {/* Old bet history - redirect to new matchup bets */}
          <Route
            path="/bet-history"
            element={<Navigate to="/matchup-bets" replace />}
          />
          {/* Player routes */}
          <Route path="/matchups" element={<MatchupListPage />} />
          <Route path="/matchups/:id" element={<MatchupDetailPage />} />
          <Route path="/matchup-bets" element={<MatchupBetHistoryPage />} />
          {/* Admin routes */}
          <Route path="/admin/matchups" element={<MatchupAdminListPage />} />
          <Route path="/admin/matchups/:id" element={<MatchupAdminPage />} />
          <Route path="/matchups/create" element={<MatchupCreatePage />} />
        </Routes>
      </App>
    </BrowserRouter>
  </StrictMode>
);
