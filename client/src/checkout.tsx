import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CheckoutContext } from "./checkoutContext";

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [buyerType, setBuyerType] = useState<"NAMED" | "ANONYMOUS" | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PAYPAY" | "CASH" | null>(null);

  const setBuyer = useCallback((type: "NAMED" | "ANONYMOUS", id: string | null) => {
    setBuyerType(type);
    setBuyerId(type === "NAMED" ? id : null);
  }, []);

  const reset = useCallback(() => {
    setBuyerType(null);
    setBuyerId(null);
    setPaymentMethod(null);
  }, []);

  const value = useMemo(
    () => ({
      buyerType,
      buyerId,
      paymentMethod,
      setBuyer,
      setPayment: setPaymentMethod,
      reset,
    }),
    [buyerType, buyerId, paymentMethod, setBuyer, reset]
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}
