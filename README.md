# SettlerNote

Notion風の階層型ドキュメント管理システム

## 機能

- Novel エディタによる高機能なテキスト編集
- 階層型ドキュメント管理
- ユーザー認証（Google OAuth）
- ユーザー設定画面

## セットアップ

1. 依存パッケージのインストール:
```bash
npm install
```

2. データベースのセットアップ:
```bash
npx prisma migrate dev
```

3. 開発サーバーの起動:
```bash
npm run dev
```

## 使用技術

- Next.js 16
- Novel Editor (Notion風エディタ)
- Prisma (ORM)
- PostgreSQL
- NextAuth.js (認証)
- Material-UI
- Tailwind CSS v4

## エディタ機能

Novel エディタが提供する主な機能:
- リッチテキスト編集
- 見出し、リスト、引用、コードブロック
- 画像のアップロードとリサイズ
- タスクリスト

## 開発中の変更

- Tiptap エディタから Novel エディタに移行
- シンプルで安定した実装を優先
