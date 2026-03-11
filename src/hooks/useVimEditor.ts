import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
  cursorAtom,
  deleteCharAtom,
  deleteLineAtom,
  deleteVisualSelectionAtom,
  editorContentAtom,
  editorSettingsAtom,
  getLineEnd,
  getLineStart,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (settings.type === "standard") return;

    const textarea = textareaRef.current;

    if (vimMode === "insert") {
      if (e.key === "Escape") {
        // e.preventDefaultはデフォルトの操作を止める.
        e.preventDefault();
        ignoreSelectRef.current = true; // vimモードによる変更を開始

        setVimMode("normal");
        saveHistory();
        setInsertPending("");
        if (cursor > 0) setCursor(cursor - 1);
        // 直前のキーがjの時かつkが来たとき.
      } else if (e.key === "k" && insertPending === "j") {
        e.preventDefault();

        if (textarea) {
          ignoreSelectRef.current = true; // vimモードによる変更を開始
          // textarea.selectionStartは標準機能.選択カーソルの最初をかえす.
          const currentCursor = textarea.selectionStart;
          // textarea.valueは内容.
          const currentContent = textarea.value;
          // if文の中身が分かってないのかも.
          if (currentContent.charAt(currentCursor - 1) === "j") {
            // currentCursor-1以降を取得した後、currentContextから始まる部分を取るとき、
            // "ABCDjEF"でjの後ろにカーソルがある,つまりEが選択中.currentCursorは5.
            // 0以上4未満を取り出し、ABCD.その後、5以上の部分を取り出し、EF.
            // 4であるjだけが消去される.
            const newText =
              currentContent.slice(0, currentCursor - 1) +
              currentContent.slice(currentCursor);
            setContent(newText);
            // nomalモードに戻るため,-2.
            setCursor(Math.max(0, currentCursor - 2));
          } else {
            setCursor(Math.max(0, currentCursor - 1));
          }
        }

        setVimMode("normal");
        saveHistory();
        setInsertPending("");
        // jが押されたときここが実行される.
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
          navigator.clipboard
            .readText()
            .then((clipText) => {
              if (!clipText) return;

              saveHistory();
              // リンター対策のため、テンプレートリテラルで結合
              const newText = `${content.slice(0, cursor)}${clipText}${content.slice(cursor)}`;
              setContent(newText);
              setCursor(cursor + clipText.length);
              saveHistory();
            })
            .catch((err) => {
              console.error("クリップボードの読み取りに失敗しました", err);
            });
          break;
        case "u":
          undo();
          break;
        default:
          break;
      }
      // switch文を抜けた後、1回だけ状態を更新する
      setPendingCommand(nextPending);
    }
  };

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
