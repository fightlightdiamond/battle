import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { PageLoader } from "./components/PageLoader";

// Lazy load all feature pages for code splitting
const CardListPage = lazy(() =>
  import("./features/cards/pages").then((m) => ({ default: m.CardListPage })),
);
const CardCreatePage = lazy(() =>
  import("./features/cards/pages").then((m) => ({ default: m.CardCreatePage })),
);
const CardEditPage = lazy(() =>
  import("./features/cards/pages").then((m) => ({ default: m.CardEditPage })),
);
const CardDetailPage = lazy(() =>
  import("./features/cards/pages").then((m) => ({ default: m.CardDetailPage })),
);

const BattleSetupPage = lazy(() =>
  import("./features/battle/pages").then((m) => ({
    default: m.BattleSetupPage,
  })),
);
const BattleArenaPage = lazy(() =>
  import("./features/battle/pages").then((m) => ({
    default: m.BattleArenaPage,
  })),
);
const ArenaBattlePage = lazy(() =>
  import("./features/battle/pages").then((m) => ({
    default: m.ArenaBattlePage,
  })),
);
const BattleHistoryListPage = lazy(() =>
  import("./features/battle/pages").then((m) => ({
    default: m.BattleHistoryListPage,
  })),
);
const BattleHistoryDetailPage = lazy(() =>
  import("./features/battle/pages").then((m) => ({
    default: m.BattleHistoryDetailPage,
  })),
);
const BattleReplayPage = lazy(() =>
  import("./features/battle/pages").then((m) => ({
    default: m.BattleReplayPage,
  })),
);

const MatchupListPage = lazy(() =>
  import("./features/matchup/pages").then((m) => ({
    default: m.MatchupListPage,
  })),
);
const MatchupDetailPage = lazy(() =>
  import("./features/matchup/pages").then((m) => ({
    default: m.MatchupDetailPage,
  })),
);
const MatchupCreatePage = lazy(() =>
  import("./features/matchup/pages").then((m) => ({
    default: m.MatchupCreatePage,
  })),
);
const MatchupBetHistoryPage = lazy(() =>
  import("./features/matchup/pages").then((m) => ({
    default: m.MatchupBetHistoryPage,
  })),
);
const MatchupAdminListPage = lazy(() =>
  import("./features/matchup/pages").then((m) => ({
    default: m.MatchupAdminListPage,
  })),
);
const MatchupAdminPage = lazy(() =>
  import("./features/matchup/pages").then((m) => ({
    default: m.MatchupAdminPage,
  })),
);

const WeaponListPage = lazy(() =>
  import("./features/weapons/pages").then((m) => ({
    default: m.WeaponListPage,
  })),
);
const WeaponCreatePage = lazy(() =>
  import("./features/weapons/pages").then((m) => ({
    default: m.WeaponCreatePage,
  })),
);
const WeaponEditPage = lazy(() =>
  import("./features/weapons/pages").then((m) => ({
    default: m.WeaponEditPage,
  })),
);
const WeaponEnhancePage = lazy(() =>
  import("./features/weapons/pages").then((m) => ({
    default: m.WeaponEnhancePage,
  })),
);

const GemListPage = lazy(() =>
  import("./features/gems/pages").then((m) => ({ default: m.GemListPage })),
);
const GemCreatePage = lazy(() =>
  import("./features/gems/pages").then((m) => ({ default: m.GemCreatePage })),
);
const GemEditPage = lazy(() =>
  import("./features/gems/pages").then((m) => ({ default: m.GemEditPage })),
);
const SkillTreePage = lazy(() =>
  import("./features/gems/pages").then((m) => ({ default: m.SkillTreePage })),
);

const EntityBuilderPage = lazy(() =>
  import("./features/lowcode/pages").then((m) => ({
    default: m.EntityBuilderPage,
  })),
);

// Get basename from Vite's base config for GitHub Pages deployment
const basename = import.meta.env.BASE_URL;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/cards" replace />} />
            <Route path="/cards" element={<CardListPage />} />
            <Route path="/cards/new" element={<CardCreatePage />} />
            <Route path="/cards/:id" element={<CardDetailPage />} />
            <Route path="/cards/:id/edit" element={<CardEditPage />} />
            <Route path="/weapons" element={<WeaponListPage />} />
            <Route path="/weapons/create" element={<WeaponCreatePage />} />
            <Route path="/weapons/:id/edit" element={<WeaponEditPage />} />
            <Route path="/weapons/enhance" element={<WeaponEnhancePage />} />
            <Route path="/gems" element={<GemListPage />} />
            <Route path="/gems/create" element={<GemCreatePage />} />
            <Route path="/gems/:id/edit" element={<GemEditPage />} />
            <Route path="/gems/skill-tree" element={<SkillTreePage />} />
            <Route path="/lowcode" element={<EntityBuilderPage />} />
            <Route path="/battle/setup" element={<BattleSetupPage />} />
            <Route path="/battle/arena" element={<BattleArenaPage />} />
            <Route path="/battle/arena-1d" element={<ArenaBattlePage />} />
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
        </Suspense>
      </App>
    </BrowserRouter>
  </StrictMode>,
);
