import { useEffect, useState } from "react";
import {
  adminCancelPurchase,
  adminDeletePurchase,
  adminPurchaseExportRows,
  adminPurchases,
  adminStats,
  type AdminStatsPreset,
} from "../../api";

const PAGE_SIZE = 20;

type CsvValue = string | number | null | undefined;

const statsPresetLabels: Record<AdminStatsPreset, string> = {
  all: "全期間",
  today: "今日（日本時間）",
  "7": "直近7日",
  "30": "直近30日",
};

function csvCell(value: CsvValue) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, rows: CsvValue[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function formatDateTimeJst(value: string) {
  return new Date(value).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
}

function formatDateJst(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function formatTimeJst(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function AdminHistory() {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Awaited<ReturnType<typeof adminPurchases>>["purchases"]>(
    []
  );
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminStats>>["stats"] | null>(null);
  const [statsPreset, setStatsPreset] = useState<AdminStatsPreset>("all");
  const [error, setError] = useState<string | null>(null);
  const [workingPurchaseId, setWorkingPurchaseId] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState<"history" | "stats" | null>(null);

  const statsPeriodCaption = (() => {
    switch (statsPreset) {
      case "all":
        return "全期間の完了済み購入を対象にしています（キャンセルは含みません）。";
      case "today":
        return "今日（日本時間）の完了済み購入を対象にしています（キャンセルは含みません）。";
      case "7":
        return "直近7日の完了済み購入を対象にしています（キャンセルは含みません）。";
      case "30":
        return "直近30日の完了済み購入を対象にしています（キャンセルは含みません）。";
      default:
        return "";
    }
  })();

  const reload = async () => {
    const [p, s] = await Promise.all([adminPurchases(PAGE_SIZE, page * PAGE_SIZE), adminStats(statsPreset)]);
    if (p.purchases.length === 0 && p.total > 0 && page > 0) {
      setPage((prev) => Math.max(0, prev - 1));
      return;
    }
    setPurchases(p.purchases);
    setTotal(p.total);
    setStats(s.stats);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([adminPurchases(PAGE_SIZE, page * PAGE_SIZE), adminStats(statsPreset)])
      .then(([p, s]) => {
        setPurchases(p.purchases);
        setTotal(p.total);
        setStats(s.stats);
      })
      .catch(() => setError("読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [page, statsPreset]);

  const cancelPurchase = async (purchaseId: string) => {
    setError(null);
    setWorkingPurchaseId(purchaseId);
    try {
      await adminCancelPurchase(purchaseId);
      await reload();
      window.dispatchEvent(new Event("analytics:refresh"));
    } catch {
      setError("キャンセルに失敗しました");
    } finally {
      setWorkingPurchaseId(null);
    }
  };

  const removePurchase = async (purchaseId: string) => {
    if (!window.confirm("この購入履歴を削除します。取り消せません。よろしいですか？")) return;
    setError(null);
    setWorkingPurchaseId(purchaseId);
    try {
      await adminDeletePurchase(purchaseId);
      await reload();
      window.dispatchEvent(new Event("analytics:refresh"));
    } catch {
      setError("履歴の削除に失敗しました");
    } finally {
      setWorkingPurchaseId(null);
    }
  };

  const exportHistoryCsv = async () => {
    setError(null);
    setExportingCsv("history");
    try {
      const { rows: exportRows } = await adminPurchaseExportRows();

      const rows: CsvValue[][] = [
        [
          "購入ID",
          "購入明細ID",
          "購入日時(日本時間)",
          "購入日(日本時間)",
          "購入時刻(日本時間)",
          "購入日時(ISO)",
          "状態",
          "支払方法",
          "端末ID",
          "購入合計",
          "購入者種別",
          "購入者ID",
          "購入者コード",
          "購入者名",
          "購入者所属",
          "購入者表示中",
          "商品ID",
          "商品コード",
          "商品名",
          "商品カテゴリ",
          "数量",
          "購入時単価",
          "小計",
          "商品現在価格",
          "商品原価",
          "商品現在在庫",
          "商品表示中",
        ],
      ];

      for (const row of exportRows) {
        rows.push([
          row.purchaseId,
          row.purchaseItemId,
          formatDateTimeJst(row.purchasedAt),
          formatDateJst(row.purchasedAt),
          formatTimeJst(row.purchasedAt),
          row.purchasedAt,
          row.status === "CANCELED" ? "キャンセル済み" : "完了",
          row.paymentMethod,
          row.terminalId,
          row.totalPrice,
          row.buyerType === "ANONYMOUS" ? "匿名" : "記名",
          row.buyerId,
          row.buyerCode,
          row.buyerName,
          row.buyerAffiliation,
          row.buyerIsActive == null ? "" : row.buyerIsActive ? "表示" : "非表示",
          row.itemId,
          row.itemCode,
          row.itemName,
          row.itemCategory,
          row.quantity,
          row.unitPrice,
          row.subtotal,
          row.itemCurrentPrice,
          row.itemCostPrice,
          row.itemStock,
          row.itemIsActive == null ? "" : row.itemIsActive ? "表示" : "非表示",
        ]);
      }

      downloadCsv(`purchase-history-${fileTimestamp()}.csv`, rows);
    } catch {
      setError("購入履歴CSVの出力に失敗しました");
    } finally {
      setExportingCsv(null);
    }
  };

  const exportStatsCsv = () => {
    if (!stats) return;
    setError(null);
    setExportingCsv("stats");
    try {
      const rows: CsvValue[][] = [
        ["集計期間", statsPresetLabels[statsPreset]],
        [],
        ["区分", "項目", "商品ID", "商品名", "値"],
        ["サマリー", "PayPay 件数", "", "", stats.byPayment.PAYPAY],
        ["サマリー", "現金 件数", "", "", stats.byPayment.CASH],
        ["サマリー", "記名", "", "", stats.namedCount],
        ["サマリー", "匿名", "", "", stats.anonymousCount],
        ...stats.byItem.map((item): CsvValue[] => ["商品別販売数", "販売数", item.itemId, item.name, item.quantity]),
      ];
      downloadCsv(`purchase-stats-${statsPreset}-${fileTimestamp()}.csv`, rows);
    } catch {
      setError("集計CSVの出力に失敗しました");
    } finally {
      setExportingCsv(null);
    }
  };

  return (
    <div className="admin-page">
      <h1>履歴・集計</h1>

      {error && <p className="banner error">{error}</p>}
      {loading && <p className="muted">読み込み中…</p>}

      {stats && !loading && (
        <section className="stats">
          <h2>集計</h2>
          <div className="inline" style={{ marginBottom: 12 }}>
            <label>
              集計期間
              <select
                className="input"
                value={statsPreset}
                onChange={(e) => setStatsPreset(e.target.value as AdminStatsPreset)}
              >
                <option value="all">全期間</option>
                <option value="today">今日（日本時間）</option>
                <option value="7">直近7日</option>
                <option value="30">直近30日</option>
              </select>
            </label>
            <button
              type="button"
              className="btn secondary small"
              disabled={exportingCsv !== null}
              onClick={exportStatsCsv}
            >
              {exportingCsv === "stats" ? "CSV作成中…" : "集計CSV"}
            </button>
          </div>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
            {statsPeriodCaption}
          </p>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="label">PayPay 件数</div>
              <div className="num">{stats.byPayment.PAYPAY}</div>
            </div>
            <div className="stat-card">
              <div className="label">現金 件数</div>
              <div className="num">{stats.byPayment.CASH}</div>
            </div>
            <div className="stat-card">
              <div className="label">記名</div>
              <div className="num">{stats.namedCount}</div>
            </div>
            <div className="stat-card">
              <div className="label">匿名</div>
              <div className="num">{stats.anonymousCount}</div>
            </div>
          </div>
          <h3>商品別販売数</h3>
          <ul className="stat-list">
            {stats.byItem.map((r) => (
              <li key={r.itemId}>
                {r.name} … {r.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>購入履歴</h2>
        <div className="row-actions single" style={{ marginTop: 0, marginBottom: 8 }}>
          <button
            type="button"
            className="btn secondary small"
            disabled={exportingCsv !== null || total === 0}
            onClick={() => void exportHistoryCsv()}
          >
            {exportingCsv === "history" ? "CSV作成中…" : "全履歴明細CSV"}
          </button>
          <button type="button" className="btn secondary small" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
            新しい履歴
          </button>
          <button
            type="button"
            className="btn secondary small"
            disabled={(page + 1) * PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            古い履歴
          </button>
          <span className="muted">
            {total === 0 ? "0件" : `${page * PAGE_SIZE + 1} - ${Math.min((page + 1) * PAGE_SIZE, total)} / ${total}件`}
          </span>
        </div>
        <div className="history-list">
          {purchases.map((p) => (
            <article key={p.purchaseId} className="history-card">
              <header>
                <span>{new Date(p.purchasedAt).toLocaleString()}</span>
                <span className="tag">{p.paymentMethod}</span>
              </header>
              <div className="small">
                購入者:{" "}
                {p.buyerType === "ANONYMOUS" ? "匿名" : p.buyerName ?? p.buyerId ?? "—"} / ¥
                {p.totalPrice.toLocaleString()} / 状態: {p.status === "CANCELED" ? "キャンセル済み" : "完了"}
              </div>
              <ul>
                {p.items.map((i) => (
                  <li key={i.itemId + i.quantity}>
                    {i.name} × {i.quantity}
                  </li>
                ))}
              </ul>
              {p.status !== "CANCELED" && (
                <div className="history-actions">
                  <button
                    type="button"
                    className="btn secondary small"
                    disabled={workingPurchaseId === p.purchaseId}
                    onClick={() => void cancelPurchase(p.purchaseId)}
                  >
                    購入をキャンセル（在庫戻し）
                  </button>
                  <button
                    type="button"
                    className="btn secondary small"
                    disabled={workingPurchaseId === p.purchaseId}
                    onClick={() => void removePurchase(p.purchaseId)}
                    style={{ marginLeft: 8 }}
                  >
                    履歴を削除
                  </button>
                </div>
              )}
              {p.status === "CANCELED" && (
                <div className="history-actions">
                  <button
                    type="button"
                    className="btn secondary small"
                    disabled={workingPurchaseId === p.purchaseId}
                    onClick={() => void removePurchase(p.purchaseId)}
                  >
                    履歴を削除
                  </button>
                </div>
              )}
            </article>
          ))}
          {purchases.length === 0 && !loading && <p className="muted">履歴はありません</p>}
        </div>
      </section>
    </div>
  );
}
