// Shared types for the brand-independent short-video renderer.
// A video = one Spec (scenes, timing, text) + one Theme (brand colours, fonts, mascot).
// Specs live in each content package; themes live in each brand folder.

export type Mood = 'idle' | 'think' | 'surprised' | 'happy';

export type Theme = {
  brandName: string;
  colors: {
    bg: string;
    bg2: string;
    surface: string;
    text: string;
    muted: string;
    accent: string; // main highlight
    accent2: string; // secondary series / links
    warn: string; // "wrong idea" / strike-through
    good: string; // "right idea"
  };
  fonts: {
    // Each entry: family name + files in public/fonts (must support Thai).
    heading: { family: string; files: { weight: number; file: string }[] };
    body: { family: string; files: { weight: number; file: string }[] };
  };
  mascot?: { enabled: boolean; color: string; belly: string }; // bars use colors.accent
};

export type ChartDef = {
  series: { label: string; color?: string; values: number[] }[];
  note?: string; // e.g. "ตัวเลขสมมติ" — always label illustrative data
};

type Base = {
  id: string;
  durationSec: number;
  mascot?: Mood;
};

export type Scene =
  | (Base & { type: 'hook'; kicker: string; headline: string; highlight?: string; chart?: ChartDef })
  | (Base & { type: 'chart'; heading: string; lines?: string[]; chart: ChartDef })
  | (Base & {
      type: 'cause';
      question: string;
      answerLead: string;
      cause: string;
      effects: [string, string];
    })
  | (Base & { type: 'define'; items: { term: string; meaning: string }[] })
  | (Base & { type: 'list'; heading: string; items: string[]; footer?: string })
  | (Base & { type: 'question'; kicker: string; question: string; highlight?: string })
  | (Base & { type: 'cta'; action: string; sub?: string });

export type Spec = {
  title: string;
  fps: number;
  width: number;
  height: number;
  showSafeZone?: boolean; // QC overlay only — never on for final export
  coverSec?: number; // which moment to use as the cover image
  safeZone: { top: number; bottom: number; left: number; right: number };
  scenes: Scene[];
};

export type Props = { spec: Spec; theme: Theme };
