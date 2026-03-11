import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import {
  cursorAtom,
  editorContentAtom,
  editorSettingsAtom,
  modeAtom,
  selectedMemoIdAtom,
  visualStartAtom,
} from "@/store/models";
import { getLineEnd, getLineStart } from "@/store/vim/core"; // パスはディレクトリ構成に合わせて調整してください
import { useVimKeyHandler } from "./useVimKeyHandler";

export function useVimEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // プログラムによる変更時に、誤った select イベントを無視するためのフラグ
  const ignoreSelectRef = useRef(false);

  const [content, setContent] = useAtom(editorContentAtom);
  const [vimMode] = useAtom(modeAtom);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const settings = useAtomValue(editorSettingsAtom);
  const [visualStart] = useAtom(visualStartAtom);

  const selectedId = useAtomValue(selectedMemoIdAtom);

  // 切り出したカスタムフックを呼び出す
  const { handleKeyDown } = useVimKeyHandler(textareaRef, ignoreSelectRef);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && settings.type === "vim") {
      if (vimMode === "normal") {
        // 一番端にカーソルが来たとき文字を囲えないから.minを使って判定.
        // 現在のコードだとnomalモードでカーソルが端に来ることはないはず.
        const endPos = Math.min(cursor + 1, content.length);
        textarea.setSelectionRange(cursor, endPos);
      } else if (
        (vimMode === "visual" || vimMode === "visualLine") &&
        visualStart !== null
      ) {
        if (vimMode === "visual") {
          const start = Math.min(visualStart, cursor);
          const end = Math.max(visualStart, cursor) + 1;
          textarea.setSelectionRange(start, end);
        } else {
          // visualLine モード
          const pos1 = Math.min(visualStart, cursor);
          const pos2 = Math.max(visualStart, cursor);

          const start = getLineStart(content, pos1);

          const lineEndPos = getLineEnd(content, pos2);
          const end =
            lineEndPos === content.length ? content.length : lineEndPos + 1;

          textarea.setSelectionRange(start, end);
        }
      } else {
        textarea.setSelectionRange(cursor, cursor);
      }

      // 正しい選択範囲の適用が終わったら、フラグを解除して通常操作を受け付ける
      ignoreSelectRef.current = false;
    }
  }, [cursor, vimMode, settings.type, content, visualStart]);

  useEffect(() => {
    if (selectedId) {
      setCursor(0);

      // DOMの描画が少し遅れるケースを考慮して、わずかな遅延（非同期）でフォーカスを当てる
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  }, [selectedId, setCursor]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursor(e.target.selectionStart);
  };

  // vimモードでマウスを使ったときにAtomに変更が渡されるようにするための記述.
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    // プログラムで変更処理中の一瞬は、ブラウザネイティブの誤ったSelectイベントを無視する
    if (ignoreSelectRef.current) return;
    // visualモードの時はブラウザネイティブのイベントを無視.
    if (
      settings.type === "vim" &&
      (vimMode === "visual" || vimMode === "visualLine")
    )
      return;
    // ブラウザネイティブのイベントを受け入れ.
    setCursor(e.currentTarget.selectionStart);
  };

  return {
    textareaRef,
    content,
    vimMode,
    settings,
    handleChange,
    handleSelect,
    handleKeyDown,
  };
}
