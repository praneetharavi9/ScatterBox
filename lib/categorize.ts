import Anthropic from '@anthropic-ai/sdk';
import type { List } from '@/context/entries-context';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!,
  dangerouslyAllowBrowser: true,
});

const SYSTEM_PROMPT =
  'You are a categorization assistant for a personal notes app called ScatterBox. ' +
  'The user dumps thoughts, tasks, and ideas into a feed and you sort them. ' +
  'Given a short text entry and a list of available categories, respond with ONLY ' +
  'the single most appropriate category ID — nothing else, no explanation, no punctuation.\n\n' +
  'EXCEPTION: If the entry clearly belongs to a specific named project or distinct context ' +
  'that none of the existing lists cover, respond with "new:" followed by a concise list name ' +
  '(2–3 words, title case), e.g. "new:Project Atlas" or "new:Trip Planning". ' +
  'Only do this when the entry names or strongly implies a specific project — ' +
  'do NOT use "new:" for generic tasks, ideas, or everyday items.';

export type CategorizeResult =
  | { type: 'existing'; id: string }
  | { type: 'new'; name: string };

export async function categorizeEntry(text: string, lists: List[]): Promise<CategorizeResult> {
  const listDescriptions = lists.map(l => `${l.id}: ${l.name}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 32,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Categories:\n${listDescriptions}\n\nEntry: "${text}"`,
      },
    ],
  });

  const raw =
    response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : '';

  if (raw.toLowerCase().startsWith('new:')) {
    const name = raw.slice(4).trim();
    if (name) return { type: 'new', name };
  }

  const normalized = raw.toLowerCase();
  const validIds = lists.map(l => l.id);
  return { type: 'existing', id: validIds.includes(normalized) ? normalized : 'braindump' };
}
