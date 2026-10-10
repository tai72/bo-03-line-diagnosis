# bo-03-line-diagnosis

LINE（LIFF）で売上シミュレーションを行い、結果をトークに残す導線の検証用デモ。Webhookは使わない。

## フロー
1. LP（`index.html`）→ 友だち追加
2. あいさつメッセージで LIFF（`liff/`）のリンクを送る
3. LIFFで入力 → 結果表示 + `liff.sendMessages` で「結果本文」「診断完了」をユーザー発言として送信
4. 応答メッセージ（キーワード「診断完了」）で無料相談の案内と予約ページ（`booking/`）のリンクを返す
5. リッチメニューのボタンで「無料相談」を送信 → 応答メッセージで受付返信 → 以降はチャットで対応

`booking/` はイメージ用のテストページで、入力内容はどこにも送信しない。

## 設定
- `config.js` の `LIFF_ID` / `FRIEND_ADD_URL` を差し替える
- LIFFアプリ：エンドポイントURL = `https://<user>.github.io/bo-03-line-diagnosis/liff/`、Scope に `chat_message.write`、サイズ Full
- 公式アカウントマネージャー：チャット ON、応答メッセージ ON（キーワード応答）、あいさつメッセージに LIFF URL
