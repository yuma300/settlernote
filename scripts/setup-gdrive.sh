#!/bin/bash
set -e

echo "Google Drive バックアップ設定セットアップ"
echo "=========================================="
echo ""
echo "このスクリプトは、Google Driveとの認証を設定します。"
echo ""
echo "手順:"
echo "1. rclone config を実行"
echo "2. 表示されるURLをブラウザで開く"
echo "3. Googleアカウントでログイン"
echo "4. 認証コードをコピーして貼り付け"
echo ""
read -p "続行しますか？ (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "rclone config を起動します..."
echo "以下の設定を入力してください:"
echo ""
echo "n (新しいリモート)"
echo "name> gdrive"
echo "Storage> 番号を選択 (Google Drive, 通常15-18)"
echo "client_id> (空白のままEnter)"
echo "client_secret> (空白のままEnter)"
echo "scope> 1"
echo "root_folder_id> (空白のままEnter)"
echo "service_account_file> (空白のままEnter)"
echo "advanced config> n"
echo "auto config> n (重要!)"
echo "その後、表示されるURLをブラウザで開いて認証コードを取得"
echo ""
read -p "理解しました。続行します (Enter キーを押す)"

# docker-composeでrclone configを実行
docker-compose run --rm --entrypoint "" app sh -c "RCLONE_CONFIG=./rclone-config/rclone.conf rclone config"

echo ""
echo "=========================================="
echo "設定が完了しました！"
echo ""
echo "次のステップ:"
echo "1. .env ファイルで BACKUP_ENABLED=true に変更"
echo "2. docker-compose restart app を実行"
echo ""
