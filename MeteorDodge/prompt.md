請幫我使用 JavaScript 製作一個「Dodge the Meteors」小遊戲，並能在 Replit 上直接執行。程式碼必須分為 index.html、style.css、game.js 三個檔案，並且能順利運作。不要出現 deltaTime 未定義的錯誤，請自行計算 deltaTime。

遊戲需求如下：

1. 基礎設定：
   - 使用 HTML + CSS + JavaScript。
   - 畫布 (canvas) 大小大約 400x600。
   - 玩家角色是一個小方塊或飛船（可先用顏色方塊表示，程式架構要能替換成圖片）。
   - 玩家可用左右方向鍵移動角色，不能超出畫布邊界。

2. 隕石：
   - 隕石從畫布頂端隨機生成位置並掉落。
   - 掉落速度隨時間逐漸加快。
   - 隕石可以旋轉（增加動畫效果）。
   - 如果角色碰到隕石 → 遊戲結束。

3. 加分系統：
   - 玩家存活時間越久，分數越高（例如每秒+1分）。
   - 畫面右上角顯示當前分數。
   - 遊戲結束後顯示最終分數與最高分。

4. Bonus 星星：
   - 偶爾生成 bonus 星星，從上往下掉落。
   - 玩家如果碰到星星，加 10 分。
   - 星星用黃色圓形或圖片表示。

5. 遊戲規則：
   - 當玩家撞到隕石 → 遊戲結束。
   - 遊戲結束時，畫面顯示「Game Over」與最終分數。
   - 玩家可按空白鍵重新開始遊戲。

6. 美術效果：
   - 背景使用漸層或星空風格（可以用 Canvas 畫星點）。
   - 玩家（飛船）、隕石、星星都先用簡單幾何圖形表示，但程式架構要能支援替換圖片。
   - 分數顯示使用 Google Fonts 卡通風格字體。

7. 技術細節：
   - 使用 requestAnimationFrame 建立遊戲迴圈。
   - 在遊戲迴圈中計算 deltaTime：
       let lastTime = 0;
       function gameLoop(timestamp) {
         let deltaTime = (timestamp - lastTime) / 1000;
         lastTime = timestamp;
         update(deltaTime);
         draw();
         requestAnimationFrame(gameLoop);
       }
   - update() 與 draw() 分開撰寫。
   - 玩家移動、隕石掉落、星星掉落的速度都要依照 deltaTime 計算，確保在不同電腦上速度一致。

請輸出完整的程式碼，並分別存成 index.html、style.css、game.js 三個檔案。我需要能直接將這三個檔案放進 Replit 執行並看到遊戲效果。
