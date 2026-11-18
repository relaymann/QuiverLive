# Complete QuiverLive product scope

This is the full scope requested for QuiverLive. It separates persistence foundations from finished product workflows; a database model does not mean a feature is ready to use.

## Production reliability and security
- Versioned PostgreSQL migrations, backups, restore drills, rollback plans, and connection pooling.
- Centralized server-side ownership and role authorization for every creator/moderator action.
- Signed, replay-safe, idempotent Clerk and LiveKit webhooks with stale-event protection.
- Rate limits for chat, commands, follows, notifications, clips, uploads, redemptions, and sensitive account operations.
- Structured logs, request IDs, error reporting, health/readiness checks, queue monitoring, and alerts.
- Unit, integration, security, end-to-end, concurrency, and load tests.
- Feature flags, safe rollouts, privacy export/deletion, retention policies, abuse reporting, and operational runbooks.

## Creator and viewer tools
- Stream Manager with live health, audience, chat, source state, and moderation controls.
- Channel customization: title, description, category, tags, panels, thumbnails, schedules, and visibility.
- Channel roles: owner, moderator, editor, VIP, least-privilege permissions, and audit trails.
- Command manager with variables, permissions, cooldowns, and custom channel emotes.
- Notifications inbox, live alerts, follow alerts, reminders, preferences, and deduplication.
- Creator analytics: concurrent/unique viewers, watch time, retention, chat activity, follows, and exports.
- Recently watched and continue watching with viewer privacy controls.

## Discovery
- Search by creator, title, category, and tag.
- Browse filters, category pages, personalized recommendations, ranking safeguards, and recently active channels.

## Media and community
- VOD recording, resumable ingest, transcoding, thumbnails, processing status, access controls, retention, and deletion.
- Clip creation from validated VOD ranges, asynchronous processing, sharing, and moderation.
- Raids/hosting with target-live checks, confirmation, participant handoff, cancellation, and abuse controls.
- Channel points with an append-only idempotent ledger, atomic balance updates, rewards, cooldowns, and redemption queue.
- Subscriptions with provider-hosted checkout, signed webhook reconciliation, entitlements, cancellation, refunds, and payout/compliance review.
- Advanced analytics with daily aggregates and privacy-preserving unique-viewer measurement.

## Performance and accessibility
- Adaptive bitrate, constrained-network recovery, reconnect backoff, visibility-aware playback, bounded memory, and deterministic media cleanup.
- Lazy media, responsive images, query/index review, explicit cache invalidation, and background processing for expensive work.
- Keyboard operation, focus management, captions where available, reduced motion, contrast, screen-reader labels, and responsive mobile layouts.
- Repeatable performance budgets on low-powered phones and desktop browsers.

## Persistence foundations added
The Prisma schema now includes models for video assets, clips, channel point balances and ledger entries, rewards, channel roles, chat commands, emotes, notifications, raids, subscriptions, daily analytics, and recently watched history. Existing WatchSession remains the basis for channel-specific watchtime.

These are schema foundations only. UI, server workflows, authorization, media storage and transcoding, payment processing, notification delivery, queue workers, and provider integrations remain separate implementation work. Do not enable or advertise these features as operational until those pieces and their tests are complete.



### Current incremental schema change
The custom-command cooldown requires the nullable `ChatCommand.lastUsedAt` column. This repository does not yet have a versioned Prisma migration baseline, so this change is not represented as a standalone production migration. Apply and verify the schema with `npx prisma db push` only in a development database. Before production, establish a reviewed baseline and migration plan, then add the nullable `lastUsedAt` column to the existing `ChatCommand` table. Do not deploy this feature against a database that has not received the schema update.

## Release gates
1. Review and apply a versioned migration against disposable PostgreSQL; verify backup and restore.
2. Pass authorization matrix, abuse, and rate-limit tests.
3. Pass webhook duplicate, replay, reorder, and outage tests.
4. Pass browser, OBS RTMP, WHIP, playback, reconnect, and source-switch tests on real devices.
5. Verify recording/clip storage lifecycle, queue retry, and dead-letter behavior.
6. Verify channel point ledger concurrency/idempotency and subscription webhook reconciliation.
7. Pass accessibility and performance budgets on target devices.
8. Rehearse monitoring, alert routing, rollback, and restore.
9. Complete full regression audit. Production deployment remains explicitly opt-in.
