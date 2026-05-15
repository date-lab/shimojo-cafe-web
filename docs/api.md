# Shimojo Cafe Web / Slack Bot 利用ドキュメント

## Slackコマンドでできること

Shimojo CafeのSlack Botを使うと、Slack上から在庫確認、購入者IDの確認、商品の購入登録ができます。ブラウザの管理画面を開かなくても、普段使っているSlackから素早く操作できます。

主に使うコマンドは `/cafe` です。Slackのメッセージ入力欄に `/cafe ...` と入力して送信します。

## まず覚えるコマンド

| やりたいこと | コマンド |
| --- | --- |
| ヘルプを見る | `/cafe help` |
| 全商品の在庫を見る | `/cafe stock` |
| 飲み物だけ見る | `/cafe stock drink` |
| お菓子だけ見る | `/cafe stock snack` |
| 在庫が少ない商品を見る | `/cafe stock alert` |
| 購入者IDを確認する | `/cafe list-buyer` |
| 商品を購入登録する | `/cafe buy <itemId> <個数> <buyerId> <支払い方法>` |
| お茶を1本すぐ買う | `/cafe tea <buyerId> [支払い方法]` |
| 野菜ジュースを1本すぐ買う | `/cafe vege <buyerId> [支払い方法]` |

## 在庫を確認する

一番よく使うのは在庫確認です。

```text
/cafe stock
```

実行すると、在庫数が少ない順に商品が表示されます。各商品には `ID` が表示されます。購入登録をするときは、この `ID` をそのまま使います。

表示例:

```text
ID:0007 | コーヒー (DRINK) - 在庫: 5 個
ID:0012 | チョコ (SNACK) - 在庫: 売り切れ
```

カテゴリを絞りたい場合は、次のように入力します。

```text
/cafe stock drink
/cafe stock snack
/cafe stock other
```

在庫が少ない商品だけ見たい場合は、次のコマンドを使います。

```text
/cafe stock alert
```

## 購入者IDを確認する

購入登録では、誰が買ったかを表す `buyerId` が必要です。まず一覧を確認します。

```text
/cafe list-buyer
```

名前で検索したい場合は、後ろにキーワードを付けます。

```text
/cafe list-buyer 山田
```

匿名で購入したい場合は、`buyerId` に `999` を使います。

## 商品を購入登録する

通常の購入登録は次の形です。

```text
/cafe buy <itemId> <個数> <buyerId> <支払い方法>
```

引数の意味:

- `itemId`: `/cafe stock` で表示された商品ID
- `個数`: 買う数。1以上の整数
- `buyerId`: `/cafe list-buyer` で表示された購入者ID。匿名は `999`
- `支払い方法`: `paypay` または `cash`

例:

```text
/cafe buy 0007 2 0012 paypay
/cafe buy 0007 1 999 cash
```

1つ目の例は「商品ID `0007` を2個、buyer ID `0012` の人がPayPayで購入」という意味です。2つ目の例は「商品ID `0007` を1個、匿名で現金購入」という意味です。

購入が成功すると、Slack上に「購入を受け付けました」と表示されます。在庫が足りない場合は、購入は登録されず、現在在庫が表示されます。

## お茶・野菜ジュースをすぐ買う

よく買う商品用に、短いコマンドも用意されています。

```text
/cafe tea <buyerId> [支払い方法]
/cafe vege <buyerId> [支払い方法]
```

`tea` はお茶を1本、`vege` は野菜ジュースを1本購入します。個数はどちらも1個固定です。

例:

```text
/cafe tea 0012
/cafe vege 0012 cash
```

支払い方法を省略すると `paypay` として扱われます。

```text
/cafe tea 0012
```

これは次と同じ意味です。

```text
/cafe tea 0012 paypay
```

`buyerId` を忘れて実行すると、購入者一覧が表示されます。その一覧から自分のIDを確認して、もう一度コマンドを実行してください。

## DMで在庫確認する

Slack BotとのDMでも在庫確認ができます。

1. BotにDMで `在庫` または `inventory` と送ります。
2. 「在庫を確認する」ボタンが表示されます。
3. ボタンを押すと、在庫一覧がDMに返ってきます。

これは在庫確認専用の簡単な入口です。購入登録をしたい場合は `/cafe buy` を使ってください。

## 迷ったとき

使い方を忘れたら、まず次を実行してください。

```text
/cafe help
```

購入コマンドの形だけ確認したい場合は、次の入力でもヘルプが表示されます。

```text
/cafe buy help
```

購入者IDの確認方法だけ知りたい場合は、次を使います。

```text
/cafe list-buyer help
```

## 注意点

- Slack上に表示された `ID` をそのまま使ってください。
- 商品が非表示になっている場合、在庫一覧や購入対象には表示されません。
- 在庫が0の商品は `売り切れ` と表示されます。
- 在庫不足の場合、購入登録は失敗します。
- `/cafe` の応答は基本的に実行した本人だけに見える一時メッセージです。
- Botが「処理に失敗しました」と返す場合は、在庫APIや購入APIに接続できていない可能性があります。

<details>
<summary>APIの使い方を見る</summary>

## Shimojo Cafe Web API 利用ドキュメント

このドキュメントは、`server/src/index.ts` で提供しているAPIの使い方をまとめたものです。

## 基本情報

- ベースURL: `http://localhost:8787`
- APIパス: すべて `/api` から始まります。
- リクエスト形式: 原則 `application/json`
- レスポンス形式: 原則 `application/json`
- 管理者API: `/api/admin/*` はログイン後のCookie認証が必要です。
- エラー形式: 多くの失敗レスポンスは `{ "error": "ERROR_CODE" }` です。

フロントエンドから同一オリジンで呼び出す場合は、相対パスを使えます。

```ts
const res = await fetch("/api/items", { cache: "no-store" });
const data = await res.json();
```

## 認証

管理者APIを使うには、先に `POST /api/admin/login` を呼び出します。ログインに成功すると、HTTP-only Cookie `shimojo_admin` が発行されます。セッションの有効期限は12時間です。

ブラウザ以外、または別オリジンから管理者APIを呼ぶ場合は、Cookieを送信するために `credentials: "include"` を指定してください。

```ts
await fetch("/api/admin/items", {
  credentials: "include"
});
```

未ログインまたはセッション切れの場合、管理者APIは `401` と `{ "error": "UNAUTHORIZED" }` を返します。

## 共通データ型

### Item

```ts
type Item = {
  itemId: string;
  name: string;
  costPrice: number;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  displayOrder: number;
  category: "DRINK" | "SNACK" | "OTHER";
  alertEnabled: boolean;
  alertThreshold: number;
  alertCondition: "LTE" | "EQ";
};
```

### Buyer

```ts
type Buyer = {
  buyerId: string;
  name: string;
  photoUrl: string | null;
  affiliation: string | null;
  isActive: boolean;
};
```

### PurchaseDetail

```ts
type PurchaseDetail = {
  purchaseId: string;
  purchasedAt: string;
  totalPrice: number;
  paymentMethod: "PAYPAY" | "CASH";
  buyerType: "NAMED" | "ANONYMOUS";
  buyerId: string | null;
  buyerName: string | null;
  terminalId: string;
  status: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};
```

## 公開API

### ヘルスチェック

`GET /api/health`

サーバーの起動確認に使います。

レスポンス例:

```json
{
  "ok": true,
  "terminalId": "tablet-1"
}
```

### 在庫一覧

`GET /api/inventory`

Slack在庫Botなど外部連携向けの在庫APIです。認証は不要です。キャッシュされないように `Cache-Control` が設定されます。

レスポンス例:

```json
{
  "generatedAt": "2026-05-11T00:00:00.000Z",
  "terminalId": "tablet-1",
  "items": [
    {
      "itemId": "item-1",
      "itemCode": "001",
      "name": "コーヒー",
      "stock": 10,
      "isActive": true,
      "category": "DRINK",
      "isAlerting": false,
      "alertThreshold": 3,
      "alertCondition": "LTE"
    }
  ]
}
```

### POS設定取得

`GET /api/settings`

支払い案内文と端末IDを取得します。

レスポンス例:

```json
{
  "paypayInstruction": "PayPayで送金してください。",
  "cashInstruction": "現金は研究室の貯金箱へお願いします。",
  "terminalId": "tablet-1"
}
```

### 販売中商品一覧

`GET /api/items`

POS購入画面に表示する販売中商品と、直近7日の売れ筋Top3を取得します。

レスポンス例:

```json
{
  "items": [
    {
      "itemId": "item-1",
      "name": "コーヒー",
      "costPrice": 100,
      "price": 150,
      "stock": 10,
      "isActive": true,
      "imageUrl": "/images/items/coffee.png",
      "displayOrder": 1,
      "category": "DRINK",
      "alertEnabled": true,
      "alertThreshold": 3,
      "alertCondition": "LTE"
    }
  ],
  "bestsellers7d": [
    {
      "itemId": "item-1",
      "rank": 1,
      "quantitySold": 12
    }
  ]
}
```

### 購入者一覧

`GET /api/buyers`

POSで選択可能な購入者、直近7日のよく買う人、購入回数ランキングを取得します。

レスポンス例:

```json
{
  "buyers": [
    {
      "buyerId": "buyer-1",
      "name": "山田太郎",
      "photoUrl": null,
      "affiliation": "研究室",
      "isActive": true
    }
  ],
  "heavyBuyers": [],
  "weeklyBuyerUsage": [
    {
      "buyerId": "buyer-1",
      "purchaseCount": 3,
      "rank": 1
    }
  ]
}
```

### 購入登録

`POST /api/purchases`

購入を登録し、在庫を減らします。購入後、在庫アラート条件に該当する商品があればSlack通知も試行されます。

リクエスト例:

```json
{
  "lines": [
    {
      "itemId": "item-1",
      "quantity": 2
    }
  ],
  "paymentMethod": "PAYPAY",
  "buyerType": "NAMED",
  "buyerId": "buyer-1",
  "terminalId": "tablet-1"
}
```

フィールド:

- `lines`: 購入明細です。空配列はエラーです。
- `paymentMethod`: `"PAYPAY"` または `"CASH"`。それ以外は `"PAYPAY"` として扱われます。
- `buyerType`: `"NAMED"` または `"ANONYMOUS"`。それ以外は `"NAMED"` として扱われます。
- `buyerId`: `buyerType` が `"NAMED"` の場合に必要です。
- `terminalId`: 未指定の場合はサーバーの `TERMINAL_ID` が使われます。

レスポンス例:

```json
{
  "purchase": {
    "purchaseId": "purchase-1",
    "purchasedAt": "2026-05-11T00:00:00.000Z",
    "totalPrice": 300,
    "paymentMethod": "PAYPAY",
    "buyerType": "NAMED",
    "buyerId": "buyer-1",
    "buyerName": "山田太郎",
    "terminalId": "tablet-1",
    "status": "COMPLETED",
    "items": [
      {
        "itemId": "item-1",
        "name": "コーヒー",
        "quantity": 2,
        "unitPrice": 150,
        "subtotal": 300
      }
    ]
  }
}
```

主なエラー:

- `400 EMPTY_CART`: カートが空
- `400 BAD_QUANTITY`: 数量が不正
- `400 ITEM_NOT_FOUND`: 商品が存在しない
- `400 BUYER_REQUIRED`: 記名購入で購入者が未指定
- `409 INSUFFICIENT_STOCK`: 在庫不足

### 仕入れ依頼

`POST /api/supply-requests`

商品補充や仕入れ希望を登録します。

リクエスト例:

```json
{
  "body": "コーヒーを再入荷してほしいです",
  "requesterName": "POS端末",
  "source": "pos"
}
```

フィールド:

- `body`: 依頼本文
- `requesterName`: 依頼者名
- `source`: `"pos"` または `"mobile"`。それ以外は `"pos"` として扱われます。

レスポンス例:

```json
{
  "requestId": "request-1"
}
```

主なエラー:

- `400 INVALID_SUPPLY_REQUEST`: 本文などが不正

### 商品への高評価

`POST /api/item-feedbacks`

商品に対する高評価を登録します。

リクエスト例:

```json
{
  "itemId": "item-1",
  "feedbackType": "LIKE",
  "source": "pos"
}
```

フィールド:

- `itemId`: 対象の商品ID
- `feedbackType`: `"LIKE"` のみ有効
- `source`: `"pos"` または `"mobile"`。それ以外は `"pos"` として扱われます。

レスポンス例:

```json
{
  "feedbackId": "feedback-1"
}
```

主なエラー:

- `400 BAD_REQUEST`: `itemId` または `feedbackType` が不正
- `400 ITEM_NOT_FOUND`: 商品が存在しない

### フィードバック投稿

`POST /api/feedbacks`

アプリ全体への意見や感想を登録します。

リクエスト例:

```json
{
  "body": "画面が使いやすいです",
  "senderName": "山田",
  "source": "pos"
}
```

レスポンス例:

```json
{
  "feedbackMessageId": "message-1"
}
```

主なエラー:

- `400 INVALID_FEEDBACK_MESSAGE`: 本文などが不正

## 管理者API

管理者APIはすべてCookie認証が必要です。ただし、ログインとログアウトは例外です。

### ログイン

`POST /api/admin/login`

管理者ユーザー名は固定で `admin` です。パスワードは `ADMIN_PASSWORD` 環境変数、または管理画面で保存された `admin_password` 設定値です。

リクエスト例:

```json
{
  "user": "admin",
  "pass": "password"
}
```

レスポンス例:

```json
{
  "ok": true
}
```

主なエラー:

- `401 UNAUTHORIZED`: ユーザー名またはパスワードが不正

### ログアウト

`POST /api/admin/logout`

Cookieを削除します。

レスポンス例:

```json
{
  "ok": true
}
```

## 商品管理

### 商品一覧

`GET /api/admin/items`

全商品を取得します。非表示商品も含みます。

レスポンス例:

```json
{
  "items": []
}
```

### 商品画像一覧

`GET /api/admin/item-images`

`client/public/images/items` にある画像ファイルを取得します。対象拡張子は `png`, `jpg`, `jpeg`, `webp`, `avif`, `svg` です。

レスポンス例:

```json
{
  "images": [
    "/images/items/coffee.png"
  ]
}
```

### 商品作成

`POST /api/admin/items`

リクエスト例:

```json
{
  "name": "コーヒー",
  "costPrice": 100,
  "price": 150,
  "stock": 10,
  "isActive": true,
  "imageUrl": "/images/items/coffee.png",
  "displayOrder": 1,
  "category": "DRINK",
  "alertEnabled": true,
  "alertThreshold": 3,
  "alertCondition": "LTE"
}
```

レスポンス例:

```json
{
  "itemId": "item-1"
}
```

### 商品更新

`PUT /api/admin/items/:itemId`

指定した商品を更新します。`:itemId` に `"new"` を指定した場合は新規作成扱いです。

リクエスト形式は商品作成と同じです。

レスポンス例:

```json
{
  "itemId": "item-1"
}
```

### 商品削除

`DELETE /api/admin/items/:itemId`

レスポンス例:

```json
{
  "deleted": true
}
```

主なエラー:

- `404 NOT_FOUND`: 商品が存在しない
- `409 ITEM_IN_USE`: 購入履歴などで使用中のため削除できない

### 商品一括登録または更新

`POST /api/admin/items/bulk-upsert`

複数商品をまとめて作成または更新します。`itemId` がある場合は更新、ない場合は作成になります。

リクエスト例:

```json
{
  "items": [
    {
      "itemId": "item-1",
      "name": "コーヒー",
      "costPrice": 100,
      "price": 150,
      "stock": 10,
      "isActive": true,
      "imageUrl": "/images/items/coffee.png",
      "displayOrder": 1,
      "category": "DRINK",
      "alertEnabled": true,
      "alertThreshold": 3,
      "alertCondition": "LTE"
    }
  ]
}
```

レスポンス例:

```json
{
  "updated": 1
}
```

主なエラー:

- `400 EMPTY_ITEMS`: `items` が空
- `400 BAD_ITEM_ROW`: 商品行の必須項目または数値が不正

### 全商品へ税率適用

`POST /api/admin/items/apply-tax`

全商品の価格に税率を適用します。

リクエスト例:

```json
{
  "ratePercent": 10
}
```

レスポンス例:

```json
{
  "updated": 12
}
```

### 全商品の在庫をクリア

`POST /api/admin/items/clear-stocks`

全商品の在庫数をクリアします。

レスポンス例:

```json
{
  "updated": 12
}
```

## 購入者管理

### 購入者一覧

`GET /api/admin/buyers`

レスポンス例:

```json
{
  "buyers": []
}
```

### 購入者作成

`POST /api/admin/buyers`

リクエスト例:

```json
{
  "name": "山田太郎",
  "photoUrl": null,
  "affiliation": "研究室",
  "isActive": true
}
```

レスポンス例:

```json
{
  "buyerId": "buyer-1"
}
```

主なエラー:

- `409 DUPLICATE_BUYER_NAME`: 同名の購入者が存在する
- `409 INVALID_BUYER_NAME`: 購入者名が不正

### 購入者更新

`PUT /api/admin/buyers/:buyerId`

指定した購入者を更新します。`:buyerId` に `"new"` を指定した場合は新規作成扱いです。

リクエスト形式は購入者作成と同じです。

### 購入者削除

`DELETE /api/admin/buyers/:buyerId`

レスポンス例:

```json
{
  "deleted": true
}
```

主なエラー:

- `404 NOT_FOUND`: 購入者が存在しない

## 購入履歴と集計

### 購入履歴

`GET /api/admin/purchases?limit=20&offset=0`

購入履歴をページングして取得します。

クエリ:

- `limit`: 取得件数。レスポンス上は `1` から `100` に丸められます。
- `offset`: 取得開始位置。負数は `0` に丸められます。

レスポンス例:

```json
{
  "purchases": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

### 購入キャンセル

`POST /api/admin/purchases/:purchaseId/cancel`

購入をキャンセルし、在庫を戻します。

レスポンス例:

```json
{
  "canceled": true
}
```

主なエラー:

- `404 PURCHASE_NOT_FOUND`: 購入が存在しない
- `409 ITEM_NOT_FOUND`: 在庫を戻す対象の商品が存在しない

### 購入削除

`DELETE /api/admin/purchases/:purchaseId`

購入レコードを削除します。

レスポンス例:

```json
{
  "deleted": true,
  "restoredStock": true
}
```

主なエラー:

- `404 PURCHASE_NOT_FOUND`: 購入が存在しない

### 統計

`GET /api/admin/stats?preset=all`

支払い方法別、購入者種別、商品別の集計を取得します。

クエリ:

- `preset`: `"all"`, `"today"`, `"7"`, `"30"` のいずれか。未指定または不正値は `"all"` です。

レスポンス例:

```json
{
  "preset": "all",
  "stats": {
    "byPayment": {
      "PAYPAY": 10,
      "CASH": 2
    },
    "anonymousCount": 1,
    "namedCount": 11,
    "byItem": [
      {
        "itemId": "item-1",
        "name": "コーヒー",
        "quantity": 12
      }
    ]
  }
}
```

## モニターと会計

### 日次モニター

`GET /api/admin/monitor?date=2026-05-11`

指定日の売上、購入件数、キャンセル件数、会計スナップショット、全期間売上を取得します。`date` 未指定時は当日扱いです。

レスポンス例:

```json
{
  "date": "2026-05-11",
  "metrics": {
    "purchaseTotal": 1500,
    "purchaseCount": 10,
    "canceledCount": 0
  },
  "snapshot": null,
  "totalRevenue": 12000
}
```

### モニター推移

`GET /api/admin/monitor/timeline?days=14`

指定日数分の日別推移を取得します。

レスポンス例:

```json
{
  "points": [
    {
      "date": "2026-05-11",
      "purchaseTotal": 1500,
      "purchaseCount": 10,
      "canceledCount": 0,
      "paypayCount": 8,
      "cashCount": 2
    }
  ]
}
```

### モニター分析

`GET /api/admin/monitor/analytics?days=30`

日別推移と商品別分析を取得します。

レスポンス例:

```json
{
  "days": 30,
  "timeline": [],
  "items": [
    {
      "itemId": "item-1",
      "name": "コーヒー",
      "quantity": 12,
      "revenue": 1800,
      "avgUnitPrice": 150,
      "currentPrice": 150,
      "stock": 10
    }
  ]
}
```

### 会計スナップショット保存

`PUT /api/admin/monitor`

会計確認用のスナップショットを保存します。

リクエスト例:

```json
{
  "date": "2026-05-11",
  "recordedPurchaseTotal": 1500,
  "shippingFee": 300,
  "poolFund": 200,
  "note": "メモ"
}
```

レスポンス例:

```json
{
  "ok": true
}
```

主なエラー:

- `400 BAD_DATE`: `date` が `YYYY-MM-DD` 形式ではない

## 在庫操作

### 在庫アラート一覧

`GET /api/admin/stock-alerts`

在庫アラート設定と現在在庫を取得します。

レスポンス例:

```json
{
  "alerts": []
}
```

### 在庫イベント一覧

`GET /api/admin/stock-events?limit=200`

在庫の増減履歴を取得します。

レスポンス例:

```json
{
  "events": [
    {
      "stockEventId": "stock-event-1",
      "itemId": "item-1",
      "itemName": "コーヒー",
      "eventType": "REPLENISH",
      "delta": 10,
      "beforeStock": 0,
      "afterStock": 10,
      "note": "補充",
      "actor": "admin",
      "createdAt": "2026-05-11T00:00:00.000Z"
    }
  ]
}
```

### 在庫イベント作成

`POST /api/admin/stock-events`

在庫を補充または調整します。

リクエスト例:

```json
{
  "itemId": "item-1",
  "eventType": "REPLENISH",
  "quantity": 10,
  "note": "補充"
}
```

フィールド:

- `eventType`: `"REPLENISH"` または `"ADJUST"`
- `quantity`: 数量。`REPLENISH` は補充数、`ADJUST` は調整数として扱われます。

レスポンス例:

```json
{
  "stockEventId": "stock-event-1"
}
```

主なエラー:

- `400 BAD_REQUEST`: 必須項目が不足、または `eventType` / `quantity` が不正
- `400 BAD_QUANTITY`: 数量が不正
- `400 ITEM_NOT_FOUND`: 商品が存在しない

## 仕入れ依頼管理

### 仕入れ依頼一覧

`GET /api/admin/supply-requests`

レスポンス例:

```json
{
  "requests": [
    {
      "requestId": "request-1",
      "body": "コーヒーを再入荷してほしいです",
      "requesterName": "POS端末",
      "createdAt": "2026-05-11T00:00:00.000Z",
      "source": "pos",
      "status": "OPEN"
    }
  ]
}
```

### 仕入れ依頼ステータス更新

`PATCH /api/admin/supply-requests/:requestId`

リクエスト例:

```json
{
  "status": "DONE"
}
```

フィールド:

- `status`: `"OPEN"` または `"DONE"`

レスポンス例:

```json
{
  "ok": true
}
```

主なエラー:

- `400 BAD_STATUS`: `status` が不正
- `404 NOT_FOUND`: 仕入れ依頼が存在しない

## フィードバック管理

### 商品高評価一覧

`GET /api/admin/item-feedbacks?days=30&limit=80`

商品への高評価サマリと直近の高評価履歴を取得します。`days` が0以下の場合は全期間集計です。

レスポンス例:

```json
{
  "summary": [
    {
      "itemId": "item-1",
      "name": "コーヒー",
      "likeCount": 3,
      "lastFeedbackAt": "2026-05-11T00:00:00.000Z"
    }
  ],
  "recent": [
    {
      "feedbackId": "feedback-1",
      "itemId": "item-1",
      "itemName": "コーヒー",
      "feedbackType": "LIKE",
      "source": "pos",
      "createdAt": "2026-05-11T00:00:00.000Z"
    }
  ]
}
```

### フィードバック一覧

`GET /api/admin/feedbacks?limit=200`

アプリ全体へのフィードバックを取得します。

レスポンス例:

```json
{
  "messages": [
    {
      "feedbackMessageId": "message-1",
      "body": "画面が使いやすいです",
      "senderName": "山田",
      "source": "pos",
      "createdAt": "2026-05-11T00:00:00.000Z",
      "status": "OPEN"
    }
  ]
}
```

### フィードバックステータス更新

`PATCH /api/admin/feedbacks/:feedbackMessageId`

リクエスト例:

```json
{
  "status": "DONE"
}
```

フィールド:

- `status`: `"OPEN"` または `"DONE"`

レスポンス例:

```json
{
  "ok": true
}
```

主なエラー:

- `400 BAD_STATUS`: `status` が不正
- `404 NOT_FOUND`: フィードバックが存在しない

## 操作ログ

### 操作ログ一覧

`GET /api/admin/operation-logs?limit=300`

管理画面からの更新操作ログを取得します。

レスポンス例:

```json
{
  "logs": [
    {
      "operationId": "operation-1",
      "action": "UPDATE_SETTINGS",
      "targetType": "SETTINGS",
      "targetId": null,
      "detail": "{}",
      "actor": "admin",
      "createdAt": "2026-05-11T00:00:00.000Z"
    }
  ]
}
```

## 管理設定

### 設定更新

`PUT /api/admin/settings`

支払い案内文と管理者パスワードを更新します。

リクエスト例:

```json
{
  "paypayInstruction": "PayPayで送金してください。",
  "cashInstruction": "現金は研究室の貯金箱へお願いします。",
  "adminPassword": "new-password"
}
```

レスポンス例:

```json
{
  "ok": true
}
```

補足:

- `paypayInstruction` は指定された場合だけ更新されます。
- `cashInstruction` は指定された場合だけ更新されます。
- `adminPassword` は空文字の場合は更新されません。

## 全体通知

### Slack全体通知

`POST /api/admin/notifications/all`

Slack全体通知用Webhookへ投稿します。`SLACK_WEBHOOK_URL_forAll` が未設定の場合、APIは成功しますが通知は送られません。

リクエスト例:

```json
{
  "text": "補充しました"
}
```

レスポンス例:

```json
{
  "ok": true
}
```

主なエラー:

- `400 BAD_TEXT`: `text` が空
- `500 SLACK_SEND_FAILED`: Slackへの送信に失敗

## よく使う呼び出し例

### POSで商品一覧を取得する

```ts
const res = await fetch("/api/items", { cache: "no-store" });

if (!res.ok) {
  throw new Error("商品を取得できませんでした");
}

const { items, bestsellers7d } = await res.json();
```

### POSで購入を登録する

```ts
const res = await fetch("/api/purchases", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    lines: [{ itemId: "item-1", quantity: 1 }],
    paymentMethod: "PAYPAY",
    buyerType: "ANONYMOUS",
    buyerId: null,
    terminalId: "tablet-1"
  })
});

if (res.status === 409) {
  const err = await res.json();
  if (err.error === "INSUFFICIENT_STOCK") {
    throw new Error("在庫が不足しています");
  }
}

if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  throw new Error(err.error ?? `HTTP_${res.status}`);
}

const data = await res.json();
```

### 管理APIへログインして商品一覧を取得する

```ts
await fetch("/api/admin/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    user: "admin",
    pass: "password"
  })
});

const res = await fetch("/api/admin/items", {
  credentials: "include",
  cache: "no-store"
});

const data = await res.json();
```

### curlで在庫一覧を取得する

```bash
curl http://localhost:8787/api/inventory
```

### curlで管理APIにログインして呼び出す

```bash
curl -c cookie.txt \
  -H "Content-Type: application/json" \
  -d '{"user":"admin","pass":"password"}' \
  http://localhost:8787/api/admin/login

curl -b cookie.txt http://localhost:8787/api/admin/items
```

</details>
