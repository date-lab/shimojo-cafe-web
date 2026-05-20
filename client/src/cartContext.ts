import { createContext } from "react";
import type { CartLine } from "./types";

export type CartContextValue = {
  lines: CartLine[];
  addItem: (item: { itemId: string; name: string; price: number; stock: number }) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  removeLine: (itemId: string) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
};

export const CartContext = createContext<CartContextValue | null>(null);
