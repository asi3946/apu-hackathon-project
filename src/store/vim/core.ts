import { atom } from "jotai";
import type { CursorPosition, VimMode } from "@/types/models";

// --- State ---
export const modeAtom = atom<VimMode>("normal");
export const visualStartAtom = atom<number | null>(null);
export const cursorAtom = atom<CursorPosition>(0);

// --- 物理法則 (Core Helpers) ---

export const getLineStart = (text: string, pos: number) => {
  const searchPos = pos - 1;
  if (searchPos < 0) return 0;
  const lastNewLine = text.lastIndexOf("\n", searchPos);
  return lastNewLine === -1 ? 0 : lastNewLine + 1;
};

export const getLineLength = (text: string, lineStart: number) => {
  const nextNewLine = text.indexOf("\n", lineStart);
  const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;
  return lineEnd - lineStart;
};
