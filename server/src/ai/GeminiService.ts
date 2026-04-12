import { GoogleGenAI } from '@google/genai';

export interface AiSpace {
  name: string;
  building: string;
  floor: string;
  occupancy: number;
  capacity: number;
  noiseLevel: string;
  amenities: string[];
}

export interface AiCriteria {
  building: string;
  environment: string;
  duration: string;
}

export interface AiSuggestion {
  spaceName: string;
  insight: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
  temperature: number;
  topP: number;
  timeoutMs: number;
}

export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly cfg: GeminiConfig;

  constructor(cfg: GeminiConfig) {
    this.cfg = cfg;
    this.ai = new GoogleGenAI({
      apiKey: cfg.apiKey,
      httpOptions: {
        timeout: cfg.timeoutMs,
        retryOptions: { attempts: 3 },
      },
    });
  }

  async generateNudge(stats: {
    name: string; rank: number; streak: number;
    tokens: number; studyHours: number; totalSessions: number;
  }): Promise<string> {
    const prompt = `You are a friendly study coach at John Abbott College.
A student has the following stats: name: ${stats.name}, leaderboard rank: #${stats.rank}, streak: ${stats.streak} days, tokens earned: ${stats.tokens}, total study hours: ${stats.studyHours}h, sessions completed: ${stats.totalSessions}.
Write ONE short motivational sentence (max 20 words) personalised to their stats. Be specific and warm. No bullet points, no quotes.`;

    const result = await this.ai.models.generateContent({
      model: this.cfg.model,
      contents: prompt,
      config: { maxOutputTokens: 80, temperature: 0.8 },
    });
    return (result.text ?? '').trim();
  }

  async suggestSpace(criteria: AiCriteria, spaces: AiSpace[]): Promise<AiSuggestion> {
    const prompt = `You are a study spot assistant at John Abbott College in Montreal.
Given the student's preferences and the list of available study spaces with live occupancy data, recommend the single best study spot.

Student preferences:
- Preferred building: ${criteria.building === 'all' ? 'any building' : criteria.building}
- Study environment: ${criteria.environment} (silent = exams/deep focus, quiet = reading/notes, collaborative = group work)
- Session length: ${criteria.duration} (short = under 1 hour, medium = 1–2 hours, long = 2+ hours)

Available spaces (with live occupancy):
${JSON.stringify(spaces, null, 2)}

Respond ONLY with valid JSON (no markdown, no code fences). The insight field must be ONE short sentence (max 20 words):
{"spaceName": "<exact name from the list>", "insight": "<one sentence, max 20 words, mentioning free seats and noise level>"}`;

    const result = await this.ai.models.generateContent({
      model: this.cfg.model,
      contents: prompt,
      config: {
        maxOutputTokens: this.cfg.maxOutputTokens,
        temperature: this.cfg.temperature,
        topP: this.cfg.topP,
      },
    });

    const text = result.text ?? '';
    // Extract the first {...} block, stripping markdown fences or surrounding prose
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`Gemini returned no JSON object. Raw: ${text.slice(0, 200)}`);
    const parsed = JSON.parse(match[0]) as AiSuggestion;
    return parsed;
  }
}
