import { useContext } from "react";
import { CheckoutContext } from "./checkoutContext";

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error("useCheckout outside provider");
  return ctx;
}
