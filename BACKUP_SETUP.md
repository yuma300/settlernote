# バックアップシステムのセットアップ手順

このドキュメントでは、MySQLデータベースのバックアップを自動でGoogle Driveにアップロードする仕組みのセットアップ方法を説明します。

## 概要

- **バックアップ方法**: mysqldump + gzip圧縮
- **保存先**: Google Drive
- **スケジュール**: デフォルトで1日1回（カスタマイズ可能）
- **世代管理**: 7日分を保持（古いバックアップは自動削除）

## セットアップ手順

### 1. rcloneの設定

バックアップをGoogle Driveにアップロードするため、rcloneの設定が必要です。

#### 1.1. rclone設定ディレクトリを作成

```bash
mkdir -p rclone-config
```

#### 1.2. rclone設定を対話的に行う

一時的にコンテナを起動してrcloneを設定します：

```bash
# 一時的にコンテナを起動
docker-compose run --rm app sh

# コンテナ内でrclone設定を開始
rclone config

# 以下の手順で設定:
# 1. 'n' を入力（新しいリモートを作成）
# 2. name> gdrive （任意の名前、デフォルトは'gdrive'）
# 3. Storage> 18 （Google Driveを選択、番号は変わる可能性があります）
# 4. client_id> （空白のままEnter、またはGoogle Cloud Consoleで作成したOAuth IDを入力）
# 5. client_secret> （空白のままEnter、またはOAuth Secretを入力）
# 6. scope> 1 （Full access、または必要に応じて変更）
# 7. root_folder_id> （空白のままEnter）
# 8. service_account_file> （空白のままEnter）
# 9. Edit advanced config? n
# 10. Use auto config? n （ヘッドレスサーバーのため）
# 11. 表示されたURLをブラウザで開き、認証コードを取得
# 12. 認証コードを貼り付け
# 13. Configure this as a Shared Drive (Team Drive)? n
# 14. Yes this is OK
# 15. q でconfigを終了
# 16. exit でコンテナを終了
```

**重要**: ヘッドレスサーバーの場合、ローカルマシンでrclone設定を行い、生成された設定ファイルをサーバーにコピーする方が簡単です：

```bash
# ローカルマシンで（rcloneがインストールされている場合）
rclone config
# 上記の手順で設定

# 設定ファイルをサーバーにコピー
scp ~/.config/rclone/rclone.conf user@server:/path/to/settlernote/rclone-config/
```

### 2. .envファイルにバックアップ設定を追加

`.env`ファイルに以下を追加：

```bash
# Backup Configuration
BACKUP_ENABLED=true
# バックアップ間隔（秒）デフォルト: 86400 = 24時間
BACKUP_INTERVAL_SECONDS=86400
# Google Driveのリモート名（rclone configで設定した名前）
GDRIVE_REMOTE=gdrive
# Google Drive内のフォルダ名
GDRIVE_FOLDER=settlernote-backups
```

### 3. Dockerイメージを再ビルドして起動

```bash
# イメージを再ビルド
docker-compose build app

# コンテナを再起動
docker-compose up -d

# ログを確認してバックアップスケジューラーが起動したか確認
docker-compose logs app | grep -i backup
```

### 4. 手動バックアップのテスト

初回は手動でバックアップを実行してテストすることを推奨します：

```bash
# コンテナ内でバックアップスクリプトを実行
docker-compose exec app /app/scripts/backup.sh

# バックアップログを確認
docker-compose exec app cat /app/backups/backup.log

# ローカルバックアップファイルを確認
ls -lh backups/
```

### 5. Google Driveで確認

Google Driveにアクセスして、`settlernote-backups`フォルダ（またはGDRIVE_FOLDERで指定したフォルダ）にバックアップファイルがアップロードされているか確認します。

## バックアップのリストア方法

バックアップからデータベースをリストアする手順：

```bash
# 1. バックアップファイルを取得（Google Driveまたはローカルのbackupsフォルダから）
# 例: backups/settlernote_backup_20260106_020000.sql.gz

# 2. バックアップファイルを解凍してリストア
gunzip < backups/settlernote_backup_20260106_020000.sql.gz | \
  docker-compose exec -T mysql mysql -usettlernote -pEMN36uk923hziiBj settlernote

# または、コンテナ内で実行する場合
docker-compose exec app sh -c "gunzip < /app/backups/settlernote_backup_20260106_020000.sql.gz | \
  mysql -h mysql -u settlernote -pEMN36uk923hziiBj settlernote"
```

## トラブルシューティング

### バックアップが実行されない

```bash
# バックアップスケジューラーのログを確認
docker-compose logs app | grep -A 10 -B 10 backup

# BACKUP_ENABLEDがtrueになっているか確認
docker-compose exec app env | grep BACKUP
```

### Google Driveへのアップロードが失敗する

```bash
# rclone設定を確認
docker-compose exec app rclone config show

# Google Driveへの接続テスト
docker-compose exec app rclone lsd gdrive:

# rclone設定ファイルのパスを確認
docker-compose exec app ls -la /app/.config/rclone/
```

### ディスク容量の確認

```bash
# ローカルバックアップのサイズを確認
du -sh backups/

# Dockerボリュームの容量を確認
docker system df -v
```

## カスタマイズ

### バックアップ頻度の変更

`.env`ファイルで`BACKUP_INTERVAL_SECONDS`を変更：

```bash
# 12時間ごと
BACKUP_INTERVAL_SECONDS=43200

# 6時間ごと
BACKUP_INTERVAL_SECONDS=21600

# 1時間ごと（テスト用）
BACKUP_INTERVAL_SECONDS=3600
```

### 保持期間の変更

`scripts/backup.sh`の`DAYS_TO_KEEP`変数を編集：

```bash
DAYS_TO_KEEP=30  # 30日分保持
```

変更後、イメージを再ビルド：

```bash
docker-compose build app
docker-compose up -d
```

## セキュリティ注意事項

1. **rclone設定ファイルの保護**: `rclone-config/`ディレクトリは`.gitignore`に追加されていますが、適切な権限で保護してください。

2. **バックアップファイルの暗号化**: 機密性の高いデータの場合、バックアップファイルを暗号化することを推奨します。

3. **Google Drive認証**: OAuth認証を使用しているため、定期的にトークンの更新が必要になる場合があります。

## モニタリング

バックアップの状態を定期的に確認することを推奨します：

```bash
# 最新のバックアップログを確認
docker-compose exec app tail -50 /app/backups/backup.log

# ローカルバックアップファイルのリスト
ls -lht backups/ | head -10

# Google Drive上のバックアップを確認
docker-compose exec app rclone ls gdrive:settlernote-backups/
```
