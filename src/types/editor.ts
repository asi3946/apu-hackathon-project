import { Memo } from './schema';

/**
 * Vimのモード定義
 * 将来的に 'visual' や 'command' が増えてもここで管理
 */
export type VimMode = 'normal' | 'insert';

/**
 * カーソル位置
 * 行・列ではなく「文字インデックス」で管理するのが今回のキモ
 */
export type CursorPosition = number;

/**
 * エディタ全体のステート
 * 現在編集中のメモと、Vim的な状態を保持
 */
export interface EditorState {
  memo: Memo;            // 現在開いているメモデータ
  mode: VimMode;         // 現在のVimモード
  cursor: CursorPosition; // キャレットの位置
  isDirty: boolean;      // 保存されていない変更があるか
}