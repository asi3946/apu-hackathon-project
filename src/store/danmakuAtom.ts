import { atom } from "jotai";
import type { Danmaku, DanmakuType } from "@/types/editor";

// 画面に表示中の弾幕リスト
export const activeDanmakusAtom = atom<Danmaku[]>([]);

// 弾幕の追加アクション（書き込み専用）
export const addDanmakuActionAtom = atom(
  null,
  (
    get,
    set,
    payloads: { text: string; type: DanmakuType; sourceMemoId?: string }[],
  ) => {
    const current = get(activeDanmakusAtom);

    const newDanmakus: Danmaku[] = payloads.map((p) => ({
      id: crypto.randomUUID(),
      text: p.text,
      type: p.type,
      sourceMemoId: p.sourceMemoId,
      top: Math.floor(Math.random() * 70) + 10,
      speed: Math.floor(Math.random() * 5) + 6,
    }));

    set(activeDanmakusAtom, [...current, ...newDanmakus]);
  },
);

// 流れ終わった弾幕を削除するアクション
export const removeDanmakuActionAtom = atom(null, (get, set, id: string) => {
  const current = get(activeDanmakusAtom);
  set(
    activeDanmakusAtom,
    current.filter((d) => d.id !== id),
  );
});
