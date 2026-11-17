# SchoolStream production audit

## Implemented in the current development pass

### Framework and authentication
- Replaced unsupported Next.js 14.0.4 with patched Next.js 15.5.29.
- Updated Clerk to 7.10.0 and moved server-side Clerk helpers to the server entry point.
- Replaced removed legacy authMiddleware usage with clerkMiddleware.
- Moved ClerkProvider inside the document body.
- Updated App Router params and searchParams access to the asynchronous Next.js 15 contract.
- Changed Clerk webhook header access to the Request headers object.

### Chat security
- Viewer and broadcaster tokens no longer grant client data publishing.
- Chat is submitted through a server action and relayed with the LiveKit Room Service API.
- Server checks authenticated user, stream chat state, follower-only access, bidirectional blocks, and message length.
- Slow mode and baseline anti-spam use an atomic MySQL update against a per-user/per-stream rate-limit row.
- Chat client now receives server-relayed messages and ignores unrelated data packets.

### Stream delivery and device performance
- Added broadcaster resolution and camera frame-rate controls.
- Capped screen share at 15 FPS by default.
- Enabled LiveKit adaptive stream and dynacast.
- Added screen-share track subscription and attachment to the viewer player.
- Added retry/error UI when viewer token creation fails instead of leaving a permanent loading skeleton.

### Baseline hardening and CI
- Added baseline security response headers.
- CI now runs Prisma validation, npm audit, ESLint, TypeScript, and a production build.
- Added lockfile regeneration automation after dependency changes.

## Important deployment migration

The Prisma schema now contains ChatRateLimit. Apply the schema to the target MySQL database before deploying this branch. For an early-stage database, use the existing db push workflow. For production, create and review a proper migration rather than relying on automatic schema changes.

## Remaining verification gates

The following cannot be truthfully marked complete without the real external services and hardware:
- Full build and CI result for this exact commit.
- Real Clerk sign-in, sign-out, provisioning, and deletion webhooks.
- Real MySQL concurrency test for simultaneous chat messages and rate-limit behavior.
- LiveKit server sendData compatibility against the configured LiveKit service and installed server SDK.
- Browser/Chromebook camera, microphone, screen-share audio, and codec compatibility.
- Browser and RTMP/WHIP source handoff, reconnect, track-ended, and webhook event ordering.
- Vercel Preview deployment and serverless database connection behavior.

## Known product limitations
- Chat messages are not persisted as channel history.
- The chat UI has no moderator timeout/ban command or word-filter system yet; current moderation enforcement covers channel chat settings, follows, blocks, message length, and rate limits.
- Guests can watch but cannot send chat because chat requires a provisioned SchoolStream account.
- School network policies can block WebRTC, camera, microphone, or display capture. LiveKit TURN/TLS configuration and testing are required for restrictive networks.
- The upstream starter's license was not present in its root when audited. Resolve rights before public distribution or commercial operation.

## Branch and deployment safety
- All work is on development.
- master remains untouched.
- No production deployment or Vercel project configuration was performed.
