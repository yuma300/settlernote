# SettlerNote

Notionライクな階層構造を持ったドキュメント管理システム

## 主な機能

- Google認証による認証・権限管理
- 階層構造を持つドキュメント管理
- Notion風ブロックエディタ（TipTap）
- ドキュメントの共有と権限管理
- リアルタイム自動保存
- レスポンシブデザイン

## 技術スタック

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **UI**: Material-UI (MUI), TailwindCSS
- **Editor**: TipTap
- **Authentication**: NextAuth.js (Google OAuth)
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **Container**: Docker

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd settlernote
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Google OAuth認証情報の取得

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. 「APIとサービス」→「認証情報」へ移動
4. 「認証情報を作成」→「OAuthクライアントID」を選択
5. アプリケーションの種類: Webアプリケーション
6. 承認済みのリダイレクトURI:
   - `http://localhost:3000/api/auth/callback/google`
7. クライアントIDとクライアントシークレットを取得

### 4. 環境変数の設定

`.env`ファイルを編集して、以下の値を設定:

```env
# Database
DATABASE_URL="mysql://settlernote_user:settlernote_password@localhost:3306/settlernote"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here  # openssl rand -base64 32 で生成

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. MySQLコンテナの起動

```bash
docker-compose up -d
```

MySQLが起動するのを待ちます（約10-20秒）:

```bash
docker-compose logs -f mysql
```

「ready for connections」というメッセージが表示されたら準備完了です。

### 6. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run prisma:generate

# データベーススキーマの適用
npm run prisma:push
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 使用方法

1. Googleアカウントでログイン
2. 「新規ドキュメント」ボタンでドキュメントを作成
3. サイドバーでドキュメントを選択して編集
4. ドキュメント項目の「+」ボタンで子ドキュメントを作成
5. 自動保存されます

## 開発用コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# Lint
npm run lint

# Prismaクライアント生成
npm run prisma:generate

# データベーススキーマ適用
npm run prisma:push

# Prisma Studio（データベースGUI）
npm run prisma:studio
```

## データベース管理

### Prisma Studio

視覚的にデータベースを確認・編集:

```bash
npm run prisma:studio
```

ブラウザで http://localhost:5555 にアクセス

### MySQLコンテナへの接続

```bash
docker exec -it settlernote-mysql mysql -u settlernote_user -p
# パスワード: settlernote_password
```

## プロジェクト構成

```
settlernote/
├── prisma/
│   └── schema.prisma          # データベーススキーマ定義
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth APIルート
│   │   │   └── documents/     # ドキュメントAPIルート
│   │   ├── auth/
│   │   │   └── signin/        # サインインページ
│   │   ├── documents/         # ドキュメント管理ページ
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # ホームページ
│   │   └── globals.css        # グローバルスタイル
│   ├── components/
│   │   ├── Editor.tsx         # TipTapエディタコンポーネント
│   │   ├── Sidebar.tsx        # サイドバーナビゲーション
│   │   └── Providers.tsx      # プロバイダーラッパー
│   ├── lib/
│   │   ├── auth.ts            # NextAuth設定
│   │   ├── prisma.ts          # Prismaクライアント
│   │   └── theme.ts           # MUIテーマ
│   └── types/
│       └── next-auth.d.ts     # NextAuth型定義
├── docker-compose.yml         # Docker構成
├── .env                       # 環境変数
└── package.json
```

## 主要な機能

### ドキュメント管理

- 階層構造のドキュメント作成
- ドキュメントのタイトル、アイコン（絵文字）編集
- リッチテキストエディタ
- 自動保存（1秒後）
- ドキュメント削除

### 権限管理

データベーススキーマに権限管理機能が実装されています:

- OWNER: 完全な権限
- EDITOR: 編集可能
- VIEWER: 閲覧のみ

現在のUIには共有機能が未実装ですが、APIレベルでは対応しています。

## トラブルシューティング

### データベース接続エラー

MySQLコンテナが起動しているか確認:

```bash
docker-compose ps
```

起動していない場合:

```bash
docker-compose up -d
```

### Prismaエラー

Prismaクライアントを再生成:

```bash
npm run prisma:generate
npm run prisma:push
```

### ポート競合

3306ポートが既に使用されている場合、`docker-compose.yml`のポートを変更:

```yaml
ports:
  - "3307:3306"  # ホストポートを3307に変更
```

その後、`.env`の`DATABASE_URL`も更新:

```env
DATABASE_URL="mysql://settlernote_user:settlernote_password@localhost:3307/settlernote"
```

## ライセンス

ISC
