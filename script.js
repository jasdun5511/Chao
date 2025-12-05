const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
let score = 0;
let gameActive = true;

// 游戏状态存储
const lanes = [
    { hasPlant: false, zombies: [], bullets: [] },
    { hasPlant: false, zombies: [], bullets: [] },
    { hasPlant: false, zombies: [], bullets: [] }
];

// 1. 玩家点击种植植物
function plantShooter(laneIndex) {
    if (!gameActive) return;
    
    // 如果这一行已经有植物了，就不让种了
    if (lanes[laneIndex].hasPlant) return;

    // 创建植物元素 (使用 Emoji)
    const plant = document.createElement('div');
    plant.classList.add('element', 'plant');
    plant.textContent = '🌻'; 
    
    // 放入对应的行
    document.getElementById(`lane-${laneIndex}`).appendChild(plant);
    lanes[laneIndex].hasPlant = true;

    // 启动这株植物的射击定时器
    startShooting(laneIndex);
}

// 2. 植物自动射击
function startShooting(laneIndex) {
    setInterval(() => {
        if (!gameActive) return;
        // 创建子弹
        const bullet = document.createElement('div');
        bullet.classList.add('element', 'bullet');
        bullet.textContent = '🟢'; // 豌豆
        bullet.style.left = '60px'; // 从植物前面一点发出
        
        document.getElementById(`lane-${laneIndex}`).appendChild(bullet);
        
        // 记录子弹信息
        const bulletObj = { element: bullet, position: 60 };
        lanes[laneIndex].bullets.push(bulletObj);

    }, 1500); // 每 1.5 秒发射一次
}

// 3. 生成僵尸
function spawnZombie() {
    if (!gameActive) return;

    // 随机选择 0, 1, 或 2 行
    const laneIndex = Math.floor(Math.random() * 3);
    
    const zombie = document.createElement('div');
    zombie.classList.add('element', 'zombie');
    zombie.textContent = '🧟';
    zombie.style.left = '600px'; // 起始位置在最右边
    
    document.getElementById(`lane-${laneIndex}`).appendChild(zombie);

    const zombieObj = { element: zombie, position: 600, hp: 3 }; // hp 是血量
    lanes[laneIndex].zombies.push(zombieObj);
}

// 每 3 秒生成一个僵尸
setInterval(spawnZombie, 3000);

// 4. 游戏主循环 (负责移动子弹、僵尸和检测碰撞)
function gameLoop() {
    if (!gameActive) return;

    lanes.forEach((lane, laneIndex) => {
        
        // --- 移动子弹 ---
        for (let i = lane.bullets.length - 1; i >= 0; i--) {
            let b = lane.bullets[i];
            b.position += 5; // 子弹速度
            b.element.style.left = b.position + 'px';

            // 如果子弹飞出屏幕，移除它
            if (b.position > 600) {
                b.element.remove();
                lane.bullets.splice(i, 1);
            }
        }

        // --- 移动僵尸 ---
        for (let i = lane.zombies.length - 1; i >= 0; i--) {
            let z = lane.zombies[i];
            z.position -= 1.5; // 僵尸移动速度 (越小越慢)
            z.element.style.left = z.position + 'px';

            // 检查游戏结束 (僵尸到达左侧)
            if (z.position < 0) {
                gameOver();
            }

            // --- 碰撞检测 (子弹打僵尸) ---
            for (let j = lane.bullets.length - 1; j >= 0; j--) {
                let b = lane.bullets[j];
                // 如果子弹的位置 >= 僵尸的位置
                if (b.position >= z.position && b.position <= z.position + 50) {
                    // 击中！
                    
                    // 1. 移除子弹
                    b.element.remove();
                    lane.bullets.splice(j, 1);

                    // 2. 僵尸扣血
                    z.hp--;
                    // 视觉反馈：稍微变透明一下
                    z.element.style.opacity = '0.5';
                    setTimeout(() => z.element.style.opacity = '1', 100);

                    // 3. 僵尸死亡
                    if (z.hp <= 0) {
                        z.element.textContent = '💥'; // 爆炸效果
                        setTimeout(() => {
                            z.element.remove();
                        }, 200);
                        lane.zombies.splice(i, 1);
                        
                        // 加分
                        score += 10;
                        scoreElement.textContent = score;
                    }
                    break; // 子弹打中一个就消失，跳出子弹循环
                }
            }
        }
    });

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    alert('游戏结束！僵尸吃掉了你的脑子！最终得分: ' + score);
    location.reload(); // 刷新页面重新开始
}

// 启动游戏循环
gameLoop();
