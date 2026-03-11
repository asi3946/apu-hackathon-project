import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  cursorAtom,
  deleteCharAtom,
  deleteLineAtom,
  deleteVisualSelectionAtom,
  editorContentAtom,
  editorSettingsAtom,
  getLineTextAtom,
  getVisualSelectionTextAtom,
  insertNewLineAboveAtom,
  insertNewLineBelowAtom,
  jumpToLineEndAtom,
  jumpToLineStartAtom,
  modeAtom,
  moveDownAtom,
  moveLeftAtom,
  moveRightAtom,
  moveUpAtom,
  redoAtom,
  saveHistoryAtom,
  undoAtom,
  visualStartAtom,
} from "@/store/models";

export function useVimEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // プログラムによる変更時に、誤った select イベントを無視するためのフラグ
  const ignoreSelectRef = useRef(false);

  const [content, setContent] = useAtom(editorContentAtom);
  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const settings = useAtomValue(editorSettingsAtom);
  const deleteChar = useSetAtom(deleteCharAtom);
  const deleteLine = useSetAtom(deleteLineAtom);
  const saveHistory = useSetAtom(saveHistoryAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const [visualStart, setVisualStart] = useAtom(visualStartAtom);
  const deleteVisualSelection = useSetAtom(deleteVisualSelectionAtom);
  const getVisualSelectionText = useSetAtom(getVisualSelectionTextAtom);
  const getLineText = useSetAtom(getLineTextAtom);
  const insertNewLineBelow = useSetAtom(insertNewLineBelowAtom);
  const insertNewLineAbove = useSetAtom(insertNewLineAboveAtom);

  const [pendingCommand, setPendingCommand] = useState<string>("");
  const [insertPending, setInsertPending] = useState<string>("");

  const moveDown = useSetAtom(moveDownAtom);
  const moveUp = useSetAtom(moveUpAtom);
  const moveLeft = useSetAtom(moveLeftAtom);
  const moveRight = useSetAtom(moveRightAtom);
  const jumpStart = useSetAtom(jumpToLineStartAtom);
  const jumpEnd = useSetAtom(jumpToLineEndAtom);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && settings.type === "vim") {
      if (vimMode === "normal") {
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
          const pos1 = Math.min(visualStart, cursor);
          const pos2 = Math.max(visualStart, cursor);

          const searchPos = pos1 - 1;
          const lastNewLine = content.lastIndexOf(
            "\n",
            searchPos < 0 ? 0 : searchPos,
          );
          const start = lastNewLine === -1 ? 0 : lastNewLine + 1;

          const nextNewLine = content.indexOf("\n", pos2);
          const end = nextNewLine === -1 ? content.length : nextNewLine + 1;

          textarea.setSelectionRange(start, end);
        }
      } else {
        textarea.setSelectionRange(cursor, cursor);
      }

      // 正しい選択範囲の適用が終わったら、フラグを解除して通常操作を受け付ける
      ignoreSelectRef.current = false;
    }
  }, [cursor, vimMode, settings.type, content, visualStart]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    const textarea = textareaRef.current;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        e.preventDefault();
        ignoreSelectRef.current = true; // プログラムによる変更を開始

        setVimMode("normal");
        saveHistory();
        setInsertPending("");
        if (cursor > 0) setCursor(cursor - 1);
      } else if (e.key === "k" && insertPending === "j") {
        e.preventDefault();

        if (textarea) {
          ignoreSelectRef.current = true; // プログラムによる変更を開始

          const currentCursor = textarea.selectionStart;
          const currentContent = textarea.value;

          if (currentContent.charAt(currentCursor - 1) === "j") {
            const newText =
              currentContent.slice(0, currentCursor - 1) +
              currentContent.slice(currentCursor);
            setContent(newText);
            setCursor(Math.max(0, currentCursor - 2));
          } else {
            setCursor(Math.max(0, currentCursor - 1));
          }
        }

        setVimMode("normal");
        saveHistory();
        setInsertPending("");
      } else if (e.key === "j") {
        setInsertPending("j");
      } else {
        setInsertPending("");
      }
      return;
    }

    if (
      vimMode === "normal" ||
      vimMode === "visual" ||
      vimMode === "visualLine"
    ) {
      e.preventDefault();
      ignoreSelectRef.current = true; // ノーマル/ビジュアルモードのキーボード操作も全てフラグで保護

      if (e.ctrlKey && e.key.toLowerCase() === "r") {
        redo();
        setPendingCommand("");
        if (vimMode === "visual" || vimMode === "visualLine") {
          setVimMode("normal");
          setVisualStart(null);
        }
        return;
      }

      if (e.key === "Escape") {
        setPendingCommand("");
        if (vimMode === "visual" || vimMode === "visualLine") {
          setVimMode("normal");
          setVisualStart(null);
        }
        return;
      }

      switch (e.key) {
        case "h":
          moveLeft(content);
          setPendingCommand("");
          break;
        case "j":
          moveDown(content);
          setPendingCommand("");
          break;
        case "k":
          moveUp(content);
          setPendingCommand("");
          break;
        case "l":
          moveRight(content);
          setPendingCommand("");
          break;
        case "0":
          jumpStart(content);
          setPendingCommand("");
          break;
        case "$":
          jumpEnd(content);
          setPendingCommand("");
          break;
        case "v":
          if (vimMode === "normal" || vimMode === "visualLine") {
            setVimMode("visual");
            setVisualStart(cursor);
          } else {
            setVimMode("normal");
            setVisualStart(null);
          }
          setPendingCommand("");
          break;
        case "V":
          if (vimMode === "normal" || vimMode === "visual") {
            setVimMode("visualLine");
            setVisualStart(cursor);
          } else {
            setVimMode("normal");
            setVisualStart(null);
          }
          setPendingCommand("");
          break;
        case "i":
          setVimMode("insert");
          setPendingCommand("");
          break;
        case "a":
          setCursor(cursor + 1);
          setVimMode("insert");
          setPendingCommand("");
          break;
        case "A":
          setVimMode("insert");
          jumpEnd(content);
          setPendingCommand("");
          break;
        case "o":
          saveHistory();
          insertNewLineBelow();
          setPendingCommand("");
          break;
        case "O":
          saveHistory();
          insertNewLineAbove();
          setPendingCommand("");
          break;
        case "x":
        case "d":
          if (vimMode === "visual" || vimMode === "visualLine") {
            saveHistory();
            deleteVisualSelection();
            saveHistory();
            setPendingCommand("");
          } else if (e.key === "x") {
            saveHistory();
            deleteChar();
            saveHistory();
            setPendingCommand("");
          } else if (pendingCommand === "d") {
            saveHistory();
            deleteLine();
            saveHistory();
            setPendingCommand("");
          } else {
            setPendingCommand("d");
          }
          break;
        case "y":
          if (vimMode === "visual" || vimMode === "visualLine") {
            const textToCopy = getVisualSelectionText();
            if (textToCopy) navigator.clipboard.writeText(textToCopy);
            setPendingCommand("");
          } else if (pendingCommand === "y") {
            const textToCopy = getLineText();
            if (textToCopy) navigator.clipboard.writeText(textToCopy);
            setPendingCommand("");
          } else {
            setPendingCommand("y");
          }
          break;
        case "p":
          navigator.clipboard
            .readText()
            .then((clipText) => {
              if (!clipText) return;

              saveHistory();
              const newText =
                content.slice(0, cursor) + clipText + content.slice(cursor);
              setContent(newText);
              setCursor(cursor + clipText.length);
              saveHistory();
            })
            .catch((err) => {
              console.error("クリップボードの読み取りに失敗しました", err);
            });
          setPendingCommand("");
          break;
        case "u":
          undo();
          setPendingCommand("");
          break;
        default:
          setPendingCommand("");
          break;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursor(e.target.selectionStart);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    // プログラムで変更処理中の一瞬は、ブラウザネイティブの誤ったSelectイベントを無視する
    if (ignoreSelectRef.current) return;

    if (
      settings.type === "vim" &&
      (vimMode === "visual" || vimMode === "visualLine")
    )
      return;
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
