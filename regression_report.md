# Regression Report — Post-Fix Verification Pass

**Date**: 2026-09-10  
**Baseline Commit**: `df9b573`  
**Head Commit**: `main`  
**Scope**: Full traceability, cross-layer call signatures, data shapes, error propagation, and security spot-checks across all touched files.

---

## 1. Traceability & Interface Verification

Every call across API routes, controllers, services, database models, Redis, and Socket.IO handlers was verified for:
1. **Target existence**: All referenced functions, methods, and model schemas exist.
2. **Signature & Parameter alignment**: Parameter names, counts, types, and ordering match strictly.
3. **Return data shapes**: Controllers and socket handlers consume the exact types returned by services and models.
4. **Error propagation**: Handlers either handle rejections gracefully with client-facing HTTP/socket error payloads or let them propagate through standard Express error paths without crashing node processes.

### Changed Files & Interface Verification Matrix

| Changed File | Inbound Callers | Outbound Targets | Traceability Status |
|--------------|-----------------|------------------|---------------------|
| `backend/src/routes/authRoutes.ts` | Express Router (`/api/auth`) | `authController.*`, `authMiddleware`, `rateLimiter` | ✅ Confirmed |
| `backend/src/controllers/authController.ts` | `authRoutes.ts` | `authService.*`, cookie parser | ✅ Confirmed |
| `backend/src/services/authService.ts` | `authController.ts` | `UserModel`, `tokenUtils`, `passwordUtils`, `emailUtils` | ✅ Confirmed |
| `backend/src/utils/passwordUtils.ts` | `authService.ts` | `crypto`, `bcrypt` | ✅ Confirmed |
| `backend/src/models/User.ts` | `authService`, `userService`, `presenceHandler`, `callHandler` | Mongoose Model | ✅ Confirmed |
| `backend/src/routes/userRoutes.ts` | Express Router (`/api/users`) | `userController.*`, `uploadMiddleware`, `authMiddleware` | ✅ Confirmed |
| `backend/src/controllers/userController.ts` | `userRoutes.ts` | `userService.*`, `uploadUtils` | ✅ Confirmed |
| `backend/src/services/userService.ts` | `userController.ts` | `UserModel`, `FriendshipModel`, `cacheUtils` | ✅ Confirmed |
| `backend/src/routes/conversationRoutes.ts` | Express Router (`/api/conversations`) | `conversationController.*`, `authMiddleware` | ✅ Confirmed |
| `backend/src/controllers/conversationController.ts` | `conversationRoutes.ts` | `conversationService.*` | ✅ Confirmed |
| `backend/src/services/conversationService.ts` | `conversationController.ts`, `chatHandler.ts` | `ConversationModel`, `MessageModel`, `FriendshipModel`, `UserModel`, `socketManager` | ✅ Confirmed |
| `backend/src/models/Conversation.ts` | `conversationService`, `chatHandler`, `callHandler` | Mongoose Model | ✅ Confirmed |
| `backend/src/services/friendService.ts` | `friendController.ts` | `FriendRequestModel`, `FriendshipModel`, `socketManager` | ✅ Confirmed |
| `backend/src/controllers/messageController.ts` | `messageRoutes.ts` | `messageService.*`, `uploadUtils` | ✅ Confirmed |
| `backend/src/services/messageService.ts` | `messageController.ts`, `chatHandler.ts` | `MessageModel`, `ConversationModel`, `socketManager` | ✅ Confirmed |
| `backend/src/models/Message.ts` | `messageService`, `conversationService`, `callHandler` | Mongoose Model | ✅ Confirmed |
| `backend/src/socket/socketManager.ts` | `index.ts` | `chatHandler`, `presenceHandler`, `callHandler`, `redisClient` | ✅ Confirmed |
| `backend/src/socket/handlers/chatHandler.ts` | `socketManager.ts` | `ConversationModel`, `messageService.*`, `redisClient` | ✅ Confirmed |
| `backend/src/socket/handlers/callHandler.ts` | `socketManager.ts` | `ConversationModel`, `MessageModel`, `UserModel`, `redisClient` | ✅ Confirmed |
| `backend/src/socket/handlers/presenceHandler.ts` | `socketManager.ts` | `UserModel`, `FriendshipModel`, `redisClient`, `socketManager` | ✅ Confirmed |
| `backend/src/controllers/iceController.ts` | `iceRoutes.ts` | `crypto` (HMAC-SHA1 RFC 8489) | ✅ Confirmed |
| `backend/src/app.ts` | `index.ts` | Middleware stack, security headers, CORS regex | ✅ Confirmed |
| `backend/src/config/database.ts` | `app.ts` | Mongoose connect with error logging | ✅ Confirmed |

---

## 2. Regression Spot-Check by Task ID

### 🔴 Critical Tasks (11 / 11)
- [x] **T-001** (`backend/.env`): ✅ **Confirmed Fixed** — Removed secrets from git tracking, created `.env.example`, updated `.gitignore`.
- [x] **T-002** (`authRoutes.ts:21`): ✅ **Confirmed Fixed** — Added `authMiddleware` to `POST /auth/logout`; eliminates unauthenticated crash on `req.user.userId`.
- [x] **T-003** (`passwordUtils.ts:28`): ✅ **Confirmed Fixed** — Password reset uses 32-byte CSPRNG token (`crypto.randomBytes(32)`).
- [x] **T-004** (`authService.ts:167`): ✅ **Confirmed Fixed** — `requestPasswordReset` returns generic success message regardless of whether user exists.
- [x] **T-005** (`conversationService.ts:168`): ✅ **Confirmed Fixed** — Batch query in `createGroupConversation` fetches all participant friendships in one single DB operation.
- [x] **T-006** (`conversationService.ts:10`): ✅ **Confirmed Fixed** — `getUserConversations` supports `page` and `limit`, sorts visible chats, and computes unread count aggregation only on the paginated slice.
- [x] **T-007** (`messageService.ts:196`): ✅ **Confirmed Fixed** — `markConversationDelivered` pre-fetches exact candidate IDs before `updateMany`, returning only accurately modified IDs.
- [x] **T-008** (`presenceHandler.ts:80`): ✅ **Confirmed Fixed** — Disconnect handler uses single `findByIdAndUpdate` and parallelizes friend notifications via `Promise.all`.
- [x] **T-009** (`presenceHandler.ts:17`): ✅ **Confirmed Fixed** — `getFriendIds` caches friend ID lists in Redis with 60s TTL.
- [x] **T-010** (`callHandler.ts:77`): ✅ **Confirmed Fixed** — Startup `cleanupStaleCallStates` inspects Redis call keys, cleans orphaned keys, and records missed call messages.
- [x] **T-011** (`userController.ts:94`): ✅ **Confirmed Fixed** — `DELETE /api/users/:id` strictly enforces self-delete (`requesterId === targetId`).

### 🟠 High Priority Tasks (13 / 13)
- [x] **T-012** (`iceController.ts:22`): ✅ **Confirmed Fixed** — Generates time-limited HMAC-SHA1 ephemeral TURN credentials (RFC 8489).
- [x] **T-013** (`callHandler.ts:159`): ✅ **Confirmed Fixed** — `callerInfo` fetched server-side from DB via `callerId` from authenticated token; client-supplied identity ignored.
- [x] **T-014** (`chatHandler.ts:103`): ✅ **Confirmed Fixed** — Per-user per-event Redis rate limiting on typing events (`checkSocketRateLimit`).
- [x] **T-015** (`app.ts:23`, `socketManager.ts:33`): ✅ **Confirmed Fixed** — Replaced ngrok substring match with strict regex `^https?://[a-z0-9-]+\.ngrok(\.io|\.app|-free\.app)?$`.
- [x] **T-016** (`userService.ts:51`): ✅ **Confirmed Fixed** — `getUserById` sanitizes non-friend profile data, hiding sensitive fields (email, etc.) to prevent IDOR leaks.
- [x] **T-017** (`userController.ts:5`): ✅ **Confirmed Fixed** — Deprecated `creatUser` on `POST /api/users` in favor of standard `/api/auth/register`.
- [x] **T-018** (`authService.ts:164`): ✅ **Confirmed Fixed** — Removed duplicate `UserModel.findOne` query in `requestPasswordReset`.
- [x] **T-019** (`callHandler.ts:47`): ✅ **Confirmed Fixed** — Uses strongly typed `new MessageModel({ ... }).save()`.
- [x] **T-020** (`callHandler.ts:122`): ✅ **Confirmed Fixed** — `withErrorBoundary` wraps async call socket handlers, catching rejections and emitting `call:error`.
- [x] **T-021** (`userRoutes.ts:12`): ✅ **Confirmed Fixed** — Avatar upload uses shared `uploadMiddleware` (enforcing 10MB limit and memory storage).
- [x] **T-022** (`authService.ts:181`): ✅ **Confirmed Fixed** — `resetToken` removed from `requestPasswordReset` return value.
- [x] **T-023** (`messageService.ts:88`): ✅ **Confirmed Fixed** — `createMessage` updates `lastMessageId` and `lastMessageAt` atomically with `findByIdAndUpdate`.
- [x] **T-024** (`messageService.ts:314`): ✅ **Confirmed Fixed** — `toggleReaction` uses atomic MongoDB operators (`$pull`, `$addToSet`, `$push`).

### 🟡 Medium Priority Tasks (15 / 15)
- [x] **T-025** (`models/User.ts:80`, `authService.ts:40, 140`): ✅ **Confirmed Fixed** — Stores SHA-256 hashed refresh token array (multi-device up to 5 sessions) with automated family invalidation on reuse.
- [x] **T-026** (`authService.ts:9`): ✅ **Confirmed Fixed** — Verification codes use `crypto.randomInt(100000, 1000000)`.
- [x] **T-027** (`callHandler.ts:213`): ✅ **Confirmed Fixed** — `call:reject` verifies requester is an active call participant before deleting state.
- [x] **T-028** (`chatHandler.ts:82`): ✅ **Confirmed Fixed** — `mark_seen` validates user has joined conversation room (`socket.rooms.has`).
- [x] **T-029** (`chatHandler.ts:100`): ✅ **Confirmed Fixed** — `typing_start`/`typing_stop` verifies room membership before broadcasting.
- [x] **T-030** (`authService.ts:121`): ✅ **Confirmed Fixed** — 60-second cooldown enforced on `resendVerificationCode` via `emailVerificationLastSent`.
- [x] **T-031** (`conversationService.ts:503`): ✅ **Confirmed Fixed** — `inviteTokenExpiresAt` added, expired links rejected, `revokeInviteToken` endpoint added.
- [x] **T-032** (`messageController.ts:38`, `authService.ts:75`): ✅ **Confirmed Fixed** — Removed message content from logs; masked email addresses in register logs.
- [x] **T-033** (`conversationService.ts:15`): ✅ **Confirmed Fixed** — `getUserConversations` queries `participants` using `userObjectId`.
- [x] **T-034** (`messageService.ts:249`): ✅ **Confirmed Fixed** — `markConversationSeen` emits `conversation_seen` to conversation room.
- [x] **T-035** (`messageService.ts:85`): ✅ **Confirmed Fixed** — Eliminated `countDocuments` scan in `createMessage` by checking `!conversation.lastMessageId`.
- [x] **T-036** (`messageService.ts:314`): ✅ **Confirmed Fixed** — Simplified reaction toggle logic with atomic operators.
- [x] **T-037** (`socketManager.ts:53`): ✅ **Confirmed Fixed** — Startup hook flushes stale `user:sockets:*` hashes from Redis.
- [x] **T-038** (`conversationController.ts:227`): ✅ **Confirmed Fixed** — Validates `mutedUntil` is a valid parseable date before passing to service.
- [x] **T-039** (`chatHandler.ts:53`): ✅ **Confirmed Fixed** — Guarded `join_conversation` status updates when socket is already in room.

### 🟢 Low Priority Tasks (13 / 13)
- [x] **T-040** (`authController.ts:25, 110`): ✅ **Confirmed Fixed** — `sameSite: 'strict'` set on refresh token cookie.
- [x] **T-041** (`app.ts:31`): ✅ **Confirmed Fixed** — Explicit `express.json({ limit: '1mb' })`.
- [x] **T-042** (`app.ts:35`): ✅ **Confirmed Fixed** — Security headers middleware added (`X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `Referrer-Policy`).
- [x] **T-043** (`models/User.ts:106`): ✅ **Confirmed Fixed** — Added `{ timestamps: true }` to User schema.
- [x] **T-044** (`authService.ts:114`): ✅ **Confirmed Fixed** — `resendVerificationCode` returns unified generic message for nonexistent or already-verified accounts.
- [x] **T-045** (`userService.ts:75`): ✅ **Confirmed Fixed** — Documented `updateUser` as internal admin helper.
- [x] **T-046** (`userController.ts:20`): ✅ **Confirmed Fixed** — `getUsers` controller forwards `page`, `limit`, `sortBy` query parameters.
- [x] **T-047** (`config/database.ts:11`): ✅ **Confirmed Fixed** — Logs DB connection error before `process.exit(1)`.
- [x] **T-048** (`callHandler.ts:47`): ✅ **Confirmed Fixed** — Proper Mongoose document initialization without type assertion.
- [x] **T-049** (`messageService.ts:44`): ✅ **Confirmed Fixed** — Documented reverse sort rationale for cursor pagination.
- [x] **T-050** (`userController.ts:5`): ✅ **Confirmed Fixed** — JSDoc documentation and route deprecation.
- [x] **T-051** (`models/Message.ts:109`): ✅ **Confirmed Fixed** — Added compound index `{ conversationId: 1, status: 1 }`.
- [x] **T-052** (`friendService.ts:83`): ✅ **Confirmed Fixed** — Deterministic `user1Id < user2Id` ordering using `localeCompare`.

---

## 3. Regression Verdict

- ✅ **Confirmed Fixed**: 52
- ⚠️ **Partially Fixed**: 0
- ❌ **Broken / Regressed**: 0

**TypeScript Compilation**: `npx tsc --noEmit` exited with code 0 (no errors).  
**Conclusion**: All fixes are verified, type-safe, trace-aligned, and clean of regressions.
