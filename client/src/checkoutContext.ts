import { createContext } from "react";

export type CheckoutState = {
  buyerType: "NAMED" | "ANONYMOUS" | null;
  buyerId: string | null;
  paymentMethod: "PAYPAY" | "CASH" | null;
  setBuyer: (type: "NAMED" | "ANONYMOUS", buyerId: string | null) => void;
  setPayment: (m: "PAYPAY" | "CASH" | null) => void;
  reset: () => void;
};

export const CheckoutContext = createContext<CheckoutState | null>(null);
