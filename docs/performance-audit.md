# Performance and reliability audit

## Scope
This pass is focused on reducing avoidable database round trips, improving hot query indexes, reducing repeated React work in the live chat, and making browser broadcast cleanup more resilient. It does not add product features or change deployment configuration.

## Changes in this pass
- Added a composite `Stream(isLive, updatedAt)` index for the discovery feed's ordering.
- Added composite `WatchSession(streamId, broadcastSessionId, endedAt)` and `WatchSession(streamId, participantSid, endedAt)` indexes for broadcast-end and participant-leave cleanup paths.
- Removed the preliminary block-list query from the following sidebar lookup by expressing both block exclusions as relation filters in the follow query.
- Collapsed the follow-status lookup from separate user, block, and follow reads into a single relational follow lookup.
- Run independent channel follow/block checks concurrently on the channel page.
- Memoized individual chat messages so an incoming message does not force unchanged message rows to re-render.
- Simplified browser broadcast shutdown: disconnect the LiveKit room once instead of issuing an unawaited unpublish request for every track before disconnecting. Capture tracks are still stopped even if room disconnect reports an error.

## Audit observations
- The discovery page intentionally loads a bounded set of 40 channels. It is not cursor-paginated yet; do not increase this limit as a substitute for pagination.
- Chat keeps at most 100 messages in client memory and does not persist chat history. Per-message memoization reduces repeat row rendering, but high-volume chat should still be profiled on low-powered phones.
- LiveKit participant and track hooks cause UI updates when room membership or publications change. They do not run at video frame frequency, but high participant churn should be profiled with a real room.
- Browser camera/screen capture, encoding, network transport, and playback consume resources outside the Next.js server. Resolution and frame-rate choices remain the primary user-controlled CPU/bandwidth tradeoff. LiveKit adaptiveStream and dynacast remain enabled.
- Prisma uses MySQL `relationMode = "prisma"`; query plans must be checked against the actual MySQL version and production data volume. Schema indexes are not live until a reviewed database migration/schema update is applied.
- LiveKit webhook delivery, room-service latency, participant churn, TURN relay use, and browser hardware acceleration cannot be validated by static repository inspection or GitHub CI.

## Required verification
1. Prisma schema validation.
2. ESLint and TypeScript checks.
3. Production build.
4. Production and full dependency vulnerability gates.
5. Review all changed code paths for authorization and lifecycle regressions.
6. Review schema query indexes and the exact generated migration before applying to a database.
7. Measure page/server response time, DB query count/latency, chat render cost, browser CPU/memory, stream startup time, dropped frames, and bandwidth on representative desktop and lower-powered Android devices.
8. Exercise camera/microphone, screen share, OBS RTMP, WHIP, reconnect, disconnect, stop, and source-conflict flows against the configured LiveKit project.

## Not claimed as verified
No production database migration was applied. No Vercel deployment was made. No real-device profiling, load test, or LiveKit integration test was run in this pass. CI success verifies static checks and build compatibility, not end-to-end streaming performance or production behavior.
