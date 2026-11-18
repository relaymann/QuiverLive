# QuiverLive streaming integration test plan

This is the manual acceptance plan for the LiveKit project and devices. Passing repository CI does not substitute for these tests.

## Test setup
Use two signed-in creator/viewer accounts, one guest browser session, one desktop browser with a camera and microphone, and OBS with RTMP and WHIP configured. Keep API secrets and stream keys private. Verify the LiveKit webhook points to /api/webhooks/livekit.

## Browser broadcasting
- [ ] Start camera and microphone at 360p, 540p, and 720p.
- [ ] Confirm the preview, remote viewer video, microphone audio, and live status.
- [ ] Start screen share with system audio where supported; confirm both screen video and audio on a second viewer.
- [ ] Stop from the creator UI; verify capture indicators turn off and the channel becomes offline.
- [ ] Stop screen sharing from the browser's native sharing UI; verify the broadcast stops.
- [ ] Deny camera/microphone permission and cancel screen sharing; verify no source reservation or OBS ingress is lost.
- [ ] Close the creator tab during a live broadcast; verify tracks stop and webhook cleanup marks the channel offline.
- [ ] Interrupt network access, restore it, and verify reconnect status and playback behavior.
- [ ] Attempt to start a second browser broadcast from another tab; it must be rejected.

## OBS / RTMP / WHIP
- [ ] Create RTMP ingress, connect OBS, and verify video/audio playback and live status.
- [ ] Stop OBS; verify the channel goes offline.
- [ ] Create WHIP ingress and connect a compatible encoder; verify playback and live status.
- [ ] Create ingress, then switch to browser broadcast before OBS starts; old ingress credentials must no longer publish.
- [ ] Start OBS first, then attempt browser broadcast; browser source reservation must be rejected.
- [ ] Start browser first, then attempt to create RTMP/WHIP ingress; ingress creation must be rejected.
- [ ] Attempt simultaneous browser and OBS starts; only one source may remain active.
- [ ] Regenerate ingress and verify old stream keys no longer work.

## Chat and moderation
- [ ] Verify registered and guest viewers can chat in normal mode.
- [ ] Verify the one-second baseline limit and three-second slow mode under concurrent sends.
- [ ] Verify followers-only chat rejects guests and non-followers while allowing followers and the channel owner.
- [ ] Verify disabled chat rejects sends even for viewers with existing LiveKit tokens.
- [ ] Verify raw client LiveKit data packets are ignored by the UI and cannot bypass server moderation.
- [ ] Timeout a registered viewer and a guest; verify the current session is removed, chat is blocked for five minutes, and viewing can resume.
- [ ] Ban a registered viewer; verify they cannot obtain another viewer token.
- [ ] Verify the banned viewer appears in Chat settings and can be unbanned.
- [ ] Verify guest ban controls are disabled and server rejects attempts to persistently ban guests.
- [ ] Verify blocks in either direction prevent chat and channel access.

## Reliability and performance
- [ ] Confirm webhook retries are idempotent and stale source events do not switch the active source offline.
- [ ] Check stream state after browser/encoder crashes and after creator navigation.
- [ ] Test Chrome, Firefox, Safari, and mobile browsers where available.
- [ ] Measure CPU, memory, upload bandwidth, startup time, and viewer playback quality at each quality preset.
- [ ] Test through restrictive networks and confirm TURN/TLS behavior.
