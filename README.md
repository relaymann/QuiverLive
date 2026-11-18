# QuiverLive

QuiverLive is a general-purpose livestreaming platform for creators and communities. Viewers can discover channels, follow creators, watch live broadcasts, and participate in real-time chat. Creators can broadcast directly from a supported browser or connect streaming software such as OBS.

## Product principles

- Browser broadcasting is a first-class path: camera, microphone, and screen sharing without requiring OBS.
- OBS and other compatible encoders remain supported through LiveKit RTMP/WHIP ingress.
- Stream quality, reliability, accessibility, and efficient resource use are core requirements.
- The interface is designed for modern desktop and mobile browsers, including lower-powered devices.
- Development stays on `development`; `master` remains the stable branch until an explicit release decision.

## Current stack

- Next.js 15.5 and React 18
- Clerk authentication
- Prisma with MySQL
- LiveKit for real-time audio/video, RTMP/WHIP ingress, and server-relayed chat
- UploadThing for stream thumbnails

## Broadcasting

### Browser broadcasting

Creators can go live directly from the creator dashboard using a camera and microphone or by sharing their screen. The browser flow supports selectable 360p, 540p, and 720p capture, plus 15, 24, or 30 FPS camera capture. Screen sharing is capped at 15 FPS by default to reduce CPU and bandwidth use. Browser support and available capture controls depend on the device and browser.

### OBS and encoder support

Creators can configure an RTMP or WHIP ingest endpoint from the channel's **Keys & URLs** page and connect OBS or another compatible encoder. RTMP uses LiveKit ingress transcoding presets; WHIP uses bypass transcoding. Keep stream keys private and regenerate them if they are exposed.

Browser and encoder broadcasting are intended to be mutually exclusive for a channel. The platform uses LiveKit adaptive streaming and dynacast for viewer delivery.

## Chat enforcement

Chat messages are relayed by the server. Viewer tokens do not grant data publishing, preventing browser clients from bypassing server checks by sending raw LiveKit packets.

The server checks chat-enabled status, follower-only access, blocks in both directions, and a 300-character message limit. Database-backed per-user/per-channel rate limits enforce three seconds between messages in slow mode and a one-second baseline anti-spam interval. Chat is realtime only; message history is not yet persisted.

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
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local` and configure credentials privately.
4. Run `npx prisma generate`.
5. Apply the schema to MySQL with `npx prisma db push` for development, or use reviewed migrations for production.
6. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
7. Start with `npm run dev`.

## Required environment variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `DATABASE_URL`
- `LIVEKIT_API_URL` (server-side HTTPS API URL)
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_WS_URL` (browser-facing WSS URL)
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`

LiveKit's server API URL and browser WebSocket URL are different values. Never expose API secrets, webhook secrets, database credentials, or stream keys in client-side code or public repositories.

## Deployment

Vercel is the intended web host; LiveKit remains the separate media infrastructure. Do not deploy production until external-service and device checks pass. Configure Clerk and LiveKit webhooks at `/api/webhooks/clerk` and `/api/webhooks/livekit` on the deployed domain. Use a managed MySQL database with serverless-appropriate connection pooling.

## Verification still required

CI cannot replace tests against real accounts, media services, devices, and networks:

- [ ] Verify Clerk sign-in, sign-out, account provisioning, and deletion webhooks.
- [ ] Test camera, microphone, screen share, and supported screen-share audio in current desktop and mobile browsers.
- [ ] Test OBS RTMP and WHIP ingest, browser/encoder source handoff, and duplicate-source prevention.
- [ ] Test permission denial, capture cancellation, track-ended, navigation cleanup, tab close, Wi-Fi interruption, reconnect, and shutdown.
- [ ] Verify viewer playback, adaptive quality, audio controls, fullscreen, and LiveKit webhook event ordering.
- [ ] Test slow mode, baseline rate limiting, follower-only chat, disabled chat, blocks, and direct data-publish denial across multiple accounts.
- [ ] Apply the Prisma schema update containing `ChatRateLimit` before deploying the server-relayed chat path.
- [ ] Measure CPU, memory, bandwidth, startup time, and playback quality on lower-powered phones and desktops.
- [ ] Validate TURN/TLS connectivity on restrictive networks.
- [ ] Confirm upstream starter licensing and distribution rights before public operation.

Development work remains on `development`. `master` is not modified and no Vercel deployment is performed automatically.
