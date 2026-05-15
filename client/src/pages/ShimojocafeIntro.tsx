import { Link } from "react-router-dom";

/**
 * 一枚絵のビジュアル紹介。購入フローとは別ルートで全画面表示。
 */
export function ShimojocafeIntro() {
  return (
    <div className="intro-poster">
      <Link to="/" className="intro-poster-back" aria-label="商品一覧へ戻る">
        ←
      </Link>
      <Link to="/about" className="intro-poster-help">
        詳しく
      </Link>

      <div className="intro-poster-bg" aria-hidden="true" />
      <div className="intro-poster-steam" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="intro-poster-content">
        <p className="intro-poster-tagline">社内カフェ · 無人販売 · 軽量POS</p>
        <h1 className="intro-poster-title">
          <span className="intro-poster-title-line">シモジョー</span>
          <span className="intro-poster-title-line accent">カフェ</span>
        </h1>
        <p className="intro-poster-sub">選ぶ · 記録する · 在庫をつなぐ</p>

        <div className="intro-poster-grid">
          <div className="intro-poster-card">
            <span className="intro-poster-card-icon" aria-hidden="true">
              ◎
            </span>
            <h2>購入</h2>
            <p>カートから購入者と支払いまでスムーズに。</p>
          </div>
          <div className="intro-poster-card">
            <span className="intro-poster-card-icon" aria-hidden="true">
              ▤
            </span>
            <h2>管理</h2>
            <p>商品・履歴・モニター・依頼を一か所に。</p>
          </div>
          <div className="intro-poster-card">
            <span className="intro-poster-card-icon" aria-hidden="true">
              ⌁
            </span>
            <h2>Slack</h2>
            <p>在庫アラートと更新通知をチャンネルへ。</p>
          </div>
        </div>

        <div className="intro-poster-footer">
          <span className="intro-poster-deco" aria-hidden="true" />
          Webで完結する一杯のための仕組み
        </div>
      </div>
    </div>
  );
}
