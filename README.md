# TTS Easy

Web app MVP for text-to-speech with:

- Instant language detection (paste + typing debounce).
- Accent-aware locale suggestions (`es`, `en`, `pt`) with non-blocking prompt.
- Manual locale override per pasted text.
- Reader selector (`claro`, `natural`, `expresivo`).
- Google Cloud TTS MP3 generation + download.
- Anti-abuse controls (rate limit + Turnstile CAPTCHA).
- Budget guard (`MONTHLY_BUDGET_USD`).
- AdSense slots + GA4 events.

## Run locally

1. Copy environment file:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## API endpoints

- `POST /api/language/detect`
- `GET /api/readers?locale=<bcp47>`
- `POST /api/tts`
- `GET /api/health`

## Main events (GA4)

- `language_detected`
- `locale_ambiguous_prompt_shown`
- `locale_manual_selected`
- `tts_success`
- `tts_error`
- `mp3_download`
- `ad_slot_view`
