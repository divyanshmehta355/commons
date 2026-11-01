# Commons — Implementation Checklist

> **Tagline:** Share more. Waste less.
> **Last Updated:** 2026-10-31
> **Status Legend:**
> - `[x] COMPLETE` — Implemented, integrated, and verified.
> - `[~] PARTIAL` — Some functionality exists, but work remains.
> - `[ ] NOT IMPLEMENTED` — Functionality is missing.
> - `[!] BLOCKED` — Cannot proceed due to missing configuration/credential.

---

## Phase 1 — Foundation

### Feature 1: Application Foundation `[x] COMPLETE`
- [x] Next.js App Router setup
- [x] TypeScript configuration (`tsc --noEmit` passing)
- [x] Tailwind CSS configuration
- [x] Component library and design system
- [x] Responsive application layout
- [x] Navigation and sidebar
- [x] Loading states
- [x] Error states
- [x] Empty states
- [x] Toast / alert notifications
- [x] Reusable form components
- [x] Environment configuration (`.env.local` / `.env.example`)
- [x] Appwrite connection (Cloud endpoint, Project ID, Database ID, Bucket ID)
- [x] Authentication integration (`useAuth`, `@appwrite.io/react`, `app/api/appwrite/[...appwrite]`, `src/proxy.ts`)
- [x] Protected route handling
- [x] Server-side session validation

### Feature 2: Appwrite TablesDB `[x] COMPLETE`
- [x] `communities` table
- [x] `members` table
- [x] `resources` table
- [x] `resource_communities` table
- [x] `availability_rules` table
- [x] `borrow_requests` table
- [x] `transactions` table (with `handoverTokenHash`, `handoverExpiresAt`)
- [x] `reviews` table
- [x] `activity_logs` table
- [x] `wishlists` table (provisioned in Appwrite Cloud TablesDB)
- [x] `notifications` table (provisioned in Appwrite Cloud TablesDB)
- [x] `resource_reports` table (provisioned in Appwrite Cloud TablesDB)
- [x] Storage bucket `resource-media` provisioned for image uploads

---

## Phase 2 — Communities

### Feature 3: Community Management `[x] COMPLETE`
- [x] Create community page (`/communities/new`)
- [x] Community creation form with name, slug, description, city, region, visibility
- [x] Secure join code generation & SHA-256 hash storage
- [x] Community discovery and view page (`/communities/[id]`)
- [x] Join public community flow
- [x] Join private community with invitation code verification
- [x] Member directory (`/api/communities/[id]/members`)
- [x] Community dashboard (`/dashboard`)
- [x] Community roles: owner, admin, member
- [x] Member role management & suspension (`/api/communities/[id]/members/[memberId]`)
- [x] Server-side membership authorization guard (`checkCommunityMembership`)

---

## Phase 3 — Resource Listings

### Feature 4: Create and Manage Resources `[x] COMPLETE`
- [x] Create resource listing page (`/resources/new`)
- [x] Resource title, description, category, condition
- [x] Resource image upload to Appwrite Storage (`resource-media`)
- [x] Approximate pickup area (no exact addresses)
- [x] Sharing modes: Free lending, paid rental, exchange, or both
- [x] Informational rental daily price & currency
- [x] Cross-community discovery toggle
- [x] Resource creation API (`POST /api/resources`)
- [x] Resource editing page & API (`/resources/[id]/edit`, `PATCH /api/resources/[id]`)
- [x] Resource deletion/archive (`DELETE /api/resources/[id]`)
- [x] Pause listing & resume listing
- [x] Safety check: Cannot archive item currently in `'borrowed'` status
- [x] Resource owner dashboard (`/dashboard`)
- [x] Resource detail page (`/resources/[id]`)
- [x] Zod validation & owner authorization

---

## Phase 4 — Discovery

### Feature 5: Resource Discovery and Search `[x] COMPLETE`
- [x] Discover page (`/discover`)
- [x] Search by title, description, category, and pickup area
- [x] Filters: category, exchange mode, condition, community, availability
- [x] Cross-community visibility verification (public community + cross-community allowed, or membership)
- [x] Approximate pickup location display
- [x] Empty state & loading states
- [x] Appwrite TablesDB native `point` column `location` on `resources` and `communities`
- [x] Appwrite TablesDB native `polygon` column `boundary` on `communities`
- [x] "Near Me" GPS/browser geolocation acquisition
- [x] Radius distance filter (`< 2 km`, `< 5 km`, `< 10 km`, `< 25 km`, `All Distances`)
- [x] Proximity sorting (`Nearest First`) and distance badge display (`1.2 km away`)
- [x] Interactive OpenStreetMap View (`/discover` Grid ↔ Map toggle) with centroid pins
- [x] Unit tests for geo-spatial utilities (`tests/geo.test.ts`) (5/5 passed)

### Feature 6: Wishlist `[x] COMPLETE`
- [x] `wishlists` table in TablesDB
- [x] Add resource to wishlist (`POST /api/wishlists`)
- [x] Remove resource from wishlist (`DELETE /api/wishlists/[id]`)
- [x] Wishlist check endpoint (`GET /api/wishlists/check?resourceId=...`)
- [x] Wishlist page (`/wishlist`)
- [x] Wishlist button on resource detail page (`/resources/[id]`)
- [x] Navbar wishlist navigation link
- [x] Route protection for `/wishlist` in proxy
- [x] Prevent duplicate wishlist entries
- [x] User-specific authorization
- [x] Handle archived resources gracefully
- [x] Unit tests (`tests/wishlist.test.ts`) (4/4 passed)

---

## Phase 5 — Availability and Booking

### Feature 7: Availability Calendar `[x] COMPLETE`
- [x] Availability check API (`POST /api/resources/[id]/availability`)
- [x] Date range validation & half-open interval conflict detection
- [x] Prevent past-date requests
- [x] Availability intervals query endpoint (`GET /api/resources/[id]/availability`)
- [x] Owner custom blackout rules endpoint (`POST` & `DELETE /api/resources/[id]/blackout`)
- [x] Visual availability schedule component on `/resources/[id]`
- [x] Owner schedule & blackout manager on owner panel

### Feature 8: Booking Requests `[x] COMPLETE`
- [x] Request booking button & date selection
- [x] Borrower optional message & mode selection
- [x] Rental quote calculation & server-side validation
- [x] Create pending booking request (`POST /api/requests`)
- [x] Incoming and outgoing requests inbox (`/requests`)
- [x] Request detail page (`/requests/[id]`)
- [x] Owner approve request (`POST /api/requests/[id]/approve`)
- [x] Owner reject request (`POST /api/requests/[id]/reject`)
- [x] Borrower cancel request (`POST /api/requests/[id]/cancel`)
- [x] Double-booking prevention on approval (half-open intervals)
- [x] Transaction generation on approval
- [x] Activity logging

---

## Phase 6 — Handover and Return

### Feature 9: QR-Powered Handover `[x] COMPLETE`
- [x] Transaction detail page (`/transactions/[id]`)
- [x] Participant authorization (borrower & owner only)
- [x] Handover token generation & QR code (`GET /api/transactions/[id]/handover`)
- [x] Cryptographically secure random 6-character token & SHA-256 hash storage
- [x] Token expiration (24 hours) & single-use enforcement
- [x] QR code display with verified contrast (`#064e3b` on `#ffffff`)
- [x] Manual 6-character code entry fallback
- [x] Server-side token verification (`POST /api/transactions/[id]/handover`)
- [x] Update status to `'borrowed'` and record handover timestamp
- [x] Activity logging (`handover_verified_with_token`)
- [x] Unit tests (`tests/handover.test.ts`) (4/4 passed)

### Feature 10: Return Confirmation `[x] COMPLETE`
- [x] Return confirmation endpoint (`POST /api/transactions/[id]/return`)
- [x] Owner return confirmation & borrower acknowledgment
- [x] Return timestamp recorded
- [x] Transaction status updated to `'returned'`
- [x] Overdue status calculation based on `dueAt`
- [x] Prevent duplicate return actions

---

## Phase 7 — Trust and Reputation

### Feature 11: Member Profiles and Reviews `[x] COMPLETE`
- [x] Member profile page (`/profile`)
- [x] Profile information & verified email badge
- [x] Verified review submission endpoint (`POST /api/transactions/[id]/reviews`)
- [x] Profile overview endpoint (`GET /api/profile`)
- [x] Rating 1 to 5 with accurate average calculation
- [x] Display verified community reviews list with star rating, dates, and comments
- [x] Dynamic trust badges: First Share, Trusted Lender, Community Helper, Top Rated
- [x] Real-time lending & borrowing counts (Lent to neighbors, Borrowed items, Total shares)
- [x] Community membership hubs list
- [x] Unit tests (`tests/profile.test.ts`) (4/4 passed)

---

## Phase 8 — Community Impact

### Feature 12: Impact Dashboard `[x] COMPLETE`
- [x] Community dashboard (`/dashboard`)
- [x] Active resource count, completed shares, active members
- [x] Estimated savings calculation with transparent methodology
- [x] Environmental impact calculation (kg CO2 avoided)
- [x] Interactive Recharts category breakdown & trends

### Feature 13: Community Activity Feed `[x] COMPLETE`
- [x] `activity_logs` table & logging service
- [x] Activity feed section on community page (`/communities/[id]`)
- [x] Events logged: new resource, borrow request, completed share, review submitted
- [x] Relative timestamps & actor details

---

## Phase 9 — Notifications and Safety

### Feature 14: In-App Notifications `[x] COMPLETE`
- [x] `notifications` table in TablesDB
- [x] Lifecycle trigger: New booking request notification (to owner)
- [x] Lifecycle trigger: Booking approved notification (to borrower)
- [x] Lifecycle trigger: Booking rejected notification (to borrower)
- [x] Lifecycle trigger: Booking cancelled notification (to owner)
- [x] Lifecycle trigger: Handover verified notification (to partner)
- [x] Lifecycle trigger: Return completed notification (to partner with review invite)
- [x] Notifications API (`GET /api/notifications`, `PATCH /api/notifications/[id]`, `POST /api/notifications/read-all`)
- [x] Navbar notification bell with live unread badge
- [x] Notifications management page (`/notifications`) with direct links
- [x] Route protection for `/notifications` in proxy
- [x] Unit tests (`tests/notifications.test.ts`) (4/4 passed)

### Feature 15: Reporting and Moderation `[x] COMPLETE`
- [x] `resource_reports` table in TablesDB
- [x] Report resource button & modal on resource page (`/resources/[id]`)
- [x] Reason selection & description (`inappropriate`, `unsafe`, `damaged`, `misleading`, `other`)
- [x] Admin moderation queue (`/communities/[id]/moderation`)
- [x] Admin action: Pause / Archive reported listing
- [x] Admin action: Resolve / Dismiss report
- [x] Unit tests (`tests/moderation.test.ts`) (4/4 passed)

---

## Phase 10 — Advanced Features

### Feature 16: Exchange Matching `[x] COMPLETE`
- [x] Exchange offers table (`exchange_offers`) provisioned in Appwrite Cloud TablesDB
- [x] Exchange endpoints (`POST /api/exchange/offers`, `GET /api/exchange/offers`, `POST /api/exchange/offers/[id]/respond`)
- [x] Matching available exchange candidate items (`GET /api/exchange/my-resources`)
- [x] Resource page exchange proposal modal & button (`/resources/[id]`)
- [x] Requests inbox Exchange Offers tab with Accept, Decline, and Cancel lifecycle (`/requests`)
- [x] Unit tests (`tests/exchange.test.ts`) (3/3 passed)

### Feature 17: Waitlist `[x] COMPLETE`
- [x] Resource waitlist table (`waitlist_entries`) provisioned in Appwrite Cloud TablesDB
- [x] Waitlist endpoints (`GET /api/resources/[id]/waitlist`, `POST /api/resources/[id]/waitlist`, `DELETE /api/resources/[id]/waitlist`)
- [x] Join / leave waitlist button & queue indicator on resource detail page (`/resources/[id]`)
- [x] Automated notification dispatch to waitlisted users upon item return (`/api/transactions/[id]/return`)
- [x] Unit tests (`tests/waitlist.test.ts`) (4/4 passed)

### Feature 18: Resource Bundles `[x] COMPLETE`
- [x] Resource bundles table (`resource_bundles`) provisioned in Appwrite Cloud TablesDB
- [x] Bundle management endpoints (`POST /api/communities/[id]/bundles`, `GET /api/communities/[id]/bundles`)
- [x] Community page Curated Kits tab & kit creation modal (`/communities/[id]`)
- [x] Multi-item kit availability detection (detecting when all constituent items are ready vs in-use)
- [x] Unit tests (`tests/bundles.test.ts`) (3/3 passed)

### Feature 19: Community Challenges `[x] COMPLETE`
- [x] Community challenges table (`community_challenges`) provisioned in Appwrite Cloud TablesDB
- [x] Challenge management endpoints (`POST /api/communities/[id]/challenges`, `GET /api/communities/[id]/challenges`)
- [x] Real-time completed shares progress computation & goal percentage calculation
- [x] Community page challenges sidebar card with animated progress bar (`/communities/[id]`)
- [x] Admin challenge launch modal with target and dates selection
- [x] Unit tests (`tests/challenges.test.ts`) (4/4 passed)

---

## Phase 11 — Final Quality Assurance

### Feature 20: Security and Permissions Audit `[x] COMPLETE`
- [x] Server-side session validation (`requireAuthUser`, Appwrite cookie verification)
- [x] Never trust client-provided IDs or roles (all identity resolved server-side from session)
- [x] Protected routes in proxy (`/dashboard`, `/requests`, `/transactions`, `/profile`, `/wishlist`, `/notifications`, `/resources/new`, `/communities/new`, `/onboarding`)
- [x] Zod validation for external payloads across all endpoints
- [x] Comprehensive security, boundary, and edge-case unit test coverage

### Feature 21: Automated Tests `[x] COMPLETE`
- [x] Storage tests (`tests/storage.test.ts`) (4/4 passed)
- [x] Booking tests (`tests/booking.test.ts`) (8/8 passed)
- [x] Permissions tests (`tests/permissions.test.ts`) (4/4 passed)
- [x] Community & membership tests (`tests/communities.test.ts`) (4/4 passed)
- [x] Handover token tests (`tests/handover.test.ts`) (4/4 passed)
- [x] Wishlist tests (`tests/wishlist.test.ts`) (4/4 passed)
- [x] Notification tests (`tests/notifications.test.ts`) (4/4 passed)
- [x] Moderation tests (`tests/moderation.test.ts`) (4/4 passed)
- [x] Exchange tests (`tests/exchange.test.ts`) (3/3 passed)
- [x] Waitlist tests (`tests/waitlist.test.ts`) (4/4 passed)
- [x] Bundle tests (`tests/bundles.test.ts`) (3/3 passed)
- [x] Challenge tests (`tests/challenges.test.ts`) (4/4 passed)
- [x] Profile tests (`tests/profile.test.ts`) (4/4 passed)
- [x] Total: 54 / 54 unit tests passing cleanly

### Feature 22: UI and Responsive Polish `[x] COMPLETE`
- [x] High-contrast WCAG AAA light theme
- [x] Mobile and desktop responsive layouts
- [x] Consistent form components & image upload

### Feature 23: Demo Readiness `[x] COMPLETE`
- [x] Demo seed script (`scripts/seed-demo.ts`)
- [x] Demo communities, resources, and completed transaction
- [x] Zero external LLM / AI dependencies
