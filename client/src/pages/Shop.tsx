import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  fetchBuyers,
  fetchItems,
  fetchSettings,
  postItemFeedback,
  postPurchase,
  postSupplyRequest,
  type Bestseller7d,
  type PurchaseDetail,
} from "../api";
import { groupBuyersByTag } from "../buyerGroups";
import { useCart } from "../cart";
import { useCheckout } from "../checkout";
import { useIdleReset } from "../useIdleReset";
import type { Buyer, CartLine, Item } from "../types";

const FIXED_PRODUCT_IMAGE_URL = "/images/cupramen-pro.jpg";

const RANK_BADGE_SRC: Record<1 | 2 | 3, string> = {
  1: "/images/rank/1st.svg",
  2: "/images/rank/2nd.svg",
  3: "/images/rank/3rd.svg",
};

type BuyerTier = 0 | 1 | 2;
type ItemCategory = "DRINK" | "SNACK" | "OTHER";
export type ShopLanguage = "ja" | "en";

const SHOP_CATEGORY_SECTIONS: Array<{ key: ItemCategory }> = [
  { key: "DRINK" },
  { key: "SNACK" },
  { key: "OTHER" },
];

const SHOP_TEXT = {
  ja: {
    languageLabel: "表示言語",
    switchTo: "🇺🇸 English",
    rankAlt: (rank: 1 | 2 | 3) => `売れ筋 ${rank}位`,
    soldOut: "売り切れ",
    stockCap: "在庫上限",
    stockLeft: (stock: number) => `残 ${stock}`,
    loadItemsError: "商品を読み込めませんでした",
    stockWarning: "在庫が不足していました。内容を確認して再度お試しください。",
    header: {
      about: "紹介",
      supplyRequest: "仕入依頼",
      feedback: "フィードバック",
      doneDebug: "完了デバッグ",
      admin: "管理者ログイン",
    },
    flow: {
      aria: "購入の流れ",
      cart: "商品・カート",
      checkout: "購入・お支払い",
    },
    categories: {
      DRINK: { title: "ドリンク", empty: "現在このカテゴリの商品はありません。" },
      SNACK: { title: "お菓子", empty: "現在このカテゴリの商品はありません。" },
      OTHER: { title: "その他", empty: "現在このカテゴリの商品はありません。" },
    },
    bestsellers: "売れ筋（過去7日・販売個数 Top3）",
    itemList: "販売一覧",
    noOtherItems: "上記の Top3 以外に表示する販売中商品はありません。",
    cart: {
      title: "カート",
      hint: "商品をタップしてカートに追加してください",
      total: "合計",
      count: (count: number) => `${count} 点`,
      next: "決済に進む",
      back: "カートへ戻る",
      complete: "購入を完了する",
      decrease: "減らす",
      increase: "増やす",
      remove: "削除",
    },
    feedback: {
      like: "高評価",
      restock: "再入荷リクエスト",
      likeOk: (name: string) => `「${name}」に高評価しました`,
      likeError: "高評価の送信に失敗しました",
      restockBody: (name: string) => `${name}を再入荷してほしいです`,
      restockOk: (name: string) => `「${name}」の再入荷をリクエストしました`,
      restockError: "再入荷リクエストの送信に失敗しました",
    },
    checkout: {
      buyerTitle: "購入者（任意）",
      anonymous: "匿名で進む",
      frequentBuyers: "よく購入する人（過去7日）",
      allBuyers: "すべての購入者",
      paymentTitle: "お支払い方法",
      cash: "現金",
      paymentPlaceholder: "支払い方法を選択すると、ここに案内が表示されます。",
      paymentWarn: "支払い方法を選択してください。",
      submitError: "登録に失敗しました。もう一度お試しください。",
    },
    confirm: {
      title: "購入を確定しますか？",
      total: (total: number) => `合計金額: ¥${total.toLocaleString()}`,
      cancel: "キャンセル",
      ok: "確定する",
    },
  },
  en: {
    languageLabel: "Language",
    switchTo: "🇯🇵 日本語",
    rankAlt: (rank: 1 | 2 | 3) => `Top seller rank ${rank}`,
    soldOut: "Sold out",
    stockCap: "Limit reached",
    stockLeft: (stock: number) => `${stock} left`,
    loadItemsError: "Could not load items.",
    stockWarning: "Some items were out of stock. Please check your cart and try again.",
    header: {
      about: "About",
      supplyRequest: "Request Item",
      feedback: "Feedback",
      doneDebug: "Done Debug",
      admin: "Admin Login",
    },
    flow: {
      aria: "Purchase steps",
      cart: "Items / Cart",
      checkout: "Checkout / Payment",
    },
    categories: {
      DRINK: { title: "Drinks", empty: "No items in this category right now." },
      SNACK: { title: "Snacks", empty: "No items in this category right now." },
      OTHER: { title: "Other", empty: "No items in this category right now." },
    },
    bestsellers: "Top sellers (last 7 days / Top 3)",
    itemList: "Items",
    noOtherItems: "There are no active items other than the Top 3 above.",
    cart: {
      title: "Cart",
      hint: "Tap an item to add it to your cart.",
      total: "Total",
      count: (count: number) => `${count} item${count === 1 ? "" : "s"}`,
      next: "Proceed to Payment",
      back: "Back to Cart",
      complete: "Complete Purchase",
      decrease: "Decrease",
      increase: "Increase",
      remove: "Remove",
    },
    feedback: {
      like: "Like",
      restock: "Restock Request",
      likeOk: (name: string) => `Liked "${name}".`,
      likeError: "Could not send like.",
      restockBody: (name: string) => `Please restock ${name}.`,
      restockOk: (name: string) => `Requested restock for "${name}".`,
      restockError: "Could not send restock request.",
    },
    checkout: {
      buyerTitle: "Buyer (optional)",
      anonymous: "Continue Anonymously",
      frequentBuyers: "Frequent buyers (last 7 days)",
      allBuyers: "All Buyers",
      paymentTitle: "Payment Method",
      cash: "Cash",
      paymentPlaceholder: "Select a payment method to see instructions here.",
      paymentWarn: "Please select a payment method.",
      submitError: "Could not record the purchase. Please try again.",
    },
    confirm: {
      title: "Confirm purchase?",
      total: (total: number) => `Total: ¥${total.toLocaleString()}`,
      cancel: "Cancel",
      ok: "Confirm",
    },
  },
} as const;

const DONE_DEBUG_PURCHASE: PurchaseDetail = {
  purchaseId: "debug-purchase",
  purchasedAt: "2026-04-26T00:00:00.000Z",
  totalPrice: 780,
  paymentMethod: "PAYPAY",
  buyerType: "NAMED",
  buyerId: "debug-buyer-1",
  buyerName: "デバッグ太郎",
  terminalId: "DEBUG-TERM",
  status: "COMPLETED",
  items: [
    { itemId: "debug-item-1", name: "コーヒー", quantity: 1, unitPrice: 180, subtotal: 180 },
    { itemId: "debug-item-2", name: "カレー", quantity: 1, unitPrice: 600, subtotal: 600 },
  ],
};

function ShopProductCard({
  item: it,
  lines,
  onAdd,
  rank,
  text,
}: {
  item: Item;
  lines: CartLine[];
  onAdd: (item: { itemId: string; name: string; price: number; stock: number }) => void;
  rank?: 1 | 2 | 3;
  text: (typeof SHOP_TEXT)[ShopLanguage];
}) {
  const soldOut = it.stock <= 0;
  const inCart = lines.find((l) => l.itemId === it.itemId)?.quantity ?? 0;
  const atStockLimit = !soldOut && inCart >= it.stock;
  return (
    <button
      type="button"
      className={`product-card ${soldOut ? "soldout" : ""} ${atStockLimit ? "at-cap" : ""}`}
      disabled={soldOut || atStockLimit}
      onClick={() => {
        if (soldOut || atStockLimit) return;
        onAdd({ itemId: it.itemId, name: it.name, price: it.price, stock: it.stock });
      }}
    >
      <div className={`product-thumb ${rank != null ? "has-rank-badge" : ""}`}>
        {rank != null && (
          <img
            className="product-rank-badge"
            src={RANK_BADGE_SRC[rank]}
            alt={text.rankAlt(rank)}
            width={44}
            height={44}
            decoding="async"
          />
        )}
        <img src={it.imageUrl ?? FIXED_PRODUCT_IMAGE_URL} alt={it.name} />
      </div>
      <div className="product-meta">
        <div className="name">{it.name}</div>
        <div className="sub">
          <span>¥{it.price}</span>
          {soldOut ? (
            <span className="stock zero">{text.soldOut}</span>
          ) : atStockLimit ? (
            <span className="stock at-cap-label">{text.stockCap}</span>
          ) : (
            <span className="stock">{text.stockLeft(it.stock)}</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function Shop({
  onIdleReset,
  language,
  onLanguageChange,
  onPurchaseLanguageReset,
}: {
  onIdleReset: () => void;
  language: ShopLanguage;
  onLanguageChange: (language: ShopLanguage) => void;
  onPurchaseLanguageReset: () => void;
}) {
  const navigate = useNavigate();
  const { addItem, totalCount, totalPrice, lines, setQuantity, removeLine, clear: clearCart } = useCart();
  const { buyerType, buyerId, paymentMethod, setBuyer, setPayment, reset: resetCheckout } = useCheckout();
  const location = useLocation();
  const stockWarning = Boolean((location.state as { stockWarning?: boolean } | null)?.stockWarning);
  const [items, setItems] = useState<Item[]>([]);
  const [bestsellers7d, setBestsellers7d] = useState<Bestseller7d[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [heavyBuyers, setHeavyBuyers] = useState<Buyer[]>([]);
  const [weeklyBuyerUsage, setWeeklyBuyerUsage] = useState<Array<{ buyerId: string; purchaseCount: number; rank: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"cart" | "checkout">("cart");
  const [paypayText, setPaypayText] = useState("");
  const [cashText, setCashText] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [paymentWarn, setPaymentWarn] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedbackMessageByItem, setFeedbackMessageByItem] = useState<Record<string, string>>({});
  const text = SHOP_TEXT[language];

  useIdleReset(true, onIdleReset);

  useEffect(() => {
    fetchItems()
      .then((r) => {
        setItems(r.items);
        setBestsellers7d(r.bestsellers7d);
      })
      .catch(() => setError(text.loadItemsError));
  }, [text.loadItemsError]);

  const bestsellerItemList = useMemo(() => {
    return bestsellers7d
      .map((b) => {
        const item = items.find((i) => i.itemId === b.itemId);
        if (!item) return null;
        const rank = b.rank as 1 | 2 | 3;
        return { item, rank };
      })
      .filter((x): x is { item: Item; rank: 1 | 2 | 3 } => x != null);
  }, [bestsellers7d, items]);

  const restItems = useMemo(() => {
    const ids = new Set(bestsellers7d.map((b) => b.itemId));
    return items.filter((i) => !ids.has(i.itemId));
  }, [items, bestsellers7d]);

  const groupedRestItems = useMemo(() => {
    const grouped: Record<ItemCategory, Item[]> = { DRINK: [], SNACK: [], OTHER: [] };
    for (const item of restItems) {
      const key = item.category ?? "OTHER";
      grouped[key].push(item);
    }
    return grouped;
  }, [restItems]);

  useEffect(() => {
    fetchBuyers()
      .then((r) => {
        setBuyers(r.buyers);
        setHeavyBuyers(r.heavyBuyers ?? []);
        setWeeklyBuyerUsage(r.weeklyBuyerUsage ?? []);
      })
      .catch(() => {
        // Ignore buyer list failures: payment can proceed anonymously.
      });
    fetchSettings().then((s) => {
      setPaypayText(s.paypayInstruction);
      setCashText(s.cashInstruction);
      setTerminalId(s.terminalId);
    });
  }, []);

  useEffect(() => {
    if (totalCount === 0) {
      setMode("cart");
    }
  }, [totalCount]);

  const instruction = paymentMethod === "PAYPAY" ? paypayText : paymentMethod === "CASH" ? cashText : "";
  const checkoutFocus: "buyer" | "payment" | "complete" =
    buyerType == null ? "buyer" : paymentMethod ? "complete" : "payment";
  const groupedOtherBuyers = groupBuyersByTag(buyers);
  const compactBuyerName = (name: string) => name.replace(/[ \u3000]/g, "").slice(0, 5);
  const buyerTierById = useMemo(() => {
    const tierMap = new Map<string, BuyerTier>();
    for (const row of weeklyBuyerUsage) {
      if (row.rank === 1) {
        tierMap.set(row.buyerId, 2);
      } else if (row.rank === 2 || row.rank === 3) {
        tierMap.set(row.buyerId, 1);
      }
    }
    return tierMap;
  }, [weeklyBuyerUsage]);
  const buyerTierClass = (buyer: Buyer) => `tier-${buyerTierById.get(buyer.buyerId) ?? 0}`;

  const complete = async () => {
    if (!paymentMethod) return;
    const bt = buyerType ?? "ANONYMOUS";
    setSubmitting(true);
    setStockError(null);
    setPaymentWarn(null);
    try {
      const { purchase } = await postPurchase({
        lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
        paymentMethod,
        buyerType: bt,
        buyerId: bt === "NAMED" ? buyerId : null,
        terminalId,
      });
      navigate("/done", { replace: true, state: { purchase } satisfies { purchase: PurchaseDetail } });
      queueMicrotask(() => {
        clearCart();
        resetCheckout();
        onPurchaseLanguageReset();
        setMode("cart");
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "INSUFFICIENT_STOCK") {
        clearCart();
        resetCheckout();
        onPurchaseLanguageReset();
        setMode("cart");
        navigate("/", { replace: true, state: { stockWarning: true } });
      } else {
        setStockError(text.checkout.submitError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteClick = () => {
    if (submitting) return;
    if (!paymentMethod) {
      setPaymentWarn(text.checkout.paymentWarn);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmComplete = () => {
    if (submitting) return;
    setConfirmOpen(false);
    void complete();
  };

  const showFeedbackMessage = (itemId: string, message: string) => {
    setFeedbackMessageByItem((prev) => ({ ...prev, [itemId]: message }));
    window.setTimeout(() => {
      setFeedbackMessageByItem((prev) => {
        if (prev[itemId] !== message) return prev;
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }, 3500);
  };

  const handleLike = async (item: { itemId: string; name: string }) => {
    try {
      await postItemFeedback({ itemId: item.itemId, feedbackType: "LIKE", source: "pos" });
      showFeedbackMessage(item.itemId, text.feedback.likeOk(item.name));
    } catch {
      showFeedbackMessage(item.itemId, text.feedback.likeError);
    }
  };

  const handleRestockRequest = async (item: { itemId: string; name: string }) => {
    try {
      await postSupplyRequest({
        body: text.feedback.restockBody(item.name),
        requesterName: "POS端末",
        source: "pos",
      });
      showFeedbackMessage(item.itemId, text.feedback.restockOk(item.name));
    } catch {
      showFeedbackMessage(item.itemId, text.feedback.restockError);
    }
  };

  const goToCartStep = () => {
    setMode("cart");
  };

  return (
    <div className="page shop">
      <header className="topbar shop-topbar">
        <button type="button" className="shop-title-btn" onClick={goToCartStep}>
          <img className="shop-title-logo" src="/images/shimojocafe.png" alt="シモジョーカフェ" />
        </button>
        <div className="shop-header-links">
          <Link to="/about" className="shop-header-link">
            {text.header.about}
          </Link>
          <Link to="/supply-request" className="shop-header-link">
            {text.header.supplyRequest}
          </Link>
          <Link to="/feedback" className="shop-header-link">
            {text.header.feedback}
          </Link>
          <button
            type="button"
            className="shop-header-link shop-language-switch"
            aria-label={text.languageLabel}
            onClick={() => onLanguageChange(language === "ja" ? "en" : "ja")}
          >
            {text.switchTo}
          </button>
          {import.meta.env.DEV && (
            <Link to="/done" state={{ purchase: DONE_DEBUG_PURCHASE }} className="shop-header-link">
              {text.header.doneDebug}
            </Link>
          )}
        </div>
      </header>

      {stockWarning && <p className="banner error">{text.stockWarning}</p>}
      {error && <p className="banner error">{error}</p>}

      <nav className="shop-flow-steps" aria-label={text.flow.aria}>
        <ol className="shop-flow-steps-list">
          <li
            className="shop-flow-step"
            data-state={mode === "cart" ? "current" : "done"}
            aria-current={mode === "cart" ? "step" : undefined}
          >
            <button type="button" className="shop-flow-step-btn" onClick={goToCartStep}>
              <span className="shop-flow-step-num">1</span>
              <span className="shop-flow-step-label">{text.flow.cart}</span>
            </button>
          </li>
          <li
            className="shop-flow-step"
            data-state={mode === "checkout" ? "current" : "upcoming"}
            aria-current={mode === "checkout" ? "step" : undefined}
          >
            <button
              type="button"
              className="shop-flow-step-btn"
              disabled={totalCount === 0}
              onClick={() => {
                if (totalCount === 0) return;
                setStockError(null);
                setPaymentWarn(null);
                setMode("checkout");
              }}
            >
              <span className="shop-flow-step-num">2</span>
              <span className="shop-flow-step-label">{text.flow.checkout}</span>
            </button>
          </li>
        </ol>
      </nav>

      {mode === "cart" ? (
        <div className="shop-workspace">
          <section className="shop-products-panel">
            {bestsellerItemList.length > 0 && (
              <div className="shop-bestsellers-block">
                <h3 className="shop-bestsellers-heading">{text.bestsellers}</h3>
                <div className="shop-bestseller-grid">
                  {bestsellerItemList.map(({ item: it, rank }) => (
                    <ShopProductCard
                      key={`hit-${it.itemId}`}
                      item={it}
                      lines={lines}
                      rank={rank}
                      text={text}
                      onAdd={addItem}
                    />
                  ))}
                </div>
              </div>
            )}
            <h2 className="shop-panel-title shop-products-panel-title">{text.itemList}</h2>
            <div className="shop-scroll">
              {restItems.length === 0 && bestsellerItemList.length > 0 ? (
                <p className="muted" style={{ margin: "0 0 0.5rem" }}>
                  {text.noOtherItems}
                </p>
              ) : null}
              <div className="shop-category-sections">
                {SHOP_CATEGORY_SECTIONS.map((section) => (
                  <section key={section.key} className="shop-category-block">
                    <header className="shop-category-header">
                      <h3 className="shop-category-title">{text.categories[section.key].title}</h3>
                      <p className="shop-category-subtitle" />
                    </header>
                    {groupedRestItems[section.key].length === 0 ? (
                      <p className="muted shop-category-empty">{text.categories[section.key].empty}</p>
                    ) : (
                      <div className="grid products">
                        {groupedRestItems[section.key].map((it) => (
                          <ShopProductCard key={it.itemId} item={it} lines={lines} text={text} onAdd={addItem} />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </section>

          <aside className="shop-cart-panel" aria-live="polite">
            <div className="shop-dock-inner">
              <h2 className="shop-panel-title">{text.cart.title}</h2>
              <div className="shop-dock-body">
                {lines.length === 0 ? (
                  <p className="shop-dock-hint">{text.cart.hint}</p>
                ) : (
                  <ul className="shop-dock-lines">
                    {lines.map((l) => (
                      <li key={l.itemId} className="shop-dock-line">
                        <div className="shop-dock-line-info">
                          <span className="shop-dock-name">{l.name}</span>
                          <span className="shop-dock-sub">¥{l.price}</span>
                        </div>
                        <div className="shop-dock-controls">
                          <button
                            type="button"
                            className="dock-step"
                            aria-label={text.cart.decrease}
                            onClick={() => setQuantity(l.itemId, l.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="dock-qty">{l.quantity}</span>
                          <button
                            type="button"
                            className="dock-step"
                            aria-label={text.cart.increase}
                            disabled={l.quantity >= l.stock}
                            onClick={() => setQuantity(l.itemId, l.quantity + 1)}
                          >
                            +
                          </button>
                          <span className="dock-line-total">¥{(l.price * l.quantity).toLocaleString()}</span>
                          <button type="button" className="dock-remove" onClick={() => removeLine(l.itemId)}>
                            {text.cart.remove}
                          </button>
                        </div>
                        <div className="shop-feedback-actions">
                          <button type="button" className="shop-feedback-btn" onClick={() => void handleLike(l)}>
                            {text.feedback.like}
                          </button>
                          <button
                            type="button"
                            className="shop-feedback-btn secondary"
                            onClick={() => void handleRestockRequest(l)}
                          >
                            {text.feedback.restock}
                          </button>
                        </div>
                        {feedbackMessageByItem[l.itemId] && (
                          <p className="shop-feedback-message">{feedbackMessageByItem[l.itemId]}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="shop-dock-footer">
                <div className="shop-dock-total">
                  <span className="shop-dock-total-label">{text.cart.total}</span>
                  <div className="shop-dock-total-right">
                    {totalCount > 0 && <span className="shop-dock-count">{text.cart.count(totalCount)}</span>}
                    <span className="shop-dock-total-num">¥{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn primary large shop-dock-next ${totalCount === 0 ? "disabled" : ""}`}
                  onClick={() => {
                    if (totalCount === 0) return;
                    setStockError(null);
                    setPaymentWarn(null);
                    setMode("checkout");
                  }}
                >
                  {text.cart.next}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="shop-workspace" data-checkout-focus={checkoutFocus}>
          <section className={`shop-products-panel shop-checkout-stage ${checkoutFocus === "complete" ? "checkout-panel-dimmed" : ""}`}>
            {stockError && <p className="banner error">{stockError}</p>}
            {paymentWarn && <p className="banner error">{paymentWarn}</p>}
            <div className="shop-checkout-body">
              <section
                className={`instruction shop-checkout-buyers ${
                  checkoutFocus === "buyer"
                    ? "checkout-panel-focus"
                    : checkoutFocus === "payment"
                      ? "checkout-panel-dimmed"
                      : ""
                }`}
              >
                <div className="shop-checkout-buyer-head">
                  <h2>{text.checkout.buyerTitle}</h2>
                  <button
                    type="button"
                    className={`btn secondary ${buyerType === "ANONYMOUS" ? "selected-anonymous" : ""}`}
                    onClick={() => {
                      flushSync(() => {
                        setBuyer("ANONYMOUS", null);
                      });
                      setPaymentWarn(null);
                    }}
                  >
                    {text.checkout.anonymous}
                  </button>
                </div>
                <div className="shop-buyer-scroll">
                  {heavyBuyers.length > 0 && (
                    <>
                      <p className="muted buyer-subhead">{text.checkout.frequentBuyers}</p>
                      <div className="grid buyers shop-buyer-grid-inline shop-buyer-heavy-grid">
                        {heavyBuyers.map((b) => (
                          <button
                            key={b.buyerId}
                            type="button"
                            className={`buyer-card ${buyerTierClass(b)} ${buyerType === "NAMED" && buyerId === b.buyerId ? "selected" : ""}`}
                            title={b.name}
                            onClick={() => {
                              flushSync(() => {
                                setBuyer("NAMED", b.buyerId);
                              });
                              setPaymentWarn(null);
                            }}
                          >
                            <div className="name">{compactBuyerName(b.name)}</div>
                          </button>
                        ))}
                      </div>
                      <p className="muted buyer-subhead">{text.checkout.allBuyers}</p>
                    </>
                  )}
                  {groupedOtherBuyers.map((group) => (
                    <section key={group.tag}>
                      <p className="muted buyer-subhead">{group.tag}</p>
                      <div className="grid buyers shop-buyer-grid-inline">
                        {group.buyers.map((b) => (
                          <button
                            key={b.buyerId}
                            type="button"
                            className={`buyer-card ${buyerTierClass(b)} ${buyerType === "NAMED" && buyerId === b.buyerId ? "selected" : ""}`}
                            title={b.name}
                            onClick={() => {
                              flushSync(() => {
                                setBuyer("NAMED", b.buyerId);
                              });
                              setPaymentWarn(null);
                            }}
                          >
                            <div className="name">{compactBuyerName(b.name)}</div>
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
              <section
                className={`instruction shop-checkout-payment ${
                  checkoutFocus === "payment" ? "checkout-panel-focus" : checkoutFocus === "buyer" ? "checkout-panel-dimmed" : ""
                }`}
              >
                <h2>{text.checkout.paymentTitle}</h2>
                <div className="pay-grid buyer-pay-grid">
                  <button
                    type="button"
                    className={`btn huge ${paymentMethod === "PAYPAY" ? "primary" : "secondary"}`}
                    onClick={() => {
                      setPayment("PAYPAY");
                      setPaymentWarn(null);
                    }}
                  >
                    PayPay
                  </button>
                  <button
                    type="button"
                    className={`btn huge ${paymentMethod === "CASH" ? "primary" : "secondary"}`}
                    onClick={() => {
                      setPayment("CASH");
                      setPaymentWarn(null);
                    }}
                  >
                    {text.checkout.cash}
                  </button>
                </div>
                <p className={`instruction-body ${paymentMethod ? "" : "instruction-placeholder"}`}>
                  {paymentMethod ? instruction : text.checkout.paymentPlaceholder}
                </p>
              </section>
            </div>
          </section>

          <aside
            className={`shop-cart-panel shop-checkout-side ${
              checkoutFocus === "complete" ? "checkout-panel-focus" : "checkout-panel-dimmed"
            }`}
            aria-live="polite"
          >
            <div className="shop-dock-inner">
              <h2 className="shop-panel-title">{text.cart.title}</h2>
              <div className="shop-dock-body">
                <ul className="shop-dock-lines">
                  {lines.map((l) => (
                    <li key={l.itemId} className="shop-dock-line">
                      <div className="shop-dock-line-info">
                        <span className="shop-dock-name">{l.name}</span>
                        <span className="shop-dock-sub">¥{l.price}</span>
                      </div>
                      <div className="shop-dock-controls">
                        <button type="button" className="dock-step dock-step-placeholder" aria-hidden="true" tabIndex={-1}>
                          −
                        </button>
                        <span className="dock-qty">{l.quantity}</span>
                        <button type="button" className="dock-step dock-step-placeholder" aria-hidden="true" tabIndex={-1}>
                          +
                        </button>
                        <span className="dock-line-total">¥{(l.price * l.quantity).toLocaleString()}</span>
                        <button
                          type="button"
                          className="dock-remove dock-remove-placeholder"
                          aria-hidden="true"
                          tabIndex={-1}
                        >
                          {text.cart.remove}
                        </button>
                      </div>
                      <div className="shop-feedback-actions">
                        <button type="button" className="shop-feedback-btn" onClick={() => void handleLike(l)}>
                          {text.feedback.like}
                        </button>
                        <button
                          type="button"
                          className="shop-feedback-btn secondary"
                          onClick={() => void handleRestockRequest(l)}
                        >
                          {text.feedback.restock}
                        </button>
                      </div>
                      {feedbackMessageByItem[l.itemId] && (
                        <p className="shop-feedback-message">{feedbackMessageByItem[l.itemId]}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shop-dock-footer">
                <div className="shop-dock-total">
                  <span className="shop-dock-total-label">{text.cart.total}</span>
                  <div className="shop-dock-total-right">
                    {totalCount > 0 && <span className="shop-dock-count">{text.cart.count(totalCount)}</span>}
                    <span className="shop-dock-total-num">¥{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
                <div className="shop-checkout-actions shop-checkout-actions-side">
                  <button
                    type="button"
                    className="btn secondary large"
                    onClick={goToCartStep}
                  >
                    {text.cart.back}
                  </button>
                  <button
                    type="button"
                    className={`btn large ${paymentMethod ? "primary" : "payment-disabled"}`}
                    disabled={submitting}
                    onClick={handleCompleteClick}
                  >
                    {text.cart.complete}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="shop-admin-entry">
        <Link to="/admin/login" className="shop-admin-link" aria-label={text.header.admin}>
          {text.header.admin}
        </Link>
      </div>

      {confirmOpen && (
        <div className="confirm-overlay" role="presentation" onClick={() => setConfirmOpen(false)}>
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="purchase-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="purchase-confirm-title">{text.confirm.title}</h2>
            <p className="muted">{text.confirm.total(totalPrice)}</p>
            <div className="confirm-actions">
              <button type="button" className="btn secondary" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                {text.confirm.cancel}
              </button>
              <button type="button" className="btn primary" onClick={confirmComplete} disabled={submitting}>
                {text.confirm.ok}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
