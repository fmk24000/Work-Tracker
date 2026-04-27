# Work Tracker（中文版）

Work Tracker 係一個用 Next.js 建立嘅任務追蹤系統，採用「Main item / Sub item」結構，方便團隊做日常執行追蹤、狀態更新同輕量報表。

## 介紹（Introduction）

本專案包含以下功能：

- Main item / Sub item 任務管理
- 以人員為單位切換追蹤看板
- Gantt 風格月/週時間軸視圖
- 優先級評分（Urgency x Importance）
- CSV 匯出
- JSON 備份與匯入
- Google Sheets Webhook 匯出
- 深色 / 淺色模式切換
- 透過 Docker Volume 做伺服器端資料持久化

## 使用說明（Instructions）

### 1. 用 Docker 執行（建議）

```bash
docker compose up -d --build
```

開啟：

```txt
http://localhost:31005
```

停止：

```bash
docker compose down
```

### 2. 本機直接執行（不使用 Docker）

```bash
npm install
npm run dev
```

開啟：

```txt
http://localhost:31005
```

### 3. Production Build

```bash
npm run build
npm run start
```

## 資料存放（Data Persistence）

使用 Docker 時，資料會儲存在：

- Container 路徑：`/app/data/tracker-data.json`
- Docker Volume：`programme_tracker_data`

## 版本發佈（Release）

- 初始版本：`v0.0.1`
- Release 內已包含 source code 壓縮檔，以及 GitHub 自動產生嘅 source archives
