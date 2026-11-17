# SchoolStream

SchoolStream is a Twitch-style livestreaming platform focused on a lightweight, accessible experience for school Chromebooks.

## Upstream attribution

This project builds on the starter at [nayak-nirmalya/twitch-clone](https://github.com/nayak-nirmalya/twitch-clone), whose README credits [Antonio Erdeljac](https://github.com/AntonioErdeljac). SchoolStream is an independent fork and is being substantially modified.

The upstream repository did not contain a LICENSE file when checked. Confirm applicable permissions and licensing before distributing or operating a public derivative service.

## Current stack

- Next.js 15.5 Maintenance LTS and React 18
- Clerk 7 authentication
- Prisma with MySQL
- LiveKit for real-time audio/video and server-relayed chat
- UploadThing for stream thumbnails

## Broadcasting and Chromebook performance

- Browser camera and microphone broadcasting, plus RTMP/WHIP for OBS
- Browser screen sharing, including audio where supported by the browser
- Browser capture options: 360p, 540p, 720p; camera 15, 24, or 30 FPS
- Screen capture is capped at 15 FPS by default to reduce CPU and bandwidth
- LiveKit adaptive stream and dynacast are enabled for viewers
- Player supports camera and screen-share tracks

## Chat enforcement

Chat messages are relayed by the server. Viewer tokens do not grant data publishing, preventing browser clients from bypassing server checks by sending raw LiveKit packets.

The server checks chat-enabled status, follower-only access, blocks in both directions, and a 300-character message limit. Database-backed per-user/per-channel rate limits enforce three seconds between messages in slow mode and a one-second baseline anti-spam interval. The atomic database update works across multiple serverless instances.

Chat is realtime only. Message history is not yet persisted, and viewers joining after a message was sent do not receive that message.

## Local development

1. Install Node.js 22 LTS and npm.
2. Run npm install.
3. Copy .env.example to .env.local and configure the required credentials.
4. Run npx prisma generate.
5. Apply the schema to MySQL with npx prisma db push (or your established migration workflow). This creates the ChatRateLimit table required by server-enforced chat.
6. Run npm run typecheck, npm run lint, and npm run build.
7. Start with npm run dev.

## CI checks

GitHub Actions runs dependency installation, Prisma validation, npm audit, ESLint, TypeScript checks, and a production build. A lockfile workflow regenerates package-lock.json when package.json changes on development.

## Deploying to Vercel

Vercel is the intended web host. Do not deploy production until the runtime checks below pass.

1. Import relaymann/SchoolStream into Vercel.
2. Use development for preview deployments during development. Keep master stable until the release is ready.
3. Keep the Next.js framework preset and let Next.js manage the build output.
4. Configure the environment variables below separately for Preview and Production.
5. Configure Clerk's webhook at https://YOUR_DOMAIN/api/webhooks/clerk.
6. Configure LiveKit's webhook at https://YOUR_DOMAIN/api/webhooks/livekit.
7. Add the deployed domain to Clerk's allowed origins and redirect settings.

### Required environment variables

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_WEBHOOK_SECRET
- DATABASE_URL
- LIVEKIT_API_URL
- LIVEKIT_API_KEY
- LIVEKIT_API_SECRET
- NEXT_PUBLIC_LIVEKIT_WS_URL
- UPLOADTHING_SECRET
- UPLOADTHING_APP_ID

Use a managed MySQL database with serverless-appropriate connection pooling. LiveKit is a separate media service; Vercel does not provide media ingress or egress infrastructure. Never expose secret keys, webhook secrets, database credentials, or stream keys in client-side code.

## Runtime verification required before production

These tests require real Clerk, MySQL, LiveKit, UploadThing, and browser credentials/devices. CI cannot substitute for them.

- [ ] Create, sign in, and delete accounts; verify Clerk webhook provisioning and deletion.
- [ ] Verify public routes work signed out and dashboard pages/actions reject signed-out users.
- [ ] Test follow, unfollow, block, unblock, bio edits, and follower-only chat across two accounts.
- [ ] Test disabled chat, normal rate limiting, slow mode, and block enforcement. Attempt direct LiveKit data publishing and confirm it is denied.
- [ ] Broadcast camera, microphone, and screen share from a Chromebook; verify viewers receive video and supported audio.
- [ ] Test RTMP/WHIP and browser broadcast mutual exclusion in both directions.
- [ ] Test permission denial, screen-share cancellation, track-ended, navigation, tab close, Wi-Fi interruption, reconnect, and shutdown.
- [ ] Test 360p/540p/720p and camera 15/24/30 FPS on low-powered hardware; measure CPU, memory, and network usage.
- [ ] Verify LiveKit webhook delivery for ingress_started, ingress_ended, participant_joined, and participant_left.
- [ ] Apply the Prisma schema update before enabling the new chat path in any deployed environment.

Development work remains on the development branch. master is not modified by this work. No Vercel deployment is performed automatically.
