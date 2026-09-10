# tasks.md — Code Review Action Items

> Generated from the full security, optimization, and traceability review.  
> All 52 tasks have been implemented, verified, and merged into `main`.

---

## 🔴 CRITICAL

| ID | Area | Priority | Location | Description | Suggested Fix | Status | Commit / Branch |
|----|------|----------|----------|-------------|---------------|--------|-----------------|
| T-001 | Security | Critical | `backend/.env` | Real secrets (JWT, Cloudinary, Gmail) committed to repo | Rotate all secrets; remove `.env` from git; use secret manager or env injection | `[x] DONE` | `33f7323` |
| T-002 | Security | Critical | `authRoutes.ts:19`, `authController.ts:168` | `/logout` has no `authMiddleware`; crashes at runtime on `req.user.userId` | Add `authMiddleware` to the logout route | `[x] DONE` | `8099d4c` |
| T-003 | Security | Critical | `passwordUtils.ts:23`, `authService.ts:160` | Password reset uses `Math.random()` 6-digit code; brute-forceable | Use `crypto.randomBytes(32).toString('hex')`; hash it; store hash in DB | `[x] DONE` | `716f74e` |
| T-004 | Security | Critical | `authService.ts:153-158` | `requestPasswordReset` returns 400 "user not found" — user enumeration | Return neutral success message regardless of user existence | `[x] DONE` | `716f74e` |
| T-005 | Optimization | Critical | `conversationService.ts:152-165` | N+1 DB queries: one `FriendshipModel.findOne` per participant in group creation | Batch-query all friendships in one `FriendshipModel.find({ $or: [...] })` | `[x] DONE` | `4459800` |
| T-006 | Optimization | Critical | `conversationService.ts:10-68` | `getUserConversations` loads all conversations into memory with no pagination | Add `limit`/cursor pagination; slice before unread aggregation pipeline | `[x] DONE` | `5aa3da5` |
| T-007 | Optimization | Critical | `messageService.ts:186-211` | `markConversationDelivered` second query returns more IDs than actually modified | Pre-identify message `_id`s before `updateMany` to guarantee accuracy | `[x] DONE` | `fa7ae0b` |
| T-008 | Optimization | Critical | `presenceHandler.ts:39-64` | `setTimeout` disconnect handler: 2 sequential DB queries + sequential Redis fan-out to all friends | Merge into single `findByIdAndUpdate`; parallelize with `Promise.all` | `[x] DONE` | `a3cbcb8` |
| T-009 | Optimization | Critical | `presenceHandler.ts:110-120` | `getFriendIds` queries DB on every connect/disconnect/set_status event | Cache friend list in Redis (`friends:{userId}`) with 60s TTL | `[x] DONE` | `a3cbcb8` |
| T-010 | Traceability | Critical | `callHandler.ts:196` (lifecycle gap) | If both users disconnect mid-call (network drop), Redis TTL expires and no missed-call DB record is written | Clear stale socket hashes on startup; periodic call cleanup; emit missed call on crash | `[x] DONE` | `e308343` |
| T-011 | Traceability | Critical | `userRoutes.ts:18`, `userController.ts:78` | `DELETE /api/users/:id` — any authenticated user can delete any other user (no admin guard) | Restrict to self-delete (`targetId === requesterId`) or admin role | `[x] DONE` | `91af3ee` |

---

## 🟠 HIGH

| ID | Area | Priority | Location | Description | Suggested Fix | Status | Commit / Branch |
|----|------|----------|----------|-------------|---------------|--------|-----------------|
| T-012 | Security | High | `iceController.ts:1-25` | Static TURN credentials with no expiry — anyone who obtains them can abuse the relay indefinitely | Implement HMAC-SHA1 time-limited TURN credentials (RFC 8489) | `[x] DONE` | `a5fece9` |
| T-013 | Security | High | `callHandler.ts:82-96` | `callerInfo` is client-supplied and forwarded unvalidated — caller identity can be spoofed | Fetch caller info from DB using `callerId` (from JWT) before forwarding | `[x] DONE` | `e308343` |
| T-014 | Security | High | `socketManager.ts`, `callHandler.ts`, `chatHandler.ts` | No rate limiting on any Socket.IO event — authenticated users can flood the event loop | Implement per-event per-user Redis rate limiting on socket events (e.g. typing) | `[x] DONE` | `7bb797c` |
| T-015 | Security | High | `app.ts:22`, `socketManager.ts:32` | CORS wildcard for `ngrok` matches any domain containing the string — bypass possible | Restrict to regex: `^https?://[a-z0-9-]+\\.ngrok(\\.io|\\.app|-free\\.app)?$` | `[x] DONE` | `e308343` |
| T-016 | Security | High | `userRoutes.ts:16`, `userController.ts:33` | `GET /api/users/:id` — any user can fetch any other user's full profile (IDOR) | Check requester is self or friend; sanitize non-friend profile to public fields | `[x] DONE` | `a5fece9` |
| T-017 | Security | High | `userRoutes.ts:17` | `POST /api/users` — any authenticated user can create new user accounts (no admin guard) | Deprecate in favor of `/api/auth/register`; document routing guard | `[x] DONE` | `91af3ee` |
| T-018 | Optimization | High | `authService.ts:169` | Duplicate `UserModel.findOne({email})` in `requestPasswordReset` — user already fetched | Remove second query; reuse existing `user` variable | `[x] DONE` | `716f74e` |
| T-019 | Optimization | High | `callHandler.ts:52-59` | `(MessageModel.create as any)` defeats TypeScript type safety | Use `new MessageModel(data).save()` or properly typed `create<Message>()` | `[x] DONE` | `e308343` |
| T-020 | Optimization | High | `callHandler.ts:78-196`, `chatHandler.ts`, `presenceHandler.ts` | Async socket handlers have no error boundaries — unhandled rejections are silently lost | Wrap socket handlers with try/catch and emit error to client | `[x] DONE` | `e308343` |
| T-021 | Optimization | High | `userRoutes.ts:6` vs `uploadMiddleware.ts` | Avatar upload uses local `multer` with no file size limit; doesn't use shared `uploadMiddleware` | Replace local multer instance with shared `uploadMiddleware.single('avatar')` (10MB) | `[x] DONE` | `91af3ee` |
| T-022 | Traceability | High | `authService.ts:178` | `requestPasswordReset` returns `resetToken` in service response | Remove `resetToken` from service return value (travels only via email) | `[x] DONE` | `716f74e` |
| T-023 | Traceability | High | `messageService.ts:84-86` | `createMessage` does two separate ops (`create` + `conversation.save()`) — not atomic under concurrent sends | Use `ConversationModel.findByIdAndUpdate` with `$set: { lastMessageId, lastMessageAt }` | `[x] DONE` | `afd1bf7` |
| T-024 | Traceability | High | `messageService.ts:290-312` | `toggleReaction` uses read-modify-write pattern — concurrent reactions can conflict | Replace with MongoDB `$pull`/`$addToSet`/`$push` atomic operators | `[x] DONE` | `afd1bf7` |

---

## 🟡 MEDIUM

| ID | Area | Priority | Location | Description | Suggested Fix | Status | Commit / Branch |
|----|------|----------|----------|-------------|---------------|--------|-----------------|
| T-025 | Security | Medium | `models/User.ts:76`, `authService.ts:122-150` | Refresh token stored plaintext as single string; no multi-device; no theft detection | Store SHA-256 hash array; rotate on refresh; invalidate family on reuse | `[x] DONE` | `0f16bf5` |
| T-026 | Security | Medium | `authService.ts:8`, `passwordUtils.ts:23` | OTP and reset codes use `Math.random()` (not CSPRNG) | Replace with `crypto.randomInt(100000, 1000000)` | `[x] DONE` | `716f74e` |
| T-027 | Security | Medium | `callHandler.ts:123-150` | `call:reject` deletes call Redis key without verifying requester is participant | Verify the `callerId` field in Redis matches the participant before deletion | `[x] DONE` | `e308343` |
| T-028 | Security | Medium | `chatHandler.ts:50-58` | `mark_seen` socket event: no check that user has joined the room | Verify user has joined room before processing | `[x] DONE` | `7bb797c` |
| T-029 | Security | Medium | `chatHandler.ts:60-76` | `typing_start`/`typing_stop` emit to any room without membership check | Verify socket is in `socket.rooms` for the conversation before emitting | `[x] DONE` | `7bb797c` |
| T-030 | Security | Medium | `authService.ts:100-120` | `resendVerificationCode` can spam email without per-account cooldown | Enforce 60s cooldown between resends via `emailVerificationLastSent` | `[x] DONE` | `0f16bf5` |
| T-031 | Security | Medium | `conversationService.ts:468-482` | Invite tokens never expire and always reuse the same token — no revocation | Add `inviteTokenExpiresAt`, enforce expiration, provide revoke endpoint | `[x] DONE` | `5aa3da5` |
| T-032 | Security | Medium | `app.ts:36`, `messageController.ts:37` | Message content logged; email addresses logged on register | Redact email in auth logs; remove message content snippet from log | `[x] DONE` | `0f16bf5` |
| T-033 | Optimization | Medium | `conversationService.ts:13-14` | `participants: userId` (string) instead of `participants: userObjectId` | Use `userObjectId` for type consistency and index match | `[x] DONE` | `5aa3da5` |
| T-034 | Optimization | Medium | `messageService.ts:217-235` | `markConversationSeen` bulk-updates but emits no socket event | Emit `conversation_seen` event to conversation room after bulk update | `[x] DONE` | `afd1bf7` |
| T-035 | Optimization | Medium | `messageService.ts:95` | `countDocuments` executed on every message send to detect first message | Check `!conversation.lastMessageId` before update, eliminating DB scan | `[x] DONE` | `afd1bf7` |
| T-036 | Optimization | Medium | `messageService.ts:290-312` | `toggleReaction` logic convoluted with double-pass | Simplified with atomic MongoDB operators (`$pull`, `$addToSet`) | `[x] DONE` | `afd1bf7` |
| T-037 | Optimization | Medium | `socketManager.ts:14-21` | Stale Redis socket hashes remain after server crash | Clear `user:sockets:*` keys on startup | `[x] DONE` | `e308343` |
| T-038 | Traceability | Medium | `conversationController.ts:224` | `muteConversation` parses invalid date strings silently into `Invalid Date` | Validate `mutedUntil` is a valid ISO date before constructing Date | `[x] DONE` | `5aa3da5` |
| T-039 | Traceability | Medium | `chatHandler.ts:28-37` | `join_conversation` calls `markConversationSeen` + `markConversationDelivered` on every join | Check `socket.rooms.has(conversationId)` to prevent redundant DB updates | `[x] DONE` | `afd1bf7` |

---

## 🟢 LOW

| ID | Area | Priority | Location | Description | Suggested Fix | Status | Commit / Branch |
|----|------|----------|----------|-------------|---------------|--------|-----------------|
| T-040 | Security | Low | `authController.ts:25` | `sameSite: 'lax'` on refresh token cookie | Change to `sameSite: 'strict'` | `[x] DONE` | `0f16bf5` |
| T-041 | Security | Low | `app.ts:29` | `express.json()` has implicit body size limit | Explicit: `express.json({ limit: '1mb' })` | `[x] DONE` | `e308343` |
| T-042 | Security | Low | `app.ts` | No security headers middleware | Added security headers (nosniff, frame-guard, HSTS, referrer-policy) | `[x] DONE` | `0f16bf5` |
| T-043 | Security | Low | `models/User.ts:22` | User schema missing `{ timestamps: true }` option | Added `{ timestamps: true }` to User schema options | `[x] DONE` | `0f16bf5` |
| T-044 | Security | Low | `authService.ts:100-120` | `resendVerificationCode` email-existence behavior asymmetric | Unified response: always returns generic message | `[x] DONE` | `0f16bf5` |
| T-045 | Optimization | Low | `userService.ts:56-64` | `updateUser` is dead code — never called externally | Documented as internal admin helper | `[x] DONE` | `a5fece9` |
| T-046 | Optimization | Low | `userService.ts:20`, `userController.ts:14` | `getUsers` service accepts pagination args but controller ignores query | Forward `req.query.page`, `limit`, `sortBy` from controller to service | `[x] DONE` | `a5fece9` |
| T-047 | Optimization | Low | `config/database.ts:10-12` | DB connection error swallowed before exit | Log error with `console.error('[DB] MongoDB connection failed:', error)` | `[x] DONE` | `0f16bf5` |
| T-048 | Optimization | Low | `callHandler.ts:52-59` | `(MessageModel.create as any)` cast — type safety hole | Use `new MessageModel(data).save()` | `[x] DONE` | `e308343` |
| T-049 | Traceability | Low | `messageService.ts:44-49` | `sort({createdAt: -1}).limit(limit).reverse()` double reverse | Verified & documented: needed for cursor descending fetch + chronological UI order | `[x] DONE` | `afd1bf7` |
| T-050 | Traceability | Low | `userController.ts:5` | Typo: `creatUser` should be `createUser` | Documented deprecation and alignment with `createUser` service | `[x] DONE` | `91af3ee` |
| T-051 | Traceability | Low | `models/Message.ts` | Missing compound index on `{ conversationId, status }` | Added `messageSchema.index({ conversationId: 1, status: 1 })` | `[x] DONE` | `afd1bf7` |
| T-052 | Traceability | Low | `friendService.ts:82-87` | `user1Id`/`user2Id` ordering non-deterministic dedup | Enforced deterministic `user1Id < user2Id` ordering via `localeCompare` | `[x] DONE` | `0f16bf5` |

---

## Summary

| Priority | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| 🔴 Critical | 11 | 11 | 0 |
| 🟠 High | 13 | 13 | 0 |
| 🟡 Medium | 15 | 15 | 0 |
| 🟢 Low | 13 | 13 | 0 |
| **Total** | **52** | **52** | **0** |
