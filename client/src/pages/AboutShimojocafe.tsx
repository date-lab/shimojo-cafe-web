import { Link } from "react-router-dom";

const toc = [
  { id: "what", label: "シモジョーカフェとは" },
  { id: "purpose", label: "目的" },
  { id: "web-goal", label: "このWebサービスの役割" },
  { id: "features", label: "利用者ができること" },
  { id: "admin", label: "管理画面でできること" },
  { id: "slack", label: "Slack連携でできること" },
  { id: "api", label: "外部から在庫APIを読む" },
  { id: "links", label: "関連ページ" },
] as const;

export function AboutShimojocafe() {
  return (
    <div className="page about-doc-page">
      <header className="about-doc-header">
        <Link to="/" className="about-doc-back">
          ← 商品一覧へ
        </Link>
        <h1>シモジョーカフェについて</h1>
      </header>

      <nav className="about-doc-toc" aria-label="目次">
        <h2 className="about-doc-toc-title">目次</h2>
        <ol>
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="about-doc-body">
        <section id="what" className="about-doc-section">
          <h2>シモジョーカフェとは？</h2>
          <p>
            伊達研究室関係者向けの無人販売サービスです．学生が運営しています．本Webサイトでは，冷蔵庫上のタブレットから商品を選び、購入者を選んで支払い方法を記録し、在庫と売上を管理します。Slackと連携して使いやすくしているのもアピールポイントです．
          </p>
        </section>

        <section id="purpose" className="about-doc-section">
          <h2>目的</h2>
          <dl className="about-doc-dl">
            <dd>紙や口頭のやり取りを減らし、購入・在庫・履歴をデジタルに残す．トラブルが減る！</dd>
            <dd>在庫切れを早めに共有する．仕入れの手間が減る！</dd>
            <dd>管理画面からログ・現状を確認できる．運用者の運用支援になります．</dd>
          </dl>
        </section>

        <section id="web-goal" className="about-doc-section">
          <h2>このWebサービスの役割</h2>
          <ul className="about-doc-list">
            <li>
              <strong>購入</strong>：商品一覧・カート・購入者選択・決済手順（PayPay / 現金の案内）までをブラウザ上で操作できます。
            </li>
            <li>
              <strong>在庫管理</strong>：商品・購入者・履歴・在庫アラート・仕入れ依頼などを管理します。
            </li>
            <li>
              <strong>Slack連携</strong>：Slackへの投稿や、在庫JSONの公開APIで外部ツールとつなぎます。
            </li>
          </ul>
        </section>

        <section id="features" className="about-doc-section">
          <h2>利用者ができること</h2>
          <ul className="about-doc-checklist">
            <li>カテゴリ別の商品一覧からカートに追加し、数量を調整する</li>
            <li>名前付き購入者または匿名で購入フローを進める</li>
            <li>PayPay または現金の案内に従い、支払いを完了する</li>
            <li>購入完了後にフィードバック（感想・要望）を送る</li>
            <li>仕入れ依頼フォームからリクエストを送る</li>
          </ul>
        </section>

        <section id="admin" className="about-doc-section">
          <h2>管理画面でできること</h2>
          <ul className="about-doc-checklist">
            <li>商品の登録・編集・一括保存・CSV取り込み、画像の割り当て</li>
            <li>購入者マスタの管理</li>
            <li>購入履歴・集計・収益モニター・操作ログの確認</li>
            <li>在庫アラート条件（閾値・条件式）の設定と履歴</li>
            <li>仕入れ依頼・フィードバック（高評価）の確認</li>
            <li>支払い案内文などの設定</li>
            →詳しくは管理者まで
          </ul>
        </section>

        <section id="links" className="about-doc-section">
          <h2>関連ページ</h2>
          <ul className="about-doc-links">
            <li>
              <Link to="/">商品一覧（購入）</Link>
            </li>
            <li>
              <Link to="/supply-request">仕入れ依頼</Link>
            </li>
            <li>
              <Link to="/feedback">フィードバック</Link>
            </li>
            <li>
              <Link to="/admin/login">管理ログイン</Link>
            </li>
          </ul>
        </section>
      </article>

      <footer className="about-doc-footer muted small">
        内容はアプリの実装に基づいています。運用ポリシーは組織内ルールに従ってください。
      </footer>
    </div>
  );
}
