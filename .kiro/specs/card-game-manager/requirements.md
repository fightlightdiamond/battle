# Requirements Document

## Introduction

Trang quản lý Card Game đơn giản cho phép người dùng thực hiện các thao tác CRUD (Create, Read, Update, Delete) trên các thẻ bài (cards). Mỗi thẻ bài có các thuộc tính cơ bản: tên (name), điểm tấn công (ATK), và điểm máu (HP). Ứng dụng sử dụng React với TanStack Query, React Hook Form, Zustand và shadcn/ui.

## Glossary

- **Card**: Một thẻ bài trong game với các thuộc tính name, ATK, HP, và image
- **Card_Manager**: Hệ thống quản lý thẻ bài
- **ATK**: Attack - Điểm tấn công của thẻ bài (số nguyên không âm)
- **HP**: Hit Points - Điểm máu của thẻ bài (số nguyên dương)
- **Card_Image**: Hình ảnh đại diện cho thẻ bài (file ảnh PNG, JPG, WEBP)
- **CRUD**: Create, Read, Update, Delete - Các thao tác cơ bản trên dữ liệu

## Requirements

### Requirement 1

**User Story:** As a user, I want to view all cards in a paginated list with search and sort, so that I can easily find and manage cards in my collection.

#### Acceptance Criteria

1. WHEN the user opens the Card_Manager THEN the Card_Manager SHALL display a paginated list of cards with their image, name, ATK, and HP values
2. WHEN no cards exist THEN the Card_Manager SHALL display an empty state message indicating no cards are available
3. WHEN cards are loading THEN the Card_Manager SHALL display a loading indicator
4. WHEN a card has no image THEN the Card_Manager SHALL display a placeholder image
5. WHEN the user enters a search term THEN the Card_Manager SHALL filter cards by name containing the search term
6. WHEN the user selects a sort option THEN the Card_Manager SHALL sort cards by the selected field (name, ATK, HP) in ascending or descending order
7. WHEN the card list exceeds the page size THEN the Card_Manager SHALL display pagination controls
8. WHEN the user clicks a pagination control THEN the Card_Manager SHALL display the corresponding page of cards
9. THE Card_Manager SHALL display 10 cards per page by default

### Requirement 2

**User Story:** As a user, I want to create a new card, so that I can add cards to my collection.

#### Acceptance Criteria

1. WHEN the user clicks the add button THEN the Card_Manager SHALL navigate to the create card page with a form containing fields for name, ATK, HP, and image upload
2. WHEN the user submits a valid card form THEN the Card_Manager SHALL create a new card and add it to the list
3. WHEN the user submits a form with an empty name THEN the Card_Manager SHALL display a validation error and prevent submission
4. WHEN the user submits a form with negative ATK value THEN the Card_Manager SHALL display a validation error and prevent submission
5. WHEN the user submits a form with HP value less than 1 THEN the Card_Manager SHALL display a validation error and prevent submission
6. WHEN a card is successfully created THEN the Card_Manager SHALL navigate back to the card list page
7. WHEN the user uploads an image THEN the Card_Manager SHALL accept PNG, JPG, and WEBP formats only
8. WHEN the user uploads an image larger than 2MB THEN the Card_Manager SHALL display a validation error and prevent submission
9. WHEN no image is uploaded THEN the Card_Manager SHALL allow card creation with a default placeholder image

### Requirement 3

**User Story:** As a user, I want to edit an existing card, so that I can update card information.

#### Acceptance Criteria

1. WHEN the user clicks the edit button on a card THEN the Card_Manager SHALL display a form pre-filled with the card's current values including the current image
2. WHEN the user submits a valid edit form THEN the Card_Manager SHALL update the card with new values
3. WHEN the user edits a card THEN the Card_Manager SHALL apply the same validation rules as card creation
4. WHEN a card is successfully updated THEN the Card_Manager SHALL close the form and refresh the card list
5. WHEN the user uploads a new image during edit THEN the Card_Manager SHALL replace the existing image with the new one

### Requirement 4

**User Story:** As a user, I want to delete a card, so that I can remove unwanted cards from my collection.

#### Acceptance Criteria

1. WHEN the user clicks the delete button on a card THEN the Card_Manager SHALL display a confirmation dialog
2. WHEN the user confirms deletion THEN the Card_Manager SHALL remove the card from the list
3. WHEN the user cancels deletion THEN the Card_Manager SHALL close the dialog and keep the card unchanged

### Requirement 5

**User Story:** As a user, I want card data to persist in IndexedDB, so that my cards are saved between sessions with better storage capacity.

#### Acceptance Criteria

1. WHEN a card is created, updated, or deleted THEN the Card_Manager SHALL persist the change to IndexedDB immediately
2. WHEN the application loads THEN the Card_Manager SHALL restore cards from IndexedDB
3. WHEN IndexedDB is empty or unavailable THEN the Card_Manager SHALL initialize with an empty card list
4. WHEN IndexedDB operations fail THEN the Card_Manager SHALL display an error message to the user

### Requirement 6

**User Story:** As a user, I want to serialize and deserialize card data, so that card information can be stored and retrieved correctly from IndexedDB.

#### Acceptance Criteria

1. WHEN storing cards to IndexedDB THEN the Card_Manager SHALL serialize card data correctly
2. WHEN loading cards from IndexedDB THEN the Card_Manager SHALL deserialize data back to card objects
3. WHEN serializing and deserializing a card THEN the Card_Manager SHALL preserve all card properties exactly (round-trip consistency)
