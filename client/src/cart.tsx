import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CartContext } from "./cartContext";
import type { CartLine } from "./types";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((item: { itemId: string; name: string; price: number; stock: number }) => {
    const cap = Math.max(0, Math.floor(item.stock));
    if (cap <= 0) return;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.itemId === item.itemId);
      if (i >= 0) {
        const cur = prev[i];
        const next = [...prev];
        const nextQty = Math.min(Math.min(cur.quantity, cap) + 1, cap);
        if (nextQty === cur.quantity && cap === cur.stock) return prev;
        next[i] = {
          ...cur,
          stock: cap,
          quantity: nextQty,
        };
        return next;
      }
      return [...prev, { ...item, quantity: 1, stock: cap }];
    });
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setLines((prev) => {
      const q = Math.floor(quantity);
      if (q <= 0) return prev.filter((l) => l.itemId !== itemId);
      return prev.map((l) => {
        if (l.itemId !== itemId) return l;
        const capped = Math.min(q, Math.max(0, l.stock));
        if (capped <= 0) return l;
        return { ...l, quantity: capped };
      });
    });
  }, []);

  const removeLine = useCallback((itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totalCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const totalPrice = useMemo(() => lines.reduce((s, l) => s + l.price * l.quantity, 0), [lines]);

  const value = useMemo(
    () => ({
      lines,
      addItem,
      setQuantity,
      removeLine,
      clear,
      totalCount,
      totalPrice,
    }),
    [lines, addItem, setQuantity, removeLine, clear, totalCount, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
