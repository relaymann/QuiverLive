# QuiverLive engineering and production audit

## Product direction

QuiverLive is a general-purpose livestreaming platform for creators and communities. Browser camera/microphone and screen-share broadcasting are first-class. OBS and other encoders remain supported through LiveKit RTMP/WHIP ingress. The product targets modern desktop and mobile browsers, with lower-powered devices included in performance decisions.

## Implemented foundations

### Framework and authentication
- Next.js 15.5.29, React 18.3.1, and Clerk 7.10.0.
- Server-side Clerk helpers and webhook signature verification.
- App Router async params and server/client boundaries updated for Next.js 15.

### Chat security
- Viewer and broadcaster tokens do not grant client data publishing.
- Chat is submitted through a server action and relayed with LiveKit Room Service.
- Server checks authenticated user, stream chat state, follower-only access, bidirectional blocks, message length, and rate limits.
- Slow mode and baseline anti-spam use an atomic MySQL update against a per-user/per-stream row.
- Chat is realtime only; history is not persisted. The client caps its in-memory display to 100 messages.

### Stream delivery
- Browser camera, microphone, and screen-share capture.
- Browser capture choices include 360p, 540p, and 720p; camera frame-rate choices include 15, 24, and 30 FPS.
- Screen capture defaults to a maximum of 15 FPS.
- LiveKit adaptive stream and dynacast are enabled for viewers and browser broadcasters.
- RTMP and WHIP ingress creation is supported for OBS and compatible encoders.
- Browser capture tracks are stopped on track-ended, disconnect, explicit stop, and component unmount.
- The browser broadcast now checks channel availability before prompting for capture permissions and rechecks before connecting.
- Encoder ingress creation rejects a channel already marked live to reduce browser/encoder source collisions.

### Performance and interface
- Removed school- and Chromebook-specific product copy.
- Added a responsive discovery introduction and clearer live-channel listing.
- Removed the extra Poppins font download from the browse logo.
- Stream thumbnails now declare responsive image sizes and use a reduced image quality target.
- Sidebar recommendations and following queries run concurrently.
- Capture defaults remain conservative; higher resolution/FPS are explicit creator choices.

### CI and dependency hygiene
- CI uses `npm ci` against the committed lockfile.
- CI checks Prisma schema validity, ESLint, TypeScript, production build, production high-severity audit, and all-dependency critical-severity audit.
- The full development dependency audit still has known advisories in the Tailwind/ESLint toolchain; do not describe the entire dependency tree as clean. Avoid unsafe forced major-version downgrades.

## Important deployment migration

The Prisma schema contains `ChatRateLimit`. Apply the schema to the target MySQL database before deploying the server-relayed chat path. For production, create and review a proper migration rather than relying on automatic schema changes.

## Remaining checks requiring external services or real devices

These cannot be marked complete by repository inspection or CI alone:
- Full build and CI result for the exact latest commit.
- Clerk sign-in, sign-out, provisioning, deletion, and webhook delivery.
- MySQL concurrency tests for simultaneous chat messages and rate-limit behavior.
- LiveKit Room Service `sendData` compatibility with the configured project and installed SDK.
- Real camera, microphone, screen-share video/audio, codec, and browser compatibility tests.
- Browser/RTMP/WHIP handoff, duplicate-source races, reconnects, and webhook event ordering.
- Viewer playback and audio/fullscreen controls on current desktop and mobile browsers.
- TURN/TLS connectivity on restrictive networks.
- CPU, memory, bandwidth, startup time, and playback measurements on lower-powered devices.
- Vercel Preview deployment and serverless database connection behavior.

## Known product limitations
- Chat history is not persisted.
- Chat moderation does not yet include moderator timeout/ban commands or word filters.
- Guests can watch but cannot send chat; chat requires a provisioned account.
- Live state is synchronized through LiveKit webhooks. Browser/encoder mutual exclusion can still be affected by webhook delivery delay or event ordering and needs real integration testing.
- Stream discovery is currently bounded to a fixed result set rather than cursor-paginated.
- The upstream starter did not include a root LICENSE when checked. Confirm rights before public distribution or commercial operation.

## Branch and deployment safety
- Development work stays on `development`.
- `master` remains untouched unless explicitly authorized.
- No Vercel deployment is performed automatically.
- Keep LiveKit API secrets, Clerk secrets, webhook secrets, database credentials, and stream keys private.

## Previous dependency audit snapshot (2026-11-17)

The last recorded complete CI run passed Prisma validation, ESLint, TypeScript, production build, the production dependency audit at high severity, and the all-dependency critical-severity gate. The complete development dependency audit still reported 21 advisories (3 moderate, 18 high), concentrated in Picomatch and related Tailwind/ESLint tooling. Treat this as a historical snapshot and rerun audits for the current lockfile before release.
