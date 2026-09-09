# タスク履歴

## AVATAR-001
- 2026-09-09: ユーザー依頼により対戦相手をオリジナルの女の子に変更。仕様の起点はSPECIFICATION.md第3節。既存のタスク一覧は存在しなかったため新設。
- 茶色のボブ、ピンクのブラウス、モーブのスカート、クリーム色のリボン。ヘッドセットと長いツインテールを除去。
- GirlAvatar3Dへ改名し、CPU表示名と関連型を更新。手姿勢・カウントダウン・勝敗表情の制御を維持。
- pnpm test: 9件成功。pnpm build / pnpm lint / git diff --check: 成功。ビルドに500 kB超チャンク警告あり。
- 敵対的レビュー: 認可・テナント・個人情報・外部通信の処理変更なし。入力の型と状態分岐・呼び出し元の接続を確認。Critical/High指摘なし。外観と実カメラの対戦は未検証。
- 実装PR: https://github.com/refrain62/camera_jyanken/pull/1 （Draft、未マージ）。

## PAGES-001
- 2026-09-09: GitHub Pages向けにViteの公開パスを`/camera_jyanken/`へ設定し、faviconも同じベースパスから参照するよう変更。
- `develop`へのpushまたは手動実行で、pnpmによるビルド成果物`dist`をGitHub Pagesへ公開するActionsワークフローを追加。
- パッケージ管理をpnpmへ統一し、固定ロックファイルとesbuildだけを許可する依存ビルド設定を追加。
- pnpm test: 9件成功。pnpm lint / pnpm build / git diff --check: 成功。生成HTMLのJS・CSS・faviconが`/camera_jyanken/`配下を参照することを確認。500 kB超チャンク警告は既知の非阻害事項。
- 敵対的レビュー: 認可・テナント・個人情報・状態遷移への変更なし。Actions権限を`contents: read`、`pages: write`、`id-token: write`に限定。Critical/High指摘なし。
- 実装PR: https://github.com/refrain62/camera_jyanken/pull/3 （`develop`へマージ済み）。
