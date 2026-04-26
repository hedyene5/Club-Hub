# Voice2 integration (additive, non-breaking)

Source pulled from GitHub branch `voice2`:
- <https://github.com/hedyene5/Club-Hub/tree/voice2>

## What was integrated

### Frontend (Angular)

New additive namespace:
- `Frontend/src/app/voice2/`

Added pages:
- `Frontend/src/app/voice2/pages/analytics/*`
- `Frontend/src/app/voice2/pages/management/*`

Added services from GitHub voice2:
- `Frontend/src/app/voice2/services/voice-signaling.service.ts`
- `Frontend/src/app/voice2/services/channel.service.ts`
- `Frontend/src/app/voice2/services/notification.service.ts`

Routes added (without replacing existing routes):
- `/voice2/analytics`
- `/voice2/management`

### Backend services (standalone, not wired to avoid regressions)

Pulled repository kept in workspace:
- `hedyene_voice2/Back/AudioModerationService`
- `hedyene_voice2/Back/InstantVoiceManagment`

## Backend wiring now added (non-breaking)

Gateway routes were added with an isolated prefix so existing APIs are untouched:
- `/api/voice2/channels/**` -> `http://localhost:8082/api/channels/**`
- `/api/voice2/audio/**` -> `http://localhost:8082/api/audio/**`
- `/api/voice2/voice/**` -> `http://localhost:8082/api/voice/**`
- `/api/voice2/notifications/**` -> `http://localhost:8082/api/notifications/**`
- `/ws/voice2/**` -> `ws://localhost:8082/ws/**`

Frontend Voice2 services now consume those Gateway routes (no direct `localhost:8080` anymore).

## Start order

1. Start Python moderation service:
   - folder: `hedyene_voice2/Back/AudioModerationService`
   - command: `python main.py`
2. Start InstantVoiceManagment service:
   - folder: `hedyene_voice2/Back/InstantVoiceManagment`
   - command: `mvnw.cmd spring-boot:run`
3. Restart Gateway:
   - folder: `Gateway`
   - command: `mvnw.cmd spring-boot:run`
