# Bug-fix audit

## Scope
This pass hardens server actions that are callable over the network. TypeScript types do not validate serialized server-action input at runtime, so malformed payloads must be rejected before field access or persistence.

## Fixes
- Stream settings now reject null, arrays, non-string stream names, and non-string thumbnail URLs before trimming or URL parsing.
- Profile updates reject malformed payloads and missing bio values. Previously, omitting `bio` silently converted it to `null`, which could erase an existing profile bio during a partial update.
- Chat command creation validates the payload object before reading its properties.
- Moderation validates the runtime action against the two supported operations. Previously, an unexpected action string could fall through as a non-ban, non-timeout moderation upsert and clear an existing timeout.
- Viewer-token creation now validates the channel identifier and checks LiveKit credentials before token construction.
- Browser broadcaster-token creation validates the session identifier and checks LiveKit credentials before constructing a token.
- Browser broadcast release rejects malformed channel/session identifiers before querying LiveKit or the database.

## Review notes
- Authorization remains server-side: stream/profile actions resolve the signed-in user; moderation verifies channel ownership; broadcaster actions verify ownership and the active reservation.
- No client-provided user ID, role, stream ID, or database update object is accepted as authoritative state.
- Existing database-backed checks for channel bans, blocks, follower-only chat, rate limits, and broadcast session ownership remain in place.

## Verification limits
Automated CI validates schema, lint, types, production compilation, and dependency audits. It does not exercise every malicious serialized payload, database race, Clerk webhook retry, or LiveKit room lifecycle. Those require focused integration tests against staging services.
