# VPSデプロイ手順書

このドキュメントでは、SettlerNoteアプリケーションをVPSにデプロイし、`https://notedev.settler.cc/` でアクセスできるようにする手順を説明します。

**注**: HTTPS対応はCloudflareで行うため、VPS側はHTTP接続のみとなります。

## 前提条件

- VPSサーバー（Ubuntu 22.04 LTS推奨）
- Cloudflareアカウント
- ドメイン `settler.cc` がCloudflareで管理されている
- root権限またはsudo権限

## 1. VPSの初期セットアップ

### 1.1 サーバーにSSHで接続

```bash
ssh root@your-vps-ip
```

### 1.2 必要なパッケージのインストール

```bash
# システムを最新化
apt update && apt upgrade -y

# Dockerのインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Composeのインストール
apt install docker-compose -y

# Gitのインストール
apt install git -y
```

### 1.3 ファイアウォールの設定

```bash
# UFWを有効化
ufw allow OpenSSH
ufw allow 80/tcp
ufw enable
```

**注**: HTTPSはCloudflareが処理するため、VPSではポート80のみ開放します。

## 2. Cloudflare DNS設定

### 2.1 DNSレコードの追加

Cloudflareダッシュボードで以下のDNSレコードを追加:

- **Type**: A
- **Name**: notedev
- **Content**: VPSのIPアドレス
- **Proxy status**: Proxied（オレンジ色の雲アイコン）

### 2.2 SSL/TLS設定

Cloudflareダッシュボード > SSL/TLS:

- **SSL/TLS暗号化モード**: "Flexible" を選択
  - VPS側はHTTP、Cloudflare-ブラウザ間はHTTPS

または

- **SSL/TLS暗号化モード**: "Full" を選択する場合
  - VPS側でも自己署名証明書が必要（より安全）

推奨は "Flexible" モードでシンプルに開始することです。

## 3. Docker Composeの構成について

このアプリケーションは、以下の3つのコンテナで構成されています：

1. **MySQL**: データベース（ポート3306）
2. **App**: Next.jsアプリケーション（ポート3000）
3. **Nginx**: リバースプロキシ（ポート80）

**重要**: Nginxはdocker-compose.ymlに含まれているため、**別途インストールや設定は不要**です。`docker-compose up`コマンドを実行すると、3つのコンテナすべてが自動的に起動します。

```
ブラウザ → Cloudflare (HTTPS) → VPS Nginx (HTTP) → Next.jsアプリ → MySQL
```

## 4. アプリケーションのデプロイ

### 4.1 リポジトリのクローン

```bash
# 作業ディレクトリを作成
mkdir -p /opt/apps
cd /opt/apps

# リポジトリをクローン（GitHubなどにpushしている場合）
git clone <your-repository-url> settlernote
cd settlernote

# または、ローカルからSCPでファイルを転送
# scp -r /path/to/settlernote root@your-vps-ip:/opt/apps/
```

### 4.2 環境変数の設定

```bash
# .env.productionファイルを編集
nano .env.production
```

以下の値を設定してください:

```bash
# データベースパスワード（強力なものに変更）
MYSQL_ROOT_PASSWORD=<強力なパスワード>
MYSQL_PASSWORD=<強力なパスワード>

# DATABASE_URLも同じパスワードに更新
DATABASE_URL="mysql://settlernote_user:<上記と同じパスワード>@mysql:3306/settlernote"

# NextAuth URL（CloudflareのHTTPS URLを指定）
NEXTAUTH_URL=https://notedev.settler.cc

# NextAuth Secret（ランダムな文字列を生成）
NEXTAUTH_SECRET=<ランダムな文字列>

# Google OAuth認証情報
GOOGLE_CLIENT_ID=<Google Cloud Consoleから取得>
GOOGLE_CLIENT_SECRET=<Google Cloud Consoleから取得>
```

**NextAuth Secretの生成方法:**
```bash
openssl rand -base64 32
```

### 4.3 Google OAuth設定

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) にアクセス
2. 新しいOAuth 2.0クライアントIDを作成
3. **承認済みのリダイレクトURI** に以下を追加:
   ```
   https://notedev.settler.cc/api/auth/callback/google
   ```
4. クライアントIDとシークレットを `.env.production` に設定

## 5. アプリケーションの起動

### 5.1 Docker Composeで起動

この単一のコマンドで、MySQL、Next.jsアプリ、Nginxの**3つすべてのコンテナが自動的に起動**します。

```bash
cd /opt/apps/settlernote

# 環境変数を読み込んで起動（初回はイメージのビルドに数分かかります）
docker-compose --env-file .env.production up -d
```

起動後、以下のコンテナが動作します：
- `settlernote-mysql`: MySQLデータベース
- `settlernote-app`: Next.jsアプリケーション
- `settlernote-nginx`: Nginxリバースプロキシ

### 5.2 データベースのマイグレーション

アプリケーションが起動すると、`docker-entrypoint.sh` が自動的にマイグレーションを実行します。

手動で実行する場合:

```bash
docker-compose exec app npx prisma migrate deploy
```

## 6. 動作確認

### 6.1 コンテナの状態確認

```bash
docker-compose ps
```

すべてのコンテナが `Up` 状態であることを確認してください。

### 6.2 ログの確認

```bash
# アプリケーションログ
docker-compose logs -f app

# Nginxログ
docker-compose logs -f nginx

# データベースログ
docker-compose logs -f mysql
```

### 6.3 ブラウザでアクセス

`https://notedev.settler.cc/` にアクセスして、アプリケーションが正常に動作することを確認してください。

**注**: HTTPSはCloudflareが自動的に処理します。

## 7. 運用コマンド

### アプリケーションの起動

```bash
cd /opt/apps/settlernote
docker-compose --env-file .env.production up -d
```

### アプリケーションの停止

```bash
docker-compose down
```

### アプリケーションの再起動

```bash
docker-compose restart
```

### ログの確認

```bash
# すべてのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f app
```

### データベースバックアップ

```bash
# バックアップの作成
docker-compose exec mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} settlernote > backup-$(date +%Y%m%d-%H%M%S).sql

# バックアップからの復元
docker-compose exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} settlernote < backup-20240101-120000.sql
```

### アプリケーションの更新

```bash
cd /opt/apps/settlernote

# 最新のコードを取得
git pull

# コンテナを再ビルドして起動
docker-compose --env-file .env.production up -d --build
```

## 8. トラブルシューティング

### アプリケーションが起動しない

```bash
# ログを確認
docker-compose logs app

# データベース接続を確認
docker-compose exec app npx prisma db pull
```

### Nginxの設定エラー

```bash
# 設定ファイルの構文チェック
docker-compose exec nginx nginx -t

# Nginxを再起動
docker-compose restart nginx
```

### Cloudflare関連の問題

1. **リダイレクトループが発生する場合**
   - CloudflareのSSL/TLS設定を "Flexible" に変更

2. **HTTPSでアクセスできない場合**
   - CloudflareのDNSレコードがProxied（オレンジ色の雲）になっているか確認
   - DNSの伝播を待つ（最大48時間、通常は数分）

3. **NextAuthのコールバックエラー**
   - `.env.production`の`NEXTAUTH_URL`が`https://notedev.settler.cc`になっているか確認
   - Google Cloud ConsoleのリダイレクトURIが正しいか確認

## 9. セキュリティ上の注意

1. **パスワード管理**
   - `.env.production` ファイルは絶対にGitにコミットしない
   - 強力なパスワードを使用する

2. **ファイアウォール**
   - 必要なポート（22, 80）のみを開放
   - SSH接続は公開鍵認証を推奨

3. **Cloudflare設定**
   - DDoS保護が自動的に有効
   - ファイアウォールルールで不正アクセスをブロック可能
   - Bot対策を有効化することを推奨

4. **定期的な更新**
   - システムパッケージを定期的に更新
   - Dockerイメージを定期的に更新

5. **バックアップ**
   - データベースの定期バックアップを設定
   - cronで自動バックアップを実行

## 10. 自動バックアップの設定（推奨）

```bash
# バックアップスクリプトの作成
cat > /opt/apps/settlernote/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/settlernote"
DATE=$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

cd /opt/apps/settlernote
source .env.production

docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} settlernote | gzip > $BACKUP_DIR/backup-$DATE.sql.gz

# 30日以上古いバックアップを削除
find $BACKUP_DIR -name "backup-*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/apps/settlernote/backup.sh

# cronに登録（毎日午前2時に実行）
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/apps/settlernote/backup.sh") | crontab -
```

## 11. Cloudflareの追加機能（オプション）

Cloudflareダッシュボードから以下の機能を有効化できます:

- **キャッシング**: 静的コンテンツのキャッシュで高速化
- **Page Rules**: 特定のURLに対するルール設定
- **Web Application Firewall (WAF)**: 高度なセキュリティ保護
- **Analytics**: アクセス解析

## 12. 監視とアラート（オプション）

本番環境では、以下のような監視ツールの導入を検討してください:

- **Uptime監視**: UptimeRobot, Pingdom, Cloudflare Health Checks
- **リソース監視**: Prometheus + Grafana
- **ログ監視**: Loki, ELK Stack
- **エラー追跡**: Sentry

## サポート

問題が発生した場合は、以下を確認してください:

1. コンテナのログ: `docker-compose logs -f`
2. システムリソース: `htop` または `docker stats`
3. ディスク容量: `df -h`
4. Cloudflareのステータス: https://www.cloudflarestatus.com/

---

デプロイが完了したら、`https://notedev.settler.cc/` からアクセスできます。
