import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useRef, useState } from "react";
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

export function useVimKeyHandler(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  ignoreSelectRef: React.RefObject<boolean>,
) {
  const [content, setContent] = useAtom(editorContentAtom);
  const [vimMode, setVimMode] = useAtom(modeAtom);
  const [cursor, setCursor] = useAtom(cursorAtom);
  const settings = useAtomValue(editorSettingsAtom);

  const deleteChar = useSetAtom(deleteCharAtom);
  const deleteLine = useSetAtom(deleteLineAtom);
  const saveHistory = useSetAtom(saveHistoryAtom);
  const undo = useSetAtom(undoAtom);
  const redo = useSetAtom(redoAtom);
  const setVisualStart = useSetAtom(visualStartAtom);
  const deleteVisualSelection = useSetAtom(deleteVisualSelectionAtom);
  const getVisualSelectionText = useSetAtom(getVisualSelectionTextAtom);
  const getLineText = useSetAtom(getLineTextAtom);
  const insertNewLineBelow = useSetAtom(insertNewLineBelowAtom);
  const insertNewLineAbove = useSetAtom(insertNewLineAboveAtom);

  const moveDown = useSetAtom(moveDownAtom);
  const moveUp = useSetAtom(moveUpAtom);
  const moveLeft = useSetAtom(moveLeftAtom);
  const moveRight = useSetAtom(moveRightAtom);
  const jumpStart = useSetAtom(jumpToLineStartAtom);
  const jumpEnd = useSetAtom(jumpToLineEndAtom);

  const [pendingCommand, setPendingCommand] = useState<string>("");
  const [insertPending, setInsertPending] = useState<string>("");

  const jkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // インサートモード用の処理
  const handleInsertMode = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    textarea: HTMLTextAreaElement | null,
  ) => {
    if (e.key === "Escape") {
      if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
      // e.preventDefaultはデフォルトの操作を止める.
      e.preventDefault();
      ignoreSelectRef.current = true; // vimモードによる変更を開始

      if (textarea) {
        const currentCursor = textarea.selectionStart;
        const currentContent = textarea.value;
        // 行の先頭（直前が改行か、0文字目）なら左に戻らない
        const isLineStart =
          currentCursor === 0 ||
          currentContent.charAt(currentCursor - 1) === "\n";
        setCursor(isLineStart ? currentCursor : Math.max(0, currentCursor - 1));
      } else {
        if (cursor > 0) setCursor(cursor - 1);
      }

      setVimMode("normal");
      saveHistory();
      setInsertPending("");
      // 直前のキーがjの時かつkが来たとき.
    } else if (e.key === "k" && insertPending === "j") {
      if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
      e.preventDefault();

      if (textarea) {
        ignoreSelectRef.current = true; // vimモードによる変更を開始
        // textarea.selectionStartは標準機能.選択カーソルの最初をかえす.
        const currentCursor = textarea.selectionStart;
        // textarea.valueは内容.
        const currentContent = textarea.value;

        if (currentContent.charAt(currentCursor - 1) === "j") {
          // currentCursor-1以降を取得した後、currentContextから始まる部分を取るとき、
          // "ABCDjEF"でjの後ろにカーソルがある,つまりEが選択中.currentCursorは5.
          // 0以上4未満を取り出し、ABCD.その後、5以上の部分を取り出し、EF.
          // 4であるjだけが消去される.
          const newText =
            currentContent.slice(0, currentCursor - 1) +
            currentContent.slice(currentCursor);
          setContent(newText);
          // nomalモードに戻るため,-2。ただし行の先頭（jの直前が改行、または0文字目）にいる場合は-1にとどめる。
          const isLineStart =
            currentCursor - 1 === 0 ||
            currentContent.charAt(currentCursor - 2) === "\n";
          setCursor(
            Math.max(0, isLineStart ? currentCursor - 1 : currentCursor - 2),
          );
        } else {
          // 行の先頭（直前が改行か、0文字目）なら左に戻らない
          const isLineStart =
            currentCursor === 0 ||
            currentContent.charAt(currentCursor - 1) === "\n";
          setCursor(
            Math.max(0, isLineStart ? currentCursor : currentCursor - 1),
          );
        }
      }

      setVimMode("normal");
      saveHistory();
      setInsertPending("");
      // jが押されたときここが実行される.
    } else if (e.key === "j") {
      if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
      setInsertPending("j");

      // 300ミリ秒後に j の保留状態を解除するタイマーをセット
      jkTimeoutRef.current = setTimeout(() => {
        setInsertPending("");
      }, 300);
    } else {
      if (jkTimeoutRef.current) clearTimeout(jkTimeoutRef.current);
      setInsertPending("");
    }
  };

  // ノーマル・ビジュアルモード用の処理
  const handleNormalVisualMode = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    e.preventDefault();
    ignoreSelectRef.current = true; // ノーマル/ビジュアルモードのキーボード操作も全てフラグで保護

    if (e.ctrlKey && e.key.toLowerCase() === "r") {
      redo();
      setPendingCommand("");
      // visualとかの時はnomalに戻す.VisualStartをnullにする処理を書かなきゃいけない.
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

    // 次のpendingCommandの状態を保持する変数。基本はリセット（空文字）.
    let nextPending = "";

    switch (e.key) {
      case "h":
        moveLeft(content);
        break;
      case "j":
        moveDown(content);
        break;
      case "k":
        moveUp(content);
        break;
      case "l":
        moveRight(content);
        break;
      case "0":
        jumpStart(content);
        break;
      case "$":
        jumpEnd(content);
        break;
      case "v":
        if (vimMode === "normal" || vimMode === "visualLine") {
          setVimMode("visual");
          setVisualStart(cursor);
        } else {
          setVimMode("normal");
          setVisualStart(null);
        }
        break;
      case "V":
        if (vimMode === "normal" || vimMode === "visual") {
          setVimMode("visualLine");
          setVisualStart(cursor);
        } else {
          setVimMode("normal");
          setVisualStart(null);
        }
        break;
      case "i":
        setVimMode("insert");
        break;
      case "a":
        setCursor(cursor + 1);
        setVimMode("insert");
        break;
      case "A":
        setVimMode("insert");
        jumpEnd(content);
        break;
      case "o":
        saveHistory();
        insertNewLineBelow();
        break;
      case "O":
        saveHistory();
        insertNewLineAbove();
        break;
      // xまたはdの時という記述.
      case "x":
      case "d":
        if (vimMode === "visual" || vimMode === "visualLine") {
          saveHistory();
          deleteVisualSelection();
          saveHistory();
        } else if (e.key === "x") {
          saveHistory();
          deleteChar();
          saveHistory();
        } else if (pendingCommand === "d") {
          saveHistory();
          deleteLine();
          saveHistory();
        } else {
          // dが1回押された時だけ、保留として状態をセットする
          nextPending = "d";
        }
        break;
      case "y":
        if (vimMode === "visual" || vimMode === "visualLine") {
          const textToCopy = getVisualSelectionText();
          if (textToCopy) navigator.clipboard.writeText(textToCopy);
        } else if (pendingCommand === "y") {
          const textToCopy = getLineText();
          if (textToCopy) navigator.clipboard.writeText(textToCopy);
        } else {
          // yが1回押された時だけ、保留として状態をセットする
          nextPending = "y";
        }
        break;
      case "p":
      case "P":
        navigator.clipboard
          .readText()
          .then((clipText) => {
            if (!clipText) return;

            saveHistory();

            // 小文字のpならカーソルの後ろ(右)、大文字のPならカーソルの前(左)
            const insertPos =
              e.key === "p" && content.length > 0 ? cursor + 1 : cursor;

            // リンター対策のため、テンプレートリテラルで結合
            const newText = `${content.slice(0, insertPos)}${clipText}${content.slice(insertPos)}`;
            setContent(newText);

            // カーソル位置はペーストした文字列の最後の文字に合わせる
            setCursor(Math.max(0, insertPos + clipText.length - 1));
            saveHistory();
          })
          .catch((err) => {
            console.error("クリップボードの読み取りに失敗しました", err);
          });
        break;
      case "u":
        undo();
        break;
      case "K":
        e.preventDefault();
        document.getElementById("memo-tag-input")?.focus();
        break;
      case "H":
        e.preventDefault();
        document.getElementById("app-sidebar")?.focus();
        break;
      default:
        break;
    }
    // switch文を抜けた後、1回だけ状態を更新する
    setPendingCommand(nextPending);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    const textarea = textareaRef.current;

    if (vimMode === "insert") {
      handleInsertMode(e, textarea);
    } else if (
      vimMode === "normal" ||
      vimMode === "visual" ||
      vimMode === "visualLine"
    ) {
      handleNormalVisualMode(e);
    }
  };

  return { handleKeyDown };
}
