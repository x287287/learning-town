# 學習冒險城

給國小六年級與國中三年級學生的 3D 學習冒險遊戲（three.js）。

- 遊戲：https://x287287.github.io/learning-town/
- 老師查看頁：https://x287287.github.io/learning-town/teacher.html （要老師密碼）
- 雲端存檔：Supabase（帳號＋密碼）
- 3D 模型：KayKit（Kay Lousberg）、Quaternius，皆為 CC0；玩家角色來自「冒險者角色編輯器」（KayKit Adventurers 改作）

## 檔案結構

| 路徑 | 內容 |
|---|---|
| `index.html` | 頁面骨架（HUD、面板、創角畫面等 HTML），依序載入 css 與 js |
| `css/game.css` | 全部樣式 |
| `js/01-data.js` | 共用小工具與遊戲資料：科目、職業與職業特性、角色編輯器零件與價格、裝備、商品、成就、地點 |
| `js/02-save.js` | 存檔：多位冒險者、學習階段切換、存檔修正、金幣收支、學習紀錄（錯題本、答題統計） |
| `js/03-engine.js` | three.js 場景、燈光、模型包載入、程式產生的貼圖與文字 |
| `js/04-characters.js` | 角色：KayKit 角色組裝、角色編輯器零件化角色、動畫 |
| `js/05-world.js` | 城鎮：建築、布告欄、傳送門、NPC 與對話內容 |
| `js/06-player-input.js` | 玩家角色、鍵盤／滑鼠／觸控搖桿、碰撞 |
| `js/07-ui.js` | 對話框、各種面板（委託、市集、背包、日誌、成就、說明）、HUD、提示訊息、解鎖說明 |
| `js/08-creator.js` | 創角與裁縫屋（角色編輯器介面、試穿與購買） |
| `js/09-loop.js` | 互動區、小地圖、主迴圈 tick、玩家與 NPC 移動 |
| `js/10-subjects.js` | 科目題庫狀態、學習階段套用、各科主題設定 |
| `js/11-maps.js` | 五科試煉地圖：怪物、地面、場景、魔王寶箱、傳送與遺跡小地圖 |
| `js/12-battle.js` | 戰鬥：開始、出題、新題型（判斷、輸入、配對、排序）、結算、勝負、星星與連擊 |
| `js/13-battle-fx.js` | 武器攻擊特效（光球、箭、劍氣、音符、爆炸） |
| `js/14-audio.js` | 音效與背景音樂（Web Audio 合成）、英語朗讀 |
| `js/15-shop-items.js` | 名牌框、背包道具、煙火、流浪商人 |
| `js/16-backup.js` | 存檔備份與還原 |
| `js/17-cloud.js` | Supabase 雲端存檔：帳號、登入、同步、衝突處理 |
| `js/18-rest-week.js` | 休息提醒、每週主題 |
| `js/19-animals.js` | 城鎮動物 |
| `js/20-library.js` | 大圖書館：影片播放器與圖解 |
| `js/21-practice.js` | 訓練場、練習新題型、通用答題面板、錯題小精靈、每日挑戰 |
| `js/22-pets.js` | 寵物：資料、跟隨、寵物小屋、領養、寵物進化 |
| `js/23-job.js` | 職業導師（轉職） |
| `js/24-guides.js` | 各科地圖嚮導 |
| `js/25-dex-report.js` | 怪物圖鑑、我的學習報告 |
| `js/26-tour.js` | 新手導覽 |
| `js/27-bigmap-nav.js` | 大地圖與自動導航 |
| `js/28-picker.js` | 冒險者選擇畫面 |
| `js/29-update.js` | 版本更新公告 |
| `js/30-boot.js` | 啟動：載入模型包、建立世界、進入冒險者、測試用介面 |
| `teacher.html` | 老師查看頁（獨立頁面，遊戲裡沒有連結） |
| `version.json` | 版本號與給學生看的更新公告 |
| `data/*.json` | 題庫與圖書館影片：國小五科（`math.json` 等）、國中五科（`jh-*.json`） |
| `assets/*.pack.wasm` | 3D 模型包（多個 GLB 串在一起） |
| `tools/release.py` | 發布新版本時更新版本號與公告 |

## 程式的寫法

- `js/` 的檔案是一般的 `<script>`（不是模組），共用同一個全域範圍，所以 A 檔可以直接呼叫 B 檔的函式。
- 載入順序就是 `index.html` 列出的順序（檔名前面的編號）。**檔案最外層直接執行的程式碼**只能用到同一個檔案或前面檔案宣告的東西；寫在函式裡、等遊戲開始後才執行的程式碼就沒有這個限制。
- 遊戲真正開始是在最後一個檔案 `30-boot.js`：載入模型包、建立城鎮、開啟冒險者選擇畫面。
- 測試用介面在 `window.__town`（`30-boot.js` 最後）。

## 發布新版本

1. 修改程式或題庫。
2. 在儲存庫根目錄執行 `python3 tools/release.py "公告標題" "第一點" "第二點"`：版本號加 1、加入更新公告、更新 `index.html` 裡的 `?v=`。
3. `git commit` 後 `git push` 到 main，GitHub Pages 約一兩分鐘後更新。玩家的遊戲會跳出「有新版本」提示。

只改題庫（`data/*.json`）時不一定要發新版本，但玩家要重新整理才會拿到新題目。
