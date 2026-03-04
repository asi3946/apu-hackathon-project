import { atom } from 'jotai';

// エディタで現在編集中のテキスト
// DBの内容とは別に、リアルタイムな入力をここで管理する
export const editorContentAtom = atom<string>('');

// タイトルも同様に
export const editorTitleAtom = atom<string>('');