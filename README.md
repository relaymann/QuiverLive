# SchoolStream

SchoolStream is a Twitch-style livestreaming platform focused on a lightweight, accessible experience for school Chromebooks.

## Upstream attribution

This project currently builds on the starter at [nayak-nirmalya/twitch-clone](https://github.com/nayak-nirmalya/twitch-clone), whose README credits [Antonio Erdeljac](https://github.com/AntonioErdeljac). SchoolStream is an independent fork and is being substantially modified.

The upstream repository did not contain a LICENSE file when checked. Confirm the applicable permissions and licensing before distributing or operating a public derivative service.

## Current stack

- Next.js App Router and React
- Clerk authentication
- Prisma with MySQL
- LiveKit for real-time audio/video and chat transport
- UploadThing for stream thumbnails

## Broadcasting

- Browser camera and microphone broadcasting
- Browser screen sharing, including shared-tab audio where the browser supports it
- RTMP and WHIP ingress for OBS and compatible broadcasting tools
- A channel can use one publishing source at a time; the server checks for an already-live source before starting browser broadcasting

## Local development

1. Install Node.js (use the current LTS release) and npm.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the required credentials.
4. Generate the Prisma client with `npx prisma generate`.
5. Apply the Prisma schema to your MySQL database with `npx prisma db push` (or use your established migration workflow).
6. Run `npm run typecheck` and `npm run lint`.
7. Start the development server with `npm run dev`.

## Deploying to Vercel

The intended production host is **Vercel**. This is a Next.js application and should be deployed as a standard Vercel project:

1. Import `relaymann/SchoolStream` into Vercel.
2. Select the `development` branch for preview deployments while development is in progress. Use the production branch only after the release is ready.
3. Keep the framework preset as Next.js. The standard build command is `npm run build`; the output directory should remain managed by Next.js.
4. Configure the environment variables below for the appropriate Vercel environments.
5. Configure Clerk's production instance and webhook endpoint at `https://YOUR_DOMAIN/api/webhooks/clerk`.
6. Configure LiveKit's webhook endpoint at `https://YOUR_DOMAIN/api/webhooks/livekit`.
7. Add the deployed domain to Clerk's allowed origins/redirect settings and configure the public LiveKit WebSocket URL.

### Required environment variables

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `DATABASE_URL`
- `LIVEKIT_API_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_WS_URL`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`

The `NEXT_PUBLIC_CLERK_*` sign-in/sign-up URL variables in `.env.example` are optional if the defaults are acceptable.

### Production notes

- Use a managed MySQL database with connection pooling suitable for serverless workloads. Keep the connection string private and configure it separately for Preview and Production.
- LiveKit is an external media service; Vercel does not provide the media ingress/egress infrastructure.
- Never expose LiveKit API secrets, Clerk secret keys, webhook secrets, database credentials, or stream keys in client-side code.
- Configure webhook secrets independently for each environment.
- Do not deploy production until the authentication, webhook, chat authorization, database, and real-device streaming tests pass.

## Project status

This repository began as a Twitch-style starter. SchoolStream development is actively replacing inherited branding, tightening server-side authorization, and preparing the application for reliable Vercel deployment. Features are not considered production-ready until they have been tested against configured external services.
