# Software Solution Architecture Document

## R2 - Card Battle Game System

**Version:** 2.0.0 (Production Ready)  
**Last Updated:** February 2026  
**Author:** Solution Architect  
**Status:** Production Architecture Specification

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Solution Architecture](#3-solution-architecture)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Feature Modules](#5-feature-modules)
6. [Data Architecture](#6-data-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Security Architecture](#8-security-architecture)
9. [DevOps & Deployment](#9-devops--deployment)
10. [Monitoring & Observability](#10-monitoring--observability)
11. [Disaster Recovery](#11-disaster-recovery)
12. [Cost Analysis](#12-cost-analysis)
13. [Risk Assessment](#13-risk-assessment)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

### 1.1 Business Context

R2 là một game battle card với mục tiêu cung cấp trải nghiệm gaming offline-first, hỗ trợ:

- **Card Management**: CRUD operations cho battle cards với stats đa tầng
- **Weapon System**: 3 loại vũ khí (Bow, Spear, Sword & Shield) với skills riêng biệt
- **Gem System**: Skill gems gắn vào cards với activation mechanics
- **Battle Engine**: Turn-based combat với 2 modes (Classic & Arena 1D)
- **Betting System**: Đặt cược gold với matchup predictions
- **Offline-First**: IndexedDB + OPFS với sync queue

### 1.2 Document Purpose

Tài liệu này định nghĩa kiến trúc giải pháp cho hệ thống R2 trong môi trường production, bao gồm:

- Quyết định kiến trúc và trade-offs
- Yêu cầu phi chức năng (NFRs)
- Patterns và best practices
- Roadmap triển khai

### 1.3 Stakeholders

| Stakeholder      | Interest                          |
| ---------------- | --------------------------------- |
| Product Owner    | Feature delivery, user experience |
| Development Team | Implementation guidance           |
| DevOps Team      | Deployment, infrastructure        |
| QA Team          | Testing strategy                  |
| Security Team    | Security compliance               |

---

## 2. Technology Stack

### 2.1 Technology Selection Matrix

| Category             | Current (Dev)      | Production           | Justification                                |
| -------------------- | ------------------ | -------------------- | -------------------------------------------- |
| **Frontend Runtime** | React 19.2.0       | React 19.x           | Concurrent features, Server Components ready |
| **Language**         | TypeScript 5.9     | TypeScript 5.x       | Type safety, better DX                       |
| **Build Tool**       | Vite 7.2           | Vite 7.x             | Fast HMR, optimized builds                   |
| **Styling**          | Tailwind 4.x       | Tailwind 4.x         | Utility-first, tree-shaking                  |
| **State (Client)**   | Zustand 5.0        | Zustand 5.x          | Lightweight, no boilerplate                  |
| **State (Server)**   | TanStack Query 5.x | TanStack Query 5.x   | Caching, background sync                     |
| **Validation**       | Zod 4.x            | Zod 4.x              | Runtime validation, TypeScript inference     |
| **Local Storage**    | IndexedDB (idb)    | IndexedDB (idb)      | Offline persistence                          |
| **Image Storage**    | OPFS               | OPFS + CDN           | Performance, offline support                 |
| **API (Dev)**        | json-server        | See Production Stack | Mock server only                             |

### 2.2 Production Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ React 19    │  │ Tailwind 4  │  │ TypeScript  │  │ Service Worker│  │
│  │ + Zustand   │  │ + shadcn/ui │  │    5.x      │  │     (PWA)     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                           EDGE TIER                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Cloudflare / Vercel Edge                     │   │
│  │  • CDN for static assets        • Edge caching                  │   │
│  │  • DDoS protection              • SSL termination               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           API TIER                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐   │
│  │   API Gateway   │  │  Serverless     │  │    WebSocket Server   │   │
│  │   (Kong/AWS)    │  │  Functions      │  │    (Socket.io)        │   │
│  │                 │  │  (Vercel/AWS)   │  │    (Future: PvP)      │   │
│  └─────────────────┘  └─────────────────┘  └───────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                           DATA TIER                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────┐   │
│  │   PostgreSQL    │  │     Redis       │  │    Object Storage     │   │
│  │   (Supabase/    │  │   (Upstash)     │  │    (S3/R2/Supabase)   │   │
│  │    Neon)        │  │   • Sessions    │  │    • Card images      │   │
│  │   • Game data   │  │   • Leaderboard │  │    • Weapon images    │   │
│  └─────────────────┘  └─────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Production Dependencies

```json
{
  "dependencies": {
    // Core
    "react": "^19.x",
    "typescript": "^5.x",

    // State Management
    "zustand": "^5.x",
    "@tanstack/react-query": "^5.x",

    // Backend Integration
    "@supabase/supabase-js": "^2.x", // Database + Auth + Storage
    "socket.io-client": "^4.x", // Real-time (future)

    // PWA
    "workbox-window": "^7.x", // Service Worker

    // Monitoring
    "@sentry/react": "^8.x", // Error tracking
    "web-vitals": "^4.x" // Performance metrics
  }
}
```

### 2.4 Technology Decision Records (TDRs)

#### TDR-001: Offline-First với IndexedDB

**Context:** Game cần hoạt động offline và sync khi có network.

**Decision:** Sử dụng IndexedDB làm primary storage, sync với Supabase khi online.

**Consequences:**

- ✅ Full offline support
- ✅ Instant local operations
- ⚠️ Conflict resolution complexity
- ⚠️ Storage limits (browser-dependent)

#### TDR-002: Supabase over Firebase

**Context:** Cần backend với auth, database, storage, real-time.

**Decision:** Chọn Supabase (PostgreSQL-based).

**Consequences:**

- ✅ SQL queries, joins, triggers
- ✅ Row-Level Security (RLS)
- ✅ Open source, no vendor lock-in
- ⚠️ Smaller ecosystem than Firebase

#### TDR-003: Serverless Architecture

**Context:** Game traffic không predictable, cần cost-effective.

**Decision:** Serverless functions cho API endpoints.

**Consequences:**

- ✅ Pay-per-use pricing
- ✅ Auto-scaling
- ⚠️ Cold starts (mitigate với edge functions)
- ⚠️ Stateless constraints

---

## 3. Solution Architecture

### 3.1 Architecture Principles

| Principle                        | Description                            | Implementation                       |
| -------------------------------- | -------------------------------------- | ------------------------------------ |
| **Offline-First**                | App hoạt động đầy đủ khi offline       | IndexedDB + OPFS + Sync Queue        |
| **Event-Driven**                 | Loose coupling giữa components         | EventBus pattern trong Battle Engine |
| **Feature-Based Modules**        | Code organization theo business domain | `/features/{domain}/` structure      |
| **Immutable State**              | Predictable state transitions          | Zustand with immutable updates       |
| **Type Safety**                  | Runtime + compile-time validation      | Zod + TypeScript                     |
| **Composition over Inheritance** | Flexible component architecture        | React hooks + Higher-order functions |

### 3.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │   Pages (24)   │  │  Components    │  │   Layouts      │  │  UI Kit   │ │
│  │  React.lazy()  │  │  (Shared)      │  │  (App/Wide)    │  │ shadcn/ui │ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                              APPLICATION LAYER                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────┐ │
│  │ Zustand Stores │  │ TanStack Query │  │       Custom Hooks             │ │
│  │ • battleStore  │  │ • Queries      │  │ • useCards, useWeapons         │ │
│  │ • bettingStore │  │ • Mutations    │  │ • useBattle, useGems           │ │
│  │ • enhanceStore │  │ • Cache        │  │ • useOnlineStatus              │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                               DOMAIN LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Battle Engine                                 │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │  │
│  │  │ TurnSystem │ │CombatSystem│ │SkillSystem │ │  DamageCalculator  │ │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ CardService   │  │ WeaponService │  │  GemService   │  │ BetService  │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                           INFRASTRUCTURE LAYER                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │   IndexedDB    │  │     OPFS       │  │   SyncQueue    │  │ API Client│ │
│  │  (idb wrapper) │  │ (Image Store)  │  │  (Offline)     │  │ (Supabase)│ │
│  └────────────────┘  └────────────────┘  └────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Component Hierarchy                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   App                                                                       │
│    ├── AppLayout / WideLayout                                               │
│    │    ├── StatusBar (Gold Display)                                        │
│    │    ├── Navigation                                                      │
│    │    └── <Outlet /> (React Router)                                       │
│    │                                                                        │
│    └── Pages (React.lazy)                                                   │
│         ├── CardListPage                                                    │
│         │    ├── CardList                                                   │
│         │    │    ├── CardCard (x N)                                        │
│         │    │    └── DeleteConfirmDialog                                   │
│         │    └── EmptyState                                                 │
│         │                                                                   │
│         ├── BattleArenaPage                                                 │
│         │    ├── CardSelector (x2)                                          │
│         │    ├── BattleCard (x2)                                            │
│         │    ├── BattleControls                                             │
│         │    ├── BattleLog                                                  │
│         │    └── VictoryOverlay                                             │
│         │                                                                   │
│         ├── ArenaBattlePage                                                 │
│         │    ├── Arena1D                                                    │
│         │    │    ├── ArenaCell (x8)                                        │
│         │    │    └── ArenaCard (x2)                                        │
│         │    ├── BattleControls                                             │
│         │    └── BattleLog                                                  │
│         │                                                                   │
│         └── WeaponListPage                                                  │
│              ├── WeaponList                                                 │
│              │    └── WeaponCard (x N)                                      │
│              └── EnhancementPanel                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Battle Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BATTLE ENGINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         BattleEngine (Facade)                        │   │
│  │  • initialize(challenger, opponent)                                  │   │
│  │  • executeTurn()                                                     │   │
│  │  • getState(): BattleState                                           │   │
│  │  • subscribe(callback): unsubscribe                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                    ┌───────────────┼───────────────┐                       │
│                    ▼               ▼               ▼                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐           │
│  │    EventBus      │ │   BattleState    │ │    Config        │           │
│  │  • emit(event)   │ │  • combatants    │ │ • critThreshold  │           │
│  │  • on(event, cb) │ │  • currentTurn   │ │ • minDamage      │           │
│  │  • off(event)    │ │  • logs          │ │ • maxTurns       │           │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘           │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SYSTEMS                                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │  TurnSystem   │ │ CombatSystem  │ │ SkillSystem   │ │ VictorySystem │   │
│  │               │ │               │ │               │ │               │   │
│  │ • nextTurn()  │ │ • attack()    │ │ • activate()  │ │ • check()     │   │
│  │ • getOrder()  │ │ • defend()    │ │ • process()   │ │ • isDefeated()│   │
│  │ • isEnded()   │ │ • lifesteal() │ │ • cooldown()  │ │ • getWinner() │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       DamageCalculator                                │  │
│  │  • calculateBaseDamage(atk, def)                                     │  │
│  │  • applyCritical(damage, critChance, critDamage)                     │  │
│  │  • applyArmorPen(damage, armorPen, def)                              │  │
│  │  • calculateLifesteal(damage, lifesteal)                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SKILL PROCESSING                               │
│                                                                             │
│  Combat Phase:                          Movement Phase (Arena):            │
│  ┌──────────────────────────────┐      ┌──────────────────────────────┐   │
│  │ • knockback (push 1 cell)   │      │ • double_move (2 cells)      │   │
│  │ • retreat (move back 1)     │      │ • leap_strike (jump + KB)    │   │
│  │ • double_attack (2x attack) │      └──────────────────────────────┘   │
│  │ • execute (kill if low HP)  │                                         │
│  │ • power_shot (150% + KB)    │      Weapon Skills (Bow):               │
│  │ • evasive_shot (250% + ret) │      ┌──────────────────────────────┐   │
│  └──────────────────────────────┘      │ • Power Shot: 30%, CD2       │   │
│                                         │ • Evasive Shot: 40%, CD4     │   │
│                                         └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OFFLINE-FIRST DATA FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐                                                                │
│  │  User   │                                                                │
│  │ Action  │                                                                │
│  └────┬────┘                                                                │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       OPTIMISTIC UPDATE                              │   │
│  │  1. Update IndexedDB immediately                                     │   │
│  │  2. Update Zustand/Query cache                                       │   │
│  │  3. UI reflects change instantly                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SYNC QUEUE                                   │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │  CREATE   │  │  UPDATE   │  │  DELETE   │  │   IMAGE   │        │   │
│  │  │  card_1   │  │  card_2   │  │  card_3   │  │  upload   │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       │ (When Online)                                                       │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      CONFLICT RESOLUTION                             │   │
│  │                                                                      │   │
│  │  Strategy: Last-Write-Wins (LWW) with updatedAt timestamp           │   │
│  │                                                                      │   │
│  │  1. Compare local.updatedAt vs server.updatedAt                     │   │
│  │  2. If local > server: Push local                                   │   │
│  │  3. If server > local: Pull server (notify user if conflicts)       │   │
│  │  4. Merge non-conflicting changes                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       BACKEND SYNC                                   │   │
│  │                                                                      │   │
│  │  Supabase Real-time Subscriptions                                   │   │
│  │  ┌─────────────────┐       ┌─────────────────┐                      │   │
│  │  │ PostgreSQL DB   │◄─────►│  Other Clients  │                      │   │
│  │  └─────────────────┘       └─────────────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ZUSTAND STORES (Client State)                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  battleStore                    bettingStore                        │   │
│  │  ┌─────────────────────┐       ┌─────────────────────┐              │   │
│  │  │ challenger: Card    │       │ goldBalance: number │              │   │
│  │  │ opponent: Card      │       │ currentBet: Bet     │              │   │
│  │  │ battleState: enum   │       │ betHistory: Bet[]   │              │   │
│  │  │ turnCount: number   │       │ dailyBonus: Date    │              │   │
│  │  │ logs: LogEntry[]    │       └─────────────────────┘              │   │
│  │  └─────────────────────┘                                            │   │
│  │                                                                      │   │
│  │  arenaBattleStore               enhancementStore                    │   │
│  │  ┌─────────────────────┐       ┌─────────────────────┐              │   │
│  │  │ positions: Map      │       │ selectedWeapon: ID  │              │   │
│  │  │ arenaState: 8 cells │       │ materials: Item[]   │              │   │
│  │  │ movementPhase: bool │       │ enhanceHistory: []  │              │   │
│  │  └─────────────────────┘       └─────────────────────┘              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 TANSTACK QUERY (Server State)                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  Query Keys:                    Cache Config:                       │   │
│  │  ┌─────────────────────┐       ┌─────────────────────┐              │   │
│  │  │ ['cards']           │       │ staleTime: 5 min    │              │   │
│  │  │ ['cards', id]       │       │ gcTime: 30 min      │              │   │
│  │  │ ['weapons']         │       │ refetchOnMount: true│              │   │
│  │  │ ['gems']            │       │ retry: 3            │              │   │
│  │  │ ['battleHistory']   │       └─────────────────────┘              │   │
│  │  │ ['matchups']        │                                            │   │
│  │  └─────────────────────┘                                            │   │
│  │                                                                      │   │
│  │  Mutations:                     Optimistic Updates:                 │   │
│  │  ┌─────────────────────┐       ┌─────────────────────┐              │   │
│  │  │ createCard          │       │ onMutate: update    │              │   │
│  │  │ updateCard          │       │ onError: rollback   │              │   │
│  │  │ deleteCard          │       │ onSuccess: confirm  │              │   │
│  │  │ equipWeapon         │       └─────────────────────┘              │   │
│  │  └─────────────────────┘                                            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

| Metric                             | Target         | Measurement           |
| ---------------------------------- | -------------- | --------------------- |
| **First Contentful Paint (FCP)**   | < 1.5s         | Lighthouse            |
| **Largest Contentful Paint (LCP)** | < 2.5s         | Core Web Vitals       |
| **Time to Interactive (TTI)**      | < 3.0s         | Lighthouse            |
| **First Input Delay (FID)**        | < 100ms        | Core Web Vitals       |
| **Cumulative Layout Shift (CLS)**  | < 0.1          | Core Web Vitals       |
| **Bundle Size (Initial)**          | < 200KB gzip   | Build analysis        |
| **API Response Time**              | < 200ms (p95)  | APM                   |
| **IndexedDB Operations**           | < 50ms         | Performance API       |
| **Battle Engine Tick**             | < 16ms (60fps) | RequestAnimationFrame |

### 4.2 Performance Optimization Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE OPTIMIZATIONS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CODE SPLITTING                        CACHING                              │
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │ • React.lazy() - 24 pages│          │ • Service Worker (PWA) │          │
│  │ • Dynamic imports       │          │ • TanStack Query cache  │          │
│  │ • Route-based splitting │          │ • Browser HTTP cache    │          │
│  │ • Vendor chunk isolation│          │ • IndexedDB persistence │          │
│  └─────────────────────────┘          └─────────────────────────┘          │
│                                                                             │
│  RENDERING                             ASSETS                               │
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │ • React.memo()          │          │ • Image lazy loading    │          │
│  │ • useMemo(), useCallback│          │ • WebP/AVIF formats     │          │
│  │ • Virtual scrolling     │          │ • CDN delivery          │          │
│  │ • Suspense boundaries   │          │ • Preload critical      │          │
│  └─────────────────────────┘          └─────────────────────────┘          │
│                                                                             │
│  BUNDLE ANALYSIS (Current):                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Main bundle:      ~375 KB │ gzip: ~115 KB                          │  │
│  │  Lazy chunks:      ~165 KB │ (per major feature)                    │  │
│  │  CSS:              ~135 KB │ gzip: ~20 KB                           │  │
│  │  Total initial:    ~510 KB │ gzip: ~135 KB                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  TARGET (Production):                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Main bundle:      < 150 KB │ gzip: < 50 KB                         │  │
│  │  Total initial:    < 300 KB │ gzip: < 100 KB                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Scalability Requirements

| Aspect               | Requirement     | Strategy                     |
| -------------------- | --------------- | ---------------------------- |
| **Concurrent Users** | 10,000+         | Serverless auto-scaling      |
| **Data Volume**      | 100K cards/user | Pagination, virtual scroll   |
| **Storage (Client)** | 50MB IndexedDB  | LRU eviction policy          |
| **Storage (Server)** | Unlimited       | Object storage (S3/R2)       |
| **Real-time Events** | 1000 msg/s      | WebSocket with Redis pub/sub |

### 4.4 Availability Requirements

| Metric                   | Target                      | Strategy                |
| ------------------------ | --------------------------- | ----------------------- |
| **Uptime**               | 99.9% (8.76h downtime/year) | Multi-region deployment |
| **Offline Availability** | 100% (core features)        | IndexedDB + OPFS        |
| **RTO (Recovery Time)**  | < 1 hour                    | Automated failover      |
| **RPO (Recovery Point)** | < 5 minutes                 | Real-time sync          |

### 4.5 Reliability Requirements

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RELIABILITY PATTERNS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CIRCUIT BREAKER                       RETRY WITH BACKOFF                   │
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │ States:                 │          │ Max retries: 3          │          │
│  │ • CLOSED (normal)       │          │ Initial delay: 1s       │          │
│  │ • OPEN (failing)        │          │ Max delay: 30s          │          │
│  │ • HALF-OPEN (testing)   │          │ Backoff: exponential    │          │
│  │                         │          │ Jitter: random 0-1s     │          │
│  │ Threshold: 5 failures   │          │                         │          │
│  │ Reset: 30 seconds       │          │                         │          │
│  └─────────────────────────┘          └─────────────────────────┘          │
│                                                                             │
│  GRACEFUL DEGRADATION                  ERROR BOUNDARIES                    │
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │ Network down:           │          │ Per-feature isolation   │          │
│  │ • Continue with local   │          │ • Battle crashes don't  │          │
│  │ • Queue sync operations │          │   affect card list      │          │
│  │ • Show offline banner   │          │ • Fallback UI           │          │
│  │                         │          │ • Error reporting       │          │
│  │ API down:               │          │                         │          │
│  │ • Serve cached data     │          │                         │          │
│  │ • Disable sync features │          │                         │          │
│  └─────────────────────────┘          └─────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.6 Security Requirements

| Requirement          | Implementation                         |
| -------------------- | -------------------------------------- |
| **Authentication**   | Supabase Auth (OAuth, Magic Link)      |
| **Authorization**    | Row-Level Security (RLS) in PostgreSQL |
| **Data Encryption**  | TLS 1.3 in transit, AES-256 at rest    |
| **Input Validation** | Zod schemas on client + server         |
| **XSS Prevention**   | React escaping, CSP headers            |
| **CSRF Protection**  | SameSite cookies, CSRF tokens          |
| **Rate Limiting**    | 100 req/min per user                   |
| **Audit Logging**    | All mutations logged with user ID      |

### 4.7 Maintainability Requirements

| Aspect                 | Target          | Strategy            |
| ---------------------- | --------------- | ------------------- |
| **Code Coverage**      | > 80%           | Vitest + fast-check |
| **Type Coverage**      | 100%            | Strict TypeScript   |
| **Documentation**      | All public APIs | JSDoc + Storybook   |
| **Dependency Updates** | Monthly         | Renovate/Dependabot |
| **Technical Debt**     | < 10%           | SonarQube tracking  |

### 4.8 Accessibility Requirements (WCAG 2.1 AA)

| Requirement             | Implementation                     |
| ----------------------- | ---------------------------------- |
| **Keyboard Navigation** | All interactive elements focusable |
| **Screen Reader**       | ARIA labels, semantic HTML         |
| **Color Contrast**      | 4.5:1 minimum ratio                |
| **Motion**              | Respect prefers-reduced-motion     |
| **Focus Indicators**    | Visible focus rings                |

### 4.9 Internationalization (i18n)

| Aspect                  | Requirement                    |
| ----------------------- | ------------------------------ |
| **Languages**           | Vietnamese (default), English  |
| **RTL Support**         | Not required (Phase 1)         |
| **Date/Number Formats** | Locale-aware formatting        |
| **Content**             | Externalized strings (i18next) |

---

## 5. Feature Modules

### 5.1 Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FEATURE MODULES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   CARDS     │  │  WEAPONS    │  │    GEMS     │  │   BATTLE    │        │
│  │             │  │             │  │             │  │             │        │
│  │ • CRUD      │  │ • 3 Types   │  │ • Skills    │  │ • Engine    │        │
│  │ • Stats     │  │ • Enhance   │  │ • Equip     │  │ • Classic   │        │
│  │ • Images    │  │ • Skills    │  │ • Evolution │  │ • Arena 1D  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  BETTING    │  │   MATCHUP   │  │  ARENA1D    │  │  LOWCODE    │        │
│  │             │  │             │  │             │  │             │        │
│  │ • Gold      │  │ • Pairs     │  │ • Visual    │  │ • Config    │        │
│  │ • Bets      │  │ • Vote      │  │ • 8 Cells   │  │ • Generate  │        │
│  │ • Daily     │  │ • Results   │  │ • Animation │  │ • Export    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Module Structure (Standard)

```
feature/
├── api/              # External API calls (optional)
├── components/       # UI components
│   ├── FeatureForm.tsx
│   ├── FeatureCard.tsx
│   ├── FeatureList.tsx
│   └── index.ts
├── config/           # Feature configuration (optional)
├── hooks/            # Custom hooks
│   └── useFeature.ts
├── pages/            # Route pages
│   ├── FeatureListPage.tsx
│   ├── FeatureCreatePage.tsx
│   ├── FeatureEditPage.tsx
│   └── index.ts
├── services/         # Business logic
│   ├── featureService.ts
│   └── featureService.test.ts
├── store/            # Zustand store (optional)
│   └── featureStore.ts
├── styles/           # Feature-specific styles (optional)
├── types/            # TypeScript types
│   ├── feature.ts
│   ├── schemas.ts
│   └── index.ts
└── index.ts          # Barrel export
```

### 5.3 Domain Models

#### Card Domain

```typescript
interface Card {
  id: string;
  name: string;
  imagePath: string | null;
  imageUrl: string | null;

  // Core Stats (Tier 1)
  hp: number; // 1 - 99999
  atk: number; // 0 - 9999
  def: number; // 0 - 9999
  spd: number; // 0 - 999

  // Combat Stats (Tier 2)
  critChance: number; // 0 - 100
  critDamage: number; // 0 - 500
  armorPen: number; // 0 - 100
  lifesteal: number; // 0 - 100

  // Metadata
  createdAt: number;
  updatedAt: number;
}
```

#### Weapon Domain

```typescript
interface Weapon {
  id: string;
  name: string;
  weaponType: 'bow' | 'spear' | 'sword_shield';
  imagePath: string | null;
  imageUrl: string | null;

  // Stats
  atk: number;
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;
  attackRange: number;

  // Enhancement
  enhanceLevel: 0-15;
  enhanceHistory: EnhanceAttempt[];

  // Metadata
  createdAt: number;
  updatedAt: number;
}

interface WeaponTypeConfig {
  type: WeaponType;
  name: string;
  icon: string;
  baseStats: WeaponStats;
  skills: WeaponSkill[];
  characteristics: {
    attackSpeed: 'slow' | 'medium' | 'fast';
    damageType: 'physical' | 'piercing';
    playstyle: string;
  };
}
```

#### Battle Domain

```typescript
interface BattleCard {
  id: string;
  name: string;
  imageUrl: string | null;

  // HP
  maxHp: number;
  currentHp: number;

  // Effective Stats (Card + Weapon)
  atk: number;
  def: number;
  spd: number;
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;
}

interface AttackResult {
  attacker: BattleCard;
  defender: BattleCard;
  damage: number;
  defenderNewHp: number;
  attackerNewHp: number;
  isCritical: boolean;
  isKnockout: boolean;
  lifestealHeal: number;
  damageResult: DamageBreakdown;
}
```

---

## 6. Data Architecture

### 6.1 Storage Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA STORAGE STRATEGY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CLIENT-SIDE                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  IndexedDB (idb)                OPFS (Origin Private File System)   │   │
│  │  ┌─────────────────────┐       ┌─────────────────────────┐          │   │
│  │  │ • cards             │       │ • card-images/          │          │   │
│  │  │ • weapons           │       │ • weapon-images/        │          │   │
│  │  │ • gems              │       │ • gem-images/           │          │   │
│  │  │ • equipment         │       └─────────────────────────┘          │   │
│  │  │ • gemEquipment      │                                            │   │
│  │  │ • syncQueue         │       LocalStorage                         │   │
│  │  └─────────────────────┘       ┌─────────────────────────┐          │   │
│  │                                │ • goldBalance           │          │   │
│  │                                │ • dailyBonusLastClaim   │          │   │
│  │                                │ • userPreferences       │          │   │
│  │                                └─────────────────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVER-SIDE (Production)                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  PostgreSQL (Supabase)          Object Storage (S3/R2)              │   │
│  │  ┌─────────────────────┐       ┌─────────────────────────┐          │   │
│  │  │ • users             │       │ • card-images/          │          │   │
│  │  │ • cards             │       │ • weapon-images/        │          │   │
│  │  │ • weapons           │       │ • gem-images/           │          │   │
│  │  │ • gems              │       │ • battle-replays/       │          │   │
│  │  │ • equipment         │       └─────────────────────────┘          │   │
│  │  │ • battles           │                                            │   │
│  │  │ • bets              │       Redis (Upstash)                      │   │
│  │  │ • matchups          │       ┌─────────────────────────┐          │   │
│  │  └─────────────────────┘       │ • sessions              │          │   │
│  │                                │ • leaderboard           │          │   │
│  │                                │ • rate-limit-counters   │          │   │
│  │                                └─────────────────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Database Schema (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  gold_balance INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_path TEXT,
  hp INTEGER NOT NULL,
  atk INTEGER NOT NULL,
  def INTEGER NOT NULL,
  spd INTEGER NOT NULL,
  crit_chance INTEGER NOT NULL,
  crit_damage INTEGER NOT NULL,
  armor_pen INTEGER NOT NULL,
  lifesteal INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weapons
CREATE TABLE weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weapon_type TEXT NOT NULL CHECK (weapon_type IN ('bow', 'spear', 'sword_shield')),
  image_path TEXT,
  atk INTEGER NOT NULL,
  crit_chance INTEGER NOT NULL,
  crit_damage INTEGER NOT NULL,
  armor_pen INTEGER NOT NULL,
  lifesteal INTEGER NOT NULL,
  attack_range INTEGER NOT NULL,
  enhance_level INTEGER DEFAULT 0,
  enhance_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment (Card -> Weapon mapping)
CREATE TABLE equipment (
  card_id UUID PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  weapon_id UUID REFERENCES weapons(id) ON DELETE SET NULL,
  equipped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own cards" ON cards
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own weapons" ON weapons
  FOR ALL USING (auth.uid() = user_id);
```

---

## 7. Integration Architecture

### 7.1 API Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API INTEGRATION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SUPABASE CLIENT                                 │   │
│  │                                                                      │   │
│  │  // src/lib/supabase.ts                                             │   │
│  │  export const supabase = createClient(                              │   │
│  │    process.env.VITE_SUPABASE_URL,                                   │   │
│  │    process.env.VITE_SUPABASE_ANON_KEY                               │   │
│  │  );                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Endpoints:                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  REST API                       Real-time Subscriptions            │   │
│  │  ┌─────────────────────┐       ┌─────────────────────────┐          │   │
│  │  │ GET    /cards       │       │ cards:INSERT           │          │   │
│  │  │ POST   /cards       │       │ cards:UPDATE           │          │   │
│  │  │ PATCH  /cards/:id   │       │ cards:DELETE           │          │   │
│  │  │ DELETE /cards/:id   │       │ matchups:*             │          │   │
│  │  │                     │       │ battles:INSERT         │          │   │
│  │  │ POST   /rpc/battle  │       └─────────────────────────┘          │   │
│  │  │ POST   /rpc/enhance │                                            │   │
│  │  └─────────────────────┘       Storage API                          │   │
│  │                                ┌─────────────────────────┐          │   │
│  │  Auth API                      │ POST   /storage/upload  │          │   │
│  │  ┌─────────────────────┐       │ GET    /storage/:path   │          │   │
│  │  │ POST   /auth/signup │       │ DELETE /storage/:path   │          │   │
│  │  │ POST   /auth/login  │       └─────────────────────────┘          │   │
│  │  │ POST   /auth/logout │                                            │   │
│  │  │ GET    /auth/user   │                                            │   │
│  │  └─────────────────────┘                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 External Services

| Service            | Purpose              | Provider                         |
| ------------------ | -------------------- | -------------------------------- |
| **Authentication** | User login, OAuth    | Supabase Auth                    |
| **Database**       | Data persistence     | Supabase (PostgreSQL)            |
| **File Storage**   | Images               | Supabase Storage / Cloudflare R2 |
| **CDN**            | Static assets        | Cloudflare / Vercel Edge         |
| **Analytics**      | Usage tracking       | Plausible / Posthog              |
| **Error Tracking** | Exception monitoring | Sentry                           |
| **Email**          | Notifications        | Resend / Sendgrid                |

---

## 8. Security Architecture

### 8.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: NETWORK SECURITY                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Cloudflare DDoS Protection                                        │   │
│  │ • TLS 1.3 encryption in transit                                     │   │
│  │ • WAF (Web Application Firewall)                                    │   │
│  │ • Rate limiting (100 req/min)                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  LAYER 2: APPLICATION SECURITY                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Content Security Policy (CSP)                                     │   │
│  │ • XSS prevention (React escaping)                                   │   │
│  │ • CSRF tokens (SameSite cookies)                                    │   │
│  │ • Input validation (Zod schemas)                                    │   │
│  │ • Secure headers (HSTS, X-Frame-Options)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  LAYER 3: AUTHENTICATION & AUTHORIZATION                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Supabase Auth (JWT tokens)                                        │   │
│  │ • OAuth 2.0 (Google, Discord)                                       │   │
│  │ • Row-Level Security (RLS)                                          │   │
│  │ • Role-based access (user, admin)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  LAYER 4: DATA SECURITY                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • AES-256 encryption at rest                                        │   │
│  │ • Database encryption (Supabase)                                    │   │
│  │ • Secure key management (Vault)                                     │   │
│  │ • PII data minimization                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LOGIN REQUEST                                                           │
│     ┌──────────┐                      ┌──────────────┐                     │
│     │  Client  │ ─── email/pass ────► │ Supabase Auth│                     │
│     └──────────┘                      └──────────────┘                     │
│                                              │                              │
│  2. TOKEN RESPONSE                           │                              │
│     ┌──────────┐                             ▼                              │
│     │  Client  │ ◄── access_token ─── ┌──────────────┐                     │
│     │          │     refresh_token    │   JWT Token  │                     │
│     └──────────┘                      └──────────────┘                     │
│          │                                                                  │
│  3. API REQUEST                                                             │
│          │                                                                  │
│          ▼                                                                  │
│     ┌──────────────────────────────────────────────────────────────────┐   │
│     │  Authorization: Bearer <access_token>                            │   │
│     │  ───────────────────────────────────────────────────────────────►│   │
│     │                                                                  │   │
│     │              ┌─────────────┐    ┌─────────────┐                  │   │
│     │              │ Verify JWT  │───►│ Check RLS   │───► Data        │   │
│     │              └─────────────┘    └─────────────┘                  │   │
│     └──────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  4. TOKEN REFRESH (automatic)                                              │
│     ┌──────────┐                      ┌──────────────┐                     │
│     │  Client  │ ─── refresh_token ──►│ Supabase Auth│                     │
│     │          │ ◄── new access_token │              │                     │
│     └──────────┘                      └──────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. DevOps & Deployment

### 9.1 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Push   │───►│  Build  │───►│  Test   │───►│ Preview │───►│ Deploy  │  │
│  │         │    │         │    │         │    │         │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│       │              │              │              │              │        │
│       ▼              ▼              ▼              ▼              ▼        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        GITHUB ACTIONS                               │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │  on: push (main, develop)                                           │  │
│  │  on: pull_request                                                   │  │
│  │                                                                      │  │
│  │  jobs:                                                               │  │
│  │    lint:                                                             │  │
│  │      - eslint                                                        │  │
│  │      - prettier                                                      │  │
│  │      - typecheck                                                     │  │
│  │                                                                      │  │
│  │    test:                                                             │  │
│  │      - vitest (957 tests)                                           │  │
│  │      - coverage report                                              │  │
│  │                                                                      │  │
│  │    build:                                                            │  │
│  │      - vite build                                                   │  │
│  │      - bundle size check                                            │  │
│  │                                                                      │  │
│  │    preview: (PR only)                                               │  │
│  │      - deploy to Vercel preview                                     │  │
│  │                                                                      │  │
│  │    deploy: (main only)                                              │  │
│  │      - deploy to production                                         │  │
│  │      - Sentry release                                               │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Environment Strategy

| Environment     | Purpose    | URL                | Branch     |
| --------------- | ---------- | ------------------ | ---------- |
| **Development** | Local dev  | localhost:5173     | feature/\* |
| **Preview**     | PR review  | pr-\*.vercel.app   | PR         |
| **Staging**     | QA testing | staging.r2game.com | develop    |
| **Production**  | Live       | r2game.com         | main       |

### 9.3 Infrastructure as Code

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "regions": ["sin1", "hkg1"], # Singapore, Hong Kong
  "headers":
    [
      {
        "source": "/(.*)",
        "headers":
          [
            { "key": "X-Frame-Options", "value": "DENY" },
            { "key": "X-Content-Type-Options", "value": "nosniff" },
            {
              "key": "Referrer-Policy",
              "value": "strict-origin-when-cross-origin",
            },
          ],
      },
    ],
}
```

---

## 10. Monitoring & Observability

### 10.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OBSERVABILITY STACK                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  METRICS                           LOGS                                     │
│  ┌─────────────────────────┐      ┌─────────────────────────┐              │
│  │ • Core Web Vitals       │      │ • Application logs      │              │
│  │ • Custom performance    │      │ • Error logs            │              │
│  │ • API latency           │      │ • Audit logs            │              │
│  │ • Error rates           │      │                         │              │
│  │                         │      │ Provider: Axiom/Logtail │              │
│  │ Provider: web-vitals    │      └─────────────────────────┘              │
│  └─────────────────────────┘                                               │
│                                                                             │
│  TRACING                           ERRORS                                  │
│  ┌─────────────────────────┐      ┌─────────────────────────┐              │
│  │ • API request traces    │      │ • Exception capture     │              │
│  │ • User session replay   │      │ • Stack traces          │              │
│  │ • Performance timeline  │      │ • User context          │              │
│  │                         │      │ • Release tracking      │              │
│  │ Provider: Sentry        │      │                         │              │
│  └─────────────────────────┘      │ Provider: Sentry        │              │
│                                   └─────────────────────────┘              │
│                                                                             │
│  ANALYTICS                         ALERTING                                │
│  ┌─────────────────────────┐      ┌─────────────────────────┐              │
│  │ • Page views            │      │ • Error rate > 1%       │              │
│  │ • Feature usage         │      │ • P95 latency > 500ms   │              │
│  │ • Conversion funnels    │      │ • Uptime < 99.9%        │              │
│  │ • User retention        │      │                         │              │
│  │                         │      │ Channels:               │              │
│  │ Provider: Plausible     │      │ • Slack                 │              │
│  └─────────────────────────┘      │ • PagerDuty (critical)  │              │
│                                   └─────────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Key Metrics Dashboard

| Category        | Metric      | Target  | Alert Threshold |
| --------------- | ----------- | ------- | --------------- |
| **Performance** | LCP         | < 2.5s  | > 4s            |
| **Performance** | FID         | < 100ms | > 300ms         |
| **Performance** | CLS         | < 0.1   | > 0.25          |
| **Reliability** | Error rate  | < 0.1%  | > 1%            |
| **Reliability** | Uptime      | > 99.9% | < 99.5%         |
| **Business**    | DAU         | Growing | -20% WoW        |
| **Business**    | Battles/day | Growing | -30% WoW        |

---

## 11. Disaster Recovery

### 11.1 Backup Strategy

| Data Type    | Frequency                      | Retention  | Location        |
| ------------ | ------------------------------ | ---------- | --------------- |
| **Database** | Daily full, hourly incremental | 30 days    | Supabase + S3   |
| **Images**   | Real-time replication          | Indefinite | R2 multi-region |
| **Configs**  | On change                      | 90 days    | Git + S3        |

### 11.2 Recovery Procedures

| Scenario                | RTO      | RPO    | Procedure                |
| ----------------------- | -------- | ------ | ------------------------ |
| **Database corruption** | 1 hour   | 1 hour | Restore from backup      |
| **Region outage**       | 15 min   | 0      | Failover to secondary    |
| **Full outage**         | 4 hours  | 1 day  | Full restore from backup |
| **Data breach**         | 24 hours | N/A    | Incident response plan   |

---

## 12. Cost Analysis

### 12.1 Infrastructure Costs (Estimated)

| Service           | Free Tier             | Estimated Monthly Cost |
| ----------------- | --------------------- | ---------------------- |
| **Vercel**        | 100GB bandwidth       | $0 - $20               |
| **Supabase**      | 500MB DB, 1GB storage | $0 - $25               |
| **Cloudflare R2** | 10GB storage          | $0 - $5                |
| **Sentry**        | 5K events             | $0 - $26               |
| **Domain**        | N/A                   | $15/year               |
| **Total**         | -                     | **$0 - $80/month**     |

### 12.2 Scaling Costs

| Users            | Estimated Cost | Notes              |
| ---------------- | -------------- | ------------------ |
| 0 - 1,000        | $0 - $50       | Free tiers         |
| 1,000 - 10,000   | $50 - $200     | Pro plans          |
| 10,000 - 100,000 | $200 - $1,000  | Team/Business      |
| 100,000+         | $1,000+        | Enterprise, custom |

---

## 13. Risk Assessment

### 13.1 Technical Risks

| Risk                         | Probability | Impact   | Mitigation                  |
| ---------------------------- | ----------- | -------- | --------------------------- |
| **IndexedDB quota exceeded** | Medium      | High     | LRU eviction, user warning  |
| **Supabase outage**          | Low         | High     | Offline-first, multi-region |
| **Browser compatibility**    | Low         | Medium   | Progressive enhancement     |
| **Performance degradation**  | Medium      | Medium   | Monitoring, lazy loading    |
| **Security breach**          | Low         | Critical | Security audits, RLS        |

### 13.2 Business Risks

| Risk                    | Probability | Impact | Mitigation             |
| ----------------------- | ----------- | ------ | ---------------------- |
| **Low user adoption**   | Medium      | High   | Analytics, A/B testing |
| **Competitor features** | Medium      | Medium | Agile development      |
| **Technical debt**      | High        | Medium | Regular refactoring    |

---

## 14. Appendix

### 14.1 Glossary

| Term     | Definition                            |
| -------- | ------------------------------------- |
| **RLS**  | Row-Level Security (PostgreSQL)       |
| **OPFS** | Origin Private File System            |
| **LWW**  | Last-Write-Wins (conflict resolution) |
| **RTO**  | Recovery Time Objective               |
| **RPO**  | Recovery Point Objective              |

### 14.2 References

- [React 19 Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [TanStack Query Documentation](https://tanstack.com/query)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### 14.3 Version History

| Version | Date     | Author | Changes                 |
| ------- | -------- | ------ | ----------------------- |
| 1.0.0   | Feb 2026 | SA     | Initial document        |
| 2.0.0   | Feb 2026 | SA     | Production architecture |

---

_Document maintained by Solution Architecture Team_
