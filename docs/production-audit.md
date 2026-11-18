# QuiverLive engineering and production audit

## Product direction
QuiverLive is a general-purpose livestreaming platform for creators and communities. Browser camera/microphone and screen-share broadcasting are first-class. OBS and other encoders remain supported through LiveKit RTMP/WHIP ingress. The product targets modern desktop and mobile browsers, with lower-powered devices included in performance decisions.

## Implemented foundations

### Framework and authentication
- Next.js 15.5.29, React 18.3.1, and Clerk 7.10.0.
- Server-side Clerk helpers and webhook signature verification.
- App Router async params and server/client boundaries updated for Next.js 15.
- Anonymous viewer sessions use a signed, HTTP-only, SameSite=Lax cookie; the LiveKit viewer token identity is taken from its signed subject claim.

### Chat security and moderation
- Viewer and broadcaster tokens do not grant client data publishing.
- Chat is submitted through a server action and relayed with LiveKit Room Service.
- Registered users and signed guest sessions can chat. Guest chat rate limits are stored separately from registered-user rate limits.
- Server checks chat-enabled status, follower-only access, bidirectional blocks, bans, timeout expiry, message length, and rate limits.
- Slow mode enforces three seconds between messages; the baseline anti-spam interval is one second.
- Channel owners can timeout connected viewers for five minutes or ban registered accounts. The server persists moderation records, removes the current participant, and checks bans before issuing another viewer token.
- Guest identities can be timed out but cannot receive durable account bans. Bans can be removed from the channel Chat settings page.
- Chat is realtime only; message history is not persisted. The client caps its in-memory display to 100 messages.

### Stream delivery and source exclusivity
- Browser camera, microphone, and screen-share capture.
- Browser capture choices include 360p, 540p, and 720p; camera frame-rate choices include 15, 24, and 30 FPS.
- Screen capture defaults to a maximum of 15 FPS.
- LiveKit adaptive stream and dynacast are enabled for viewers and browser broadcasters.
- RTMP and WHIP ingress creation is supported for OBS and compatible encoders.
- Browser and ingress publishers use distinct identities (browser-userId and ingress-userId); viewer identities are separate.
- MySQL conditional updates reserve one broadcast source at a time. A short-lived lease protects startup, and the active source is retained until its matching participant/ingress ends.
- Browser start invalidates any idle ingress configuration, preventing stale OBS keys from publishing into a browser-owned room.
- Browser capture tracks are stopped on track-ended, disconnect, explicit stop, and component unmount.
- Browser capture occurs before taking the source reservation, so declining camera/screen permissions does not invalidate an existing OBS configuration.
- Live/offline webhook updates are matched to the correct source identity and source state to reduce stale event races.

### Performance and interface
- Removed school- and Chromebook-specific product copy.
- Added a responsive discovery introduction and clearer live-channel listing.
- Removed the extra Poppins font download from the browse logo.
- Stream thumbnails now declare responsive image sizes and use a reduced image quality target.
- Sidebar recommendations and following queries run concurrently.
- Capture defaults remain conservative; higher resolution/FPS are explicit creator choices.

### CI and dependency hygiene
- CI uses npm ci against the committed lockfile.
- CI checks Prisma schema validity, ESLint, TypeScript, production build, production high-severity audit, and all-dependency critical-severity audit.
- The full development dependency audit still has known advisories in the Tailwind/ESLint toolchain; do not describe the entire dependency tree as clean. Avoid unsafe forced major-version downgrades.

## Database changes required before deployment
The current Prisma schema adds:
- GuestChatRateLimit for signed guest chat throttling.
- ChatModeration for channel bans and timeouts.
- WatchSession for channel-specific viewer session history and accumulated watch time.
- Stream.broadcastSource, broadcastSessionId, and broadcastLeaseExpiresAt for atomic source reservation.

Apply and review these schema changes against the actual MySQL database before deploying. npx prisma db push is suitable for local development; production should use a reviewed, versioned migration and a database backup. This repository does not yet contain a generated production migration for these new fields/tables.

## Streaming integration audit matrix
| Scenario | Code-level protection | Requires LiveKit/device test |
|---|---|---|
| Browser camera/microphone | Capture cleanup, short-lived publisher token, source reservation | Yes |
| Browser screen share/audio | Separate capture tracks and viewer audio elements | Yes |
| RTMP ingress | Server-created ingress, source reservation, webhook matching | Yes |
| WHIP ingress | Server-created WHIP ingress, source reservation, webhook matching | Yes |
| Browser vs OBS collision | Conditional database reservation and distinct publisher identities | Yes |
| Stop and disconnect | Browser removes publisher and releases source state; webhook fallback | Yes |
| Reconnect | Browser status tracks reconnect/reconnected/disconnected | Yes |
| Stale webhook event | Event must match current source identity and source type | Yes |
| Banned viewer reconnect | Ban checked before viewer token issuance | Yes |
| Timeout | Current participant removed; chat denied until expiry; viewing remains allowed | Yes |
| Guest chat | Signed HTTP-only guest identity and separate DB rate limit | Yes |
| Watch time | Participant-SID keyed viewer sessions from LiveKit join/leave webhooks | Yes |
| Followage | Existing Follow.createdAt timestamp queried per channel | Yes |

## Remaining checks requiring external services or real devices
These cannot be marked complete by repository inspection or CI alone:
- Full build and CI result for the exact latest commit.
- Apply schema changes to a real MySQL database and test migrations/rollback.
- Clerk sign-in, sign-out, provisioning, deletion, and webhook delivery.
- Guest cookie persistence, expiry, and guest-to-account transition.
- MySQL concurrency tests for simultaneous chat messages and source reservations.
- LiveKit Room Service sendData, participant removal, and token revocation compatibility with the configured project and installed SDK.
- Real camera, microphone, screen-share video/audio, codec, and browser compatibility tests.
- Browser/RTMP/WHIP handoff, duplicate-source races, reconnects, and webhook event ordering.
- Timeout, ban, unban, blocked-user, and rejoin behavior across multiple accounts.
- Watch-time webhook delivery, duplicate/reordered events, reconnect accounting, guest tracking, and followage results.
- Viewer playback and audio/fullscreen controls on current desktop and mobile browsers.
- TURN/TLS connectivity on restrictive networks.
- CPU, memory, bandwidth, startup time, and playback measurements on lower-powered devices.
- Vercel Preview deployment and serverless database connection behavior.

## Known product limitations
- Chat history is not persisted.
- Watch time begins accumulating when the LiveKit participant-joined webhook is processed; delayed/missed webhook delivery can affect totals and must be validated against the configured LiveKit project.
- Moderator roles beyond the channel owner are not implemented.
- Timeouts are currently fixed at five minutes.
- Guests can be timed out but cannot receive persistent bans.
- Word filters, banned phrases, link filtering, and slow-mode duration controls are not implemented.
- Stream discovery is currently bounded to a fixed result set rather than cursor-paginated.
- The upstream starter did not include a root LICENSE when checked. Confirm rights before public distribution or commercial operation.

## Branch and deployment safety
- Development work stays on development.
- master remains untouched unless explicitly authorized.
- No Vercel deployment is performed automatically.
- Keep LiveKit API secrets, Clerk secrets, webhook secrets, database credentials, and stream keys private.

## Previous dependency audit snapshot (2026-11-17)
The last recorded complete CI run passed Prisma validation, ESLint, TypeScript, production build, the production dependency audit at high severity, and the all-dependency critical-severity gate. The complete development dependency audit still reported 21 advisories (3 moderate, 18 high), concentrated in Picomatch and related Tailwind/ESLint tooling. Treat this as a historical snapshot and rerun audits for the current lockfile before release.
