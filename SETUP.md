# セットアップガイド

このガイドでは、SettlerNoteを起動するための手順を説明します。

## クイックスタート

### 1. Google OAuth認証情報の設定

まず、Google Cloud Consoleで認証情報を取得します:

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. 左メニューから「APIとサービス」→「認証情報」を選択
4. 「+ 認証情報を作成」→「OAuthクライアントID」をクリック
5. アプリケーションの種類: **Webアプリケーション**
6. 名前: 任意（例: SettlerNote Local）
7. 承認済みのリダイレクトURIに以下を追加:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. 「作成」をクリックしてクライアントIDとシークレットを取得

### 2. 環境変数の設定

`.env`ファイルを開き、Google OAuth認証情報を設定します:

```bash
# Google OAuth（取得した値に置き換える）
GOOGLE_CLIENT_ID=取得したクライアントID
GOOGLE_CLIENT_SECRET=取得したクライアントシークレット

# NextAuth Secret（以下のコマンドで生成）
# openssl rand -base64 32
NEXTAUTH_SECRET=ランダムな文字列
```

シークレットキーの生成:
```bash
openssl rand -base64 32
```

### 3. MySQLコンテナの起動

```bash
docker-compose up -d
```

起動確認（約10-20秒待つ）:
```bash
docker-compose logs -f mysql
```

「ready for connections」が表示されたら Ctrl+C で終了

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run prisma:generate

# データベーススキーマの適用
npm run prisma:push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

### 6. アプリケーションにアクセス

ブラウザで以下のURLを開きます:

```
http://localhost:3000
```

Googleアカウントでログインして、ドキュメントの作成を開始できます！

## トラブルシューティング

### ポート3306が既に使用されている

MySQLが既にインストールされている場合、ポート競合が発生する可能性があります。

**docker-compose.yml**を編集:
```yaml
ports:
  - "3307:3306"  # ホストポートを3307に変更
```

**.env**も更新:
```env
DATABASE_URL="mysql://settlernote_user:settlernote_password@localhost:3307/settlernote"
```

### データベース接続エラー

MySQLコンテナの状態を確認:
```bash
docker-compose ps
```

再起動が必要な場合:
```bash
docker-compose down
docker-compose up -d
```

### Prismaエラー

Prismaクライアントを再生成:
```bash
npm run prisma:generate
npm run prisma:push
```

### ビルドエラー

node_modulesを再インストール:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 便利なコマンド

### データベースGUI（Prisma Studio）

```bash
npm run prisma:studio
```

http://localhost:5555 でデータベースを視覚的に確認・編集できます。

### MySQLコンテナに直接接続

```bash
docker exec -it settlernote-mysql mysql -u settlernote_user -p
# パスワード: settlernote_password
```

### ログの確認

```bash
# MySQLログ
docker-compose logs -f mysql

# アプリケーションログ
# 開発サーバーのターミナルで確認
```

## 次のステップ

1. ログイン後、「新規ドキュメント」ボタンでドキュメントを作成
2. タイトルを編集し、アイコン（絵文字）を設定
3. ドキュメント項目の「+」ボタンで子ドキュメントを作成
4. 階層構造を持つドキュメントツリーを構築

詳細な機能については [README.md](README.md) をご覧ください。
