# QuiverLive

QuiverLive is a general-purpose livestreaming platform for creators and communities. Viewers can discover channels, follow creators, watch live broadcasts, and participate in real-time chat. Creators can broadcast directly from a supported browser or connect streaming software such as OBS.

## Product principles
- Browser broadcasting is a first-class path: camera, microphone, and screen sharing without requiring OBS.
- OBS and other compatible encoders remain supported through LiveKit RTMP/WHIP ingress.
- Stream quality, reliability, accessibility, and efficient resource use are core requirements.
- The interface targets modern desktop and mobile browsers, including lower-powered devices.
- Development stays on development; master remains stable until an explicit release decision.

## Current stack
- Next.js 15.5 and React 18
- Clerk authentication
- Prisma with MySQL
- LiveKit for real-time audio/video, RTMP/WHIP ingress, and server-relayed chat
- UploadThing for stream thumbnails

## Broadcasting

### Browser broadcasting
Creators can go live directly from the creator dashboard using a camera and microphone or by sharing their screen. The browser flow supports selectable 360p, 540p, and 720p capture, plus 15, 24, or 30 FPS camera capture. Screen sharing is capped at 15 FPS by default to reduce CPU and bandwidth use. Browser support and available capture controls depend on the device and browser.

The browser flow reserves the channel before publishing, uses a short-lived publishing token, and cleans up the reservation and publisher on stop or unexpected disconnect. Browser publishers use a distinct LiveKit identity so webhook state changes cannot be confused with viewer joins.

### OBS and encoder support
Creators can configure an RTMP or WHIP ingest endpoint from the channel's Keys & URLs page and connect OBS or another compatible encoder. RTMP uses LiveKit ingress transcoding presets; WHIP uses bypass transcoding. Keep stream keys private and regenerate them if they are exposed.

Browser and encoder broadcasting are mutually exclusive per channel. The server atomically reserves a broadcast source in MySQL, and LiveKit webhook handlers update live/offline state only for the matching source identity and source type. Switching to browser broadcasting invalidates any previously configured idle ingress; create a new ingress from Keys & URLs when switching back to OBS/WHIP.

## Chat and moderation
Chat messages are relayed by the server. Viewer tokens do not grant client data publishing, preventing browser clients from bypassing server checks by sending raw LiveKit packets.

The server checks chat-enabled status, follower-only access, bidirectional blocks, channel bans, timeout expiry, message length, and per-channel rate limits. Slow mode enforces three seconds between messages; a one-second baseline anti-spam interval applies otherwise. Signed-in viewers and guests can chat. Guest sessions use a signed, HTTP-only cookie and are rate-limited independently.

Channel owners can timeout a connected viewer for five minutes or ban a registered account from the channel. Timeouts disconnect the current session and restrict chat while allowing the viewer to watch again. Persistent bans prevent the account from obtaining another channel viewer token. Guest viewers can be timed out, but persistent bans require an account. Owners can review and remove bans in Chat settings. Chat is realtime only; message history is not persisted. The `!watchtime` command reports a viewer's accumulated time in that channel, and `!followage` reports how long they have followed that channel. Channel owners can also create custom text-response commands in Chat settings, set database-enforced cooldowns, and remove commands. Names are case-insensitive; `watchtime` and `followage` are reserved. Watch time is recorded only during live broadcasts from LiveKit viewer join/leave events. Viewers already connected when a broadcast starts are picked up, and active sessions close when the broadcast ends. It is channel-specific and includes guest sessions.

## Performance and accessibility
- Keep client-side JavaScript and dependencies lean.
- Load media only when needed; avoid eager playback of off-screen streams.
- Use responsive layouts and appropriately sized images.
- Keep capture defaults conservative and let creators opt into higher quality.
- Clean up media tracks and LiveKit rooms on stop, disconnect, and navigation.
- Respect reduced-motion preferences and provide keyboard-accessible controls.
- Measure real device and network behavior; do not claim zero latency or universal compatibility.

## Local development
1. Install Node.js 22 LTS and npm.
2. Run npm ci.
3. Copy .env.example to .env.local and configure credentials privately.
4. Run npx prisma generate.
5. Apply the schema to MySQL with npx prisma db push for development, or use reviewed migrations for production.
6. Run npm run typecheck, npm run lint, and npm run build.
7. Start with npm run dev.

## Required environment variables
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_WEBHOOK_SECRET
- DATABASE_URL
- LIVEKIT_API_URL (server-side HTTPS API URL)
- LIVEKIT_API_KEY
- LIVEKIT_API_SECRET
- NEXT_PUBLIC_LIVEKIT_WS_URL (browser-facing WSS URL)
- UPLOADTHING_SECRET
- UPLOADTHING_APP_ID

LiveKit's server API URL and browser WebSocket URL are different values. Never expose API secrets, webhook secrets, database credentials, or stream keys in client-side code or public repositories.

## Deployment
Vercel is the intended web host; LiveKit remains the separate media infrastructure. Do not deploy production until external-service and device checks pass. Configure Clerk and LiveKit webhooks at /api/webhooks/clerk and /api/webhooks/livekit on the deployed domain. Use a managed MySQL database with serverless-appropriate connection pooling.

## Verification still required
CI cannot replace tests against real accounts, media services, devices, and networks:
- [ ] Apply and review the Prisma schema changes for guest chat rate limits, channel moderation, broadcast reservations, and viewer watch sessions before deploying.
- [ ] Verify Clerk sign-in, sign-out, account provisioning, and deletion webhooks.
- [ ] Test camera, microphone, screen share, and supported screen-share audio in current desktop and mobile browsers.
- [ ] Test OBS RTMP and WHIP ingest, browser/encoder source handoff, and duplicate-source prevention.
- [ ] Test permission denial, capture cancellation, track-ended, navigation cleanup, tab close, Wi-Fi interruption, reconnect, and shutdown.
- [ ] Verify viewer playback, adaptive quality, audio controls, fullscreen, and LiveKit webhook event ordering.
- [ ] Test guest and registered chat, slow mode, baseline rate limiting, follower-only chat, disabled chat, timeouts, bans, unbans, blocks, direct data-publish denial, `!watchtime`, and `!followage` across multiple accounts.
- [ ] Verify LiveKit participant removal and token revocation behavior with the configured project.
- [ ] Measure CPU, memory, bandwidth, startup time, and playback quality on lower-powered phones and desktops.
- [ ] Validate TURN/TLS connectivity on restrictive networks.
- [ ] Confirm upstream starter licensing and distribution rights before public operation.

Development work remains on development. master is not modified and no Vercel deployment is performed automatically.


## Full product scope

The complete creator, viewer, discovery, media, community, monetization, analytics, reliability, and accessibility scope is tracked in [docs/platform-scope.md](docs/platform-scope.md). New Prisma models are persistence foundations, not claims that provider-backed workflows or UI are already shipped. Production remains disabled until migrations, integrations, and release gates are verified.
