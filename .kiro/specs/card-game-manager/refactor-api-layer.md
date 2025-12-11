# Refactor: API Layer với json-server + Offline Support

## Mục tiêu

Tích hợp json-server làm REST API cho card metadata, giữ IndexedDB cho offline storage và OPFS cho image storage.

## Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
├─────────────────────────────────────────────────────────┤
│  Components                                             │
│      ↓                                                  │
│  TanStack Query (cache, loading, error states)          │
│      ↓                                                  │
│  Hooks Layer (online/offline logic)                     │
│      ↓                    ↓                             │
│  json-server          IndexedDB                         │
│  (online API)         (offline storage)                 │
│      ↓                    ↓                             │
│              OPFS (images)                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    json-server                          │
│  GET    /cards?_page=1&_limit=10&q=search&_sort=name    │
│  GET    /cards/:id                                      │
│  POST   /cards                                          │
│  PUT    /cards/:id                                      │
│  DELETE /cards/:id                                      │
└─────────────────────────────────────────────────────────┘
```

## Phân chia trách nhiệm

| Component      | Trách nhiệm                                             |
| -------------- | ------------------------------------------------------- |
| json-server    | Card metadata khi online (id, name, atk, hp, imagePath) |
| IndexedDB      | Card metadata khi offline (backup/fallback)             |
| OPFS           | Image files storage                                     |
| TanStack Query | Caching, refetch, loading states                        |
| Zustand        | UI state (dialogs)                                      |
| Hooks          | Online/offline detection, sync logic                    |

## Data Flow

### Online Mode

1. **Read**: Fetch từ json-server → Convert với image từ OPFS
2. **Create**: Save image to OPFS → POST to json-server → Save to IndexedDB
3. **Update**: Update OPFS if new image → PUT to json-server → Update IndexedDB
4. **Delete**: DELETE from json-server → Delete from IndexedDB → Delete image from OPFS

### Offline Mode

1. **Read**: Fetch từ IndexedDB → Load image từ OPFS
2. **Create**: Save image to OPFS → Save to IndexedDB (sync later)
3. **Update**: Update OPFS if new image → Update IndexedDB (sync later)
4. **Delete**: Delete from IndexedDB → Delete image from OPFS (sync later)

## Data Model

### Server (db.json)

```json
{
  "cards": [
    {
      "id": "uuid",
      "name": "Card Name",
      "atk": 100,
      "hp": 200,
      "imagePath": "uuid.png",
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

### IndexedDB (card-game-db)

Same structure as server, used for offline access.

## File Structure

```
project/
├── db.json                 # json-server database
├── src/features/cards/
│   ├── api/
│   │   ├── cardApi.ts      # API calls (fetch to json-server)
│   │   └── types.ts        # API types
│   ├── services/
│   │   ├── db.ts           # IndexedDB setup
│   │   ├── cardService.ts  # IndexedDB CRUD operations
│   │   └── imageStorage.ts # OPFS image storage
│   ├── hooks/
│   │   └── index.ts        # TanStack Query hooks với online/offline logic
│   └── store/
│       └── index.ts        # Zustand (UI state)
```

## Tasks

- [x] 1. Setup json-server

  - Install json-server
  - Create db.json với sample data
  - Add npm script để chạy server

- [x] 2. Tạo API layer

  - Tạo api/types.ts với API types
  - Tạo api/cardApi.ts với fetch calls

- [x] 3. Cập nhật hooks với online/offline support

  - Thêm online/offline detection
  - Read: Try API first, fallback to IndexedDB
  - Create/Update/Delete: Save to both API và IndexedDB
  - Handle errors gracefully

- [x] 4. Test và verify

  - Chạy json-server + vite dev
  - Test CRUD operations khi online
  - Test CRUD operations khi offline (disconnect network)
  - Verify data sync giữa API và IndexedDB

- [x] 5. Implement sync queue
  - Queue offline changes
  - Sync khi online trở lại
  - Handle conflicts
