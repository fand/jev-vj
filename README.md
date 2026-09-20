# Jev VJ

自然言語から素材とエフェクトを選ぶローカルVJプレーヤー。Jevが素材のメタデータと再生履歴から判断し、VFX-JSで14種類のエフェクトを適用する。手動調整・素材固定・相対指示にも対応。

## 起動

Node.js、Python 3.9以降、ffmpeg / ffprobeが必要。

```sh
git clone https://github.com/fand/jev-vj.git
cd jev-vj
npm ci
npm run build
cp .env.example .env
# .envのTYPESAFE_API_KEYを設定
python3 player_server.py --media-root /path/to/vj
```

[プレーヤー](http://127.0.0.1:4319/)を開く。素材動画は含まない。付属カタログに対応する素材をローカルへ配置するか、`clip-metadata/`のカタログを自分の素材に合わせて更新する。詳細は[PLAYER.md](PLAYER.md)。

```sh
npm run check
npm run test:twitch
npm run test:shift-glitch
python3 -m unittest discover -s . -p 'test_*.py' -v
```

## Resolume Arenaブリッジ

以下は旧OSCブリッジの使い方。ブラウザープレーヤーとは別に起動する。

テキスト指示 → Jevの4つのChoice → OSC。Python 3.9以降、追加パッケージ不要。

```sh
python3 server.py
```

http://127.0.0.1:4318 を開く。終了はターミナルのCtrl+C。

APIキーは環境変数 `TYPESAFE_API_KEY` → `.env` → 同じ親ディレクトリにある `jev-avatar-feed/.env`（ローカル開発用の後方互換） の順で取得。ブラウザには渡さない。`.env.example` を `.env` にコピーして自分のキーを設定してもよい。Jevへは指示と選択肢を送る。「そのまま／弱く／強く」の実際の操作はローカルの送信履歴からコードで解決する。

## 対象

Arena 7.3.2のExample / Generatorsデッキ用。OSC InputをON、ポート7000。`catalog.json` が素材の位置・説明・効果の対応表。Layer 1の5ソースとComposition Dashboardの8ノブを使用する。上位レイヤーは操作しないため、再生中だと映像が重なる。

- ソース：Metaballs、Lips、Line Scape、Spinner、Northern Light
- 効果：Clean、Kaleido、Mirror、Distort、Trails、RGB Split、Glitch
- 効果の強さ：弱／中／強、相対的に弱く／強く

効果選択時はDashboard 8ノブをまとめて書き換える（旧効果を置換）。上限は `catalog.json` で限定。ノブのリンク先を変えた場合も設定を更新する。ArenaのBeat Snapが有効ならクリップ発火はその設定に従う。

「映像はそのまま、効果を弱く」はこのアプリが最後に送った効果を調整する。未操作なら効果名の指定を求める。手動ノブ変更や別デッキへの切替は検出しない。**OSC送信成功はArenaの受信・描画成功を保証しない**。UIは送信履歴と明記している。

「待機中の指示を取消」はJev応答が後で届いても適用しない。送信済みの映像は維持。効果リセットも待機中の判断を取り消す。1リクエストずつ処理し、APIエラーや不正な選択ではOSCを送らない。UDP送信中の失敗は一部適用の可能性がある。

音声入力、音楽解析、予約、色指定、効果の自由な組合せ、素材の自動列挙は未実装。現時点では手書きカタログ。機能外の指示はJevのscope判断で実行を見送る（自然言語判断なので完全な保証ではない）。

HTTPは127.0.0.1だけにbind。Host・Origin・セッショントークンを検証。キーやログをブラウザ以外へ公開しない。アプリは任意OSCアドレスや外部ホスト指定を受け付けない。

## 検証

```sh
python3 -m unittest discover -s . -p 'test_*.py' -v
```

公式仕様：[TypeSafe API](https://docs.typesafe.ai/api)、[Choice](https://docs.typesafe.ai/primitives/choice)、[OSC](https://resolume.com/support/en/osc)。


## リポジトリに含めるもの

アプリのコード・テスト・文書・選択用メタデータのみ。APIキー、`.env`、素材動画、抽出フレーム、サムネイル、変換キャッシュ、検証用データは含めない。`.env.example`は空のテンプレート。

元の作業リポジトリの履歴には検証画像があるため、このGitHubリポジトリは素材を除いたスナップショットから開始した。今後も元リポジトリの履歴を直接pushせず、このリポジトリのcloneへコード変更だけを反映する。
