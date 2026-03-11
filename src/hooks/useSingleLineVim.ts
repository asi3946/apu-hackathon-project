import { useEffect, useRef, useState } from "react";

export function useSingleLineVim(
  value: string,
  onChange: (val: string) => void,
  onExit?: () => void,
  onNavigate?: (direction: "up" | "down") => void,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreSelectRef = useRef(false);
  const [vimMode, setVimMode] = useState<"normal" | "insert" | "visual">(
    "normal",
  );
  const [cursor, setCursor] = useState(0);
  const [visualStart, setVisualStart] = useState<number | null>(null);

  const [pendingCommand, setPendingCommand] = useState("");

  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [insertPending, setInsertPending] = useState("");
  const jkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (vimMode === "normal" && history[historyIndex] !== value) {
      setHistory([value]);
      setHistoryIndex(0);
    }
  }, [value, history, historyIndex, vimMode]);

  const pushHistory = (newVal: string) => {
    if (newVal === history[historyIndex]) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newVal);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      setCursor(Math.min(cursor, history[newIndex].length));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      setCursor(Math.min(cursor, history[newIndex].length));
    }
  };

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    if (vimMode === "visual" && visualStart !== null) {
      const start = Math.min(visualStart, cursor);
      const end = Math.max(visualStart, cursor) + 1;
      input.setSelectionRange(start, end);
    } else if (vimMode === "normal") {
      const endPos = Math.min(cursor + 1, value.length);
      if (value.length === 0) {
        input.setSelectionRange(0, 0);
      } else {
        input.setSelectionRange(cursor, endPos);
      }
    } else {
      input.setSelectionRange(cursor, cursor);
    }
    ignoreSelectRef.current = false;
  }, [cursor, vimMode, value, visualStart]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
        e.preventDefault();
        ignoreSelectRef.current = true;
        setVimMode("normal");
        setCursor((prev) => Math.max(0, prev - 1));
        pushHistory(value);
        setInsertPending("");
      } else if (e.key === "k" && insertPending === "j") {
        if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
        e.preventDefault();

        let textToSave = value;
        const input = inputRef.current;

        if (input) {
          ignoreSelectRef.current = true;
          const currentCursor = input.selectionStart || 0;
          const currentContent = input.value;

          if (currentContent.charAt(currentCursor - 1) === "j") {
            const newVal =
              currentContent.slice(0, currentCursor - 1) +
              currentContent.slice(currentCursor);
            onChange(newVal);
            setCursor(Math.max(0, currentCursor - 2));
            textToSave = newVal;
          } else {
            setCursor(Math.max(0, currentCursor - 1));
          }
        }

        setVimMode("normal");
        pushHistory(textToSave);
        setInsertPending("");
      } else if (e.key === "j") {
        if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
        setInsertPending("j");

        jkTimeoutRef.current = setTimeout(() => {
          setInsertPending("");
        }, 300);
      } else if (e.key === "Enter") {
        if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
        e.preventDefault();
        ignoreSelectRef.current = true;
        setVimMode("normal");
        pushHistory(value);
        setInsertPending("");
        if (onExit) onExit();
      } else {
        if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
        setInsertPending("");
      }
      return;
    }

    e.preventDefault();
    ignoreSelectRef.current = true;

    if (e.ctrlKey && e.key.toLowerCase() === "r") {
      redo();
      setPendingCommand("");
      if (vimMode === "visual") {
        setVimMode("normal");
        setVisualStart(null);
      }
      return;
    }

    if (e.key === "Escape") {
      setPendingCommand("");
      if (vimMode === "visual") {
        setVimMode("normal");
        setVisualStart(null);
      } else if (onExit) {
        onExit();
      }
      return;
    }

    let nextPending = "";

    switch (e.key) {
      case "K":
        if (onNavigate) onNavigate("up");
        break;
      case "J":
        if (onNavigate) onNavigate("down");
        break;
      case "h":
        setCursor((prev) => Math.max(0, prev - 1));
        break;
      case "l":
        setCursor((prev) =>
          Math.min(value.length > 0 ? value.length - 1 : 0, prev + 1),
        );
        break;
      case "0":
        setCursor(0);
        break;
      case "$":
        setCursor(Math.max(0, value.length - 1));
        break;
      case "v":
        if (vimMode === "normal") {
          setVimMode("visual");
          setVisualStart(cursor);
        } else {
          setVimMode("normal");
          setVisualStart(null);
        }
        break;
      case "V":
        setVimMode("visual");
        setVisualStart(0);
        setCursor(Math.max(0, value.length - 1));
        break;
      case "i":
        setVimMode("insert");
        setVisualStart(null);
        break;
      case "a":
        setCursor((prev) => Math.min(value.length, prev + 1));
        setVimMode("insert");
        setVisualStart(null);
        break;
      case "A":
        setCursor(value.length);
        setVimMode("insert");
        setVisualStart(null);
        break;
      case "x":
      case "d":
        if (vimMode === "visual" && visualStart !== null) {
          const start = Math.min(visualStart, cursor);
          const end = Math.max(visualStart, cursor) + 1;
          const newVal = value.slice(0, start) + value.slice(end);
          onChange(newVal);
          setCursor(
            Math.max(0, start > newVal.length ? newVal.length - 1 : start),
          );
          pushHistory(newVal);
          setVimMode("normal");
          setVisualStart(null);
        } else if (e.key === "x" && value.length > 0) {
          const newVal = value.slice(0, cursor) + value.slice(cursor + 1);
          onChange(newVal);
          if (cursor >= newVal.length) {
            setCursor(Math.max(0, newVal.length - 1));
          }
          pushHistory(newVal);
        } else if (pendingCommand === "d") {
          onChange("");
          setCursor(0);
          pushHistory("");
        } else {
          nextPending = "d";
        }
        break;
      case "y":
        if (vimMode === "visual" && visualStart !== null) {
          const start = Math.min(visualStart, cursor);
          const end = Math.max(visualStart, cursor) + 1;
          const textToCopy = value.slice(start, end);
          navigator.clipboard.writeText(textToCopy);
          setVimMode("normal");
          setVisualStart(null);
        } else if (pendingCommand === "y") {
          navigator.clipboard.writeText(value);
        } else {
          nextPending = "y";
        }
        break;
      case "p":
        navigator.clipboard
          .readText()
          .then((clipText) => {
            if (!clipText) return;
            const newVal = `${value.slice(0, cursor)}${clipText}${value.slice(cursor)}`;
            onChange(newVal);
            setCursor(cursor + clipText.length);
            pushHistory(newVal);
          })
          .catch((err) => {
            console.error("クリップボードの読み取りに失敗しました", err);
          });
        break;
      case "u":
        undo();
        break;
      case "Enter":
        if (onExit) onExit();
        break;
    }

    setPendingCommand(nextPending);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursor(e.target.selectionStart || 0);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    if (ignoreSelectRef.current) return;

    // 修正: インサートモードの時（マウスでクリックして入力位置を変えたい時）以外は、
    // ブラウザの自動選択イベントによるカーソルの上書きを完全に無視する
    if (vimMode !== "insert") return;

    setCursor(e.currentTarget.selectionStart || 0);
  };

  return {
    inputRef,
    vimMode,
    handleKeyDown,
    handleChange,
    handleSelect,
  };
}
