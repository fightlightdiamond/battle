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
import {
  BetBattleSetupPage,
  BetBattleArenaPage,
  BetHistoryPage,
} from "./features/betting/pages";

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
          <Route path="/bet-battle" element={<BetBattleSetupPage />} />
          <Route path="/bet-battle/arena" element={<BetBattleArenaPage />} />
          <Route path="/bet-history" element={<BetHistoryPage />} />
        </Routes>
      </App>
    </BrowserRouter>
  </StrictMode>
);
