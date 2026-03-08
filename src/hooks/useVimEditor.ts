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
    }
  }, [cursor, vimMode, settings.type, content, visualStart]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        e.preventDefault();
        setVimMode("normal");
        saveHistory();
        setInsertPending("");
      } else if (e.key === "k" && insertPending === "j") {
        e.preventDefault();
        const newText = content.slice(0, cursor - 1) + content.slice(cursor);
        setContent(newText);
        setCursor(cursor - 1);

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
            // Atomからテキストを受け取ってクリップボードに入れるだけ
            const textToCopy = getVisualSelectionText();
            if (textToCopy) navigator.clipboard.writeText(textToCopy);
            setPendingCommand("");
          } else if (pendingCommand === "y") {
            // Atomから1行分のテキストを受け取ってクリップボードに入れるだけ
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
