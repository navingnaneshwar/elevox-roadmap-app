/**
 * ELEVOX AGENT REGISTRY
 * Humanized definitions for every AI agent in the platform.
 * Use these in UI components instead of raw agent names.
 */

export const AGENTS = {
  vox: {
    name: 'Vox',
    title: 'Your Brand Strategist',
    emoji: '◎',
    color: '#6366f1',
    tagline: 'Your executive brand strategist — here to ask the questions no one else dares to.',
    role: 'Vox runs your coaching sessions. He digs into your story, challenges your assumptions, and extracts the career moments that define your authority.',
    wiifm: 'Every answer you give Vox makes your brand sharper and more specifically yours.',
    poweredBy: 'Powered by Claude',
  },

  chanakya: {
    name: 'Chanakya',
    title: 'Your Brand Architect',
    emoji: '◈',
    color: '#C8A96E',
    tagline: 'The strategist who turns your story into a 90-day brand framework.',
    role: 'Named after the ancient Indian strategist, Chanakya studies your market, your rivals, and your career facts — then builds the blueprint that governs everything Elevox creates for you.',
    wiifm: 'Chanakya makes sure your content, your positioning, and your voice are working as a coherent strategy — not random posts.',
    handoffMessage: 'Vox is passing your insights to Chanakya, your Brand Architect, to build your personalised framework.',
  },

  shakespeare: {
    name: 'Shakespeare',
    title: 'Your Executive Ghostwriter',
    emoji: '✎',
    color: '#8b5cf6',
    tagline: 'Turns your ideas into content that sounds unmistakably like you.',
    role: 'Shakespeare writes every LinkedIn post, article, and piece of content on your behalf. He studies your approved posts, your voice rules, and your 90-day strategy before writing a single word.',
    wiifm: 'You never start from a blank page again. Every draft is grounded in your actual career, your exact voice, and your strategic goals.',
  },

  aristotle: {
    name: 'Aristotle',
    title: 'Your Editorial Guardian',
    emoji: '◉',
    color: '#10b981',
    tagline: 'The quality gate that catches what you\'d catch yourself — before it goes live.',
    role: 'Aristotle reviews every draft Shakespeare produces. He checks credibility, flags hallucinations, and scores content against your real career facts before it ever reaches your approval queue.',
    wiifm: 'Nothing gets published that you\'d regret. Aristotle keeps your reputation watertight.',
  },

  machiavelli: {
    name: 'Machiavelli',
    title: 'Your Distribution Strategist',
    emoji: '◆',
    color: '#C85A5A',
    tagline: 'Gets your content in front of the right people at the right moment.',
    role: 'Machiavelli decides when, where, and how your content is distributed. He monitors platform signals, sequences your posts for maximum authority, and manages your editorial calendar.',
    wiifm: 'Your content doesn\'t just exist — it lands with precision, at the moments that matter most to your audience.',
  },
}

/**
 * Short one-liner used in tooltips / small UI contexts.
 * e.g. "Chanakya (Your Brand Architect)"
 */
export function agentLabel(key) {
  const a = AGENTS[key]
  if (!a) return key
  return `${a.name} — ${a.title}`
}

/**
 * Returns the humanized handoff sentence for the session-complete view,
 * replacing the raw internal agent name in Vox's handoff message.
 */
export function humanizeAgentRef(text) {
  return text
    .replace(/\bChanakya\b/g, 'Chanakya (your Brand Architect)')
    .replace(/\bShakespeare\b/g, 'Shakespeare (your Ghostwriter)')
    .replace(/\bAristotle\b/g, 'Aristotle (your Editorial Guardian)')
    .replace(/\bMachiavelli\b/g, 'Machiavelli (your Distribution Strategist)')
    .replace(/\bVox\b/g, 'Vox (your Brand Strategist)')
}
