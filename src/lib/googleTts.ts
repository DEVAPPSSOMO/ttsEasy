import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { ReaderOption, TtsSpeed } from "@/lib/types";

// Google Cloud Text-to-Speech integration.
//
// Why env-based credentials:
// - In Vercel/serverless environments you usually don't have "default application credentials".
// - We pass a service account (project id + client email + private key) via env vars.
//
// Private key formatting:
// - Many dashboards store multiline values with escaped newlines (`\\n`).
// - The SDK expects real newlines, so we unescape before constructing the client.
const GOOGLE_LOCALE_MAP: Record<string, string> = {
  "es-AR": "es-US",
  "es-MX": "es-US"
};

// Cache the client per runtime instance to avoid re-creating it on every request.
let client: TextToSpeechClient | null = null;

function getTtsClient(): TextToSpeechClient {
  if (client) {
    return client;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    client = new TextToSpeechClient({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      },
      projectId
    });
    return client;
  }

  client = new TextToSpeechClient();
  return client;
}

function chunkText(text: string, maxLength = 4200): string[] {
  // Chunking keeps us under typical API limits and avoids edge-cases with very long inputs.
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current = current ? `${current} ${sentence}` : sentence;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (sentence.length <= maxLength) {
      current = sentence;
      continue;
    }

    for (let index = 0; index < sentence.length; index += maxLength) {
      chunks.push(sentence.slice(index, index + maxLength));
    }
    current = "";
  }

  if (current) {
    chunks.push(current);
  }
  return chunks;
}

function mapLocaleToGoogle(locale: string): string {
  // Some locales are served by `es-US` voices in our voice matrix.
  return GOOGLE_LOCALE_MAP[locale] ?? locale;
}

function audioToBuffer(audioContent: string | Uint8Array | null | undefined): Buffer {
  if (!audioContent) {
    return Buffer.from([]);
  }
  if (typeof audioContent === "string") {
    return Buffer.from(audioContent, "base64");
  }
  return Buffer.from(audioContent);
}

function pitchForReader(readerId: ReaderOption["id"]): number {
  if (readerId === "claro") {
    return -1;
  }
  if (readerId === "expresivo") {
    return 2;
  }
  return 0;
}

async function synthesizeChunk(
  clientInstance: TextToSpeechClient,
  text: string,
  locale: string,
  reader: ReaderOption,
  speed: TtsSpeed
): Promise<Buffer> {
  const languageCode = mapLocaleToGoogle(locale);
  const requestBase = {
    audioConfig: {
      audioEncoding: "MP3" as const,
      pitch: pitchForReader(reader.id),
      speakingRate: speed
    },
    input: { text },
    voice: {
      languageCode
    }
  };

  try {
    // Prefer an explicit voice name (best quality/consistency).
    const [response] = await clientInstance.synthesizeSpeech({
      ...requestBase,
      voice: {
        ...requestBase.voice,
        name: reader.voiceName
      }
    });
    return audioToBuffer(response.audioContent);
  } catch (error) {
    // Fallback: request only by languageCode if a specific voice fails (regional availability, etc).
    const [fallbackResponse] = await clientInstance.synthesizeSpeech(requestBase);
    return audioToBuffer(fallbackResponse.audioContent);
  }
}

export async function synthesizeTextToMp3(payload: {
  locale: string;
  reader: ReaderOption;
  speed: TtsSpeed;
  text: string;
}): Promise<Buffer> {
  const clientInstance = getTtsClient();
  const chunks = chunkText(payload.text);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    const buffer = await synthesizeChunk(
      clientInstance,
      chunk,
      payload.locale,
      payload.reader,
      payload.speed
    );
    buffers.push(buffer);
  }

  return Buffer.concat(buffers);
}
