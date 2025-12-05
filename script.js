document.addEventListener('DOMContentLoaded', () => {
    const sunCountSpan = document.getElementById('sun-count');
    const gameGrid = document.getElementById('game-grid');
    const plantPeashooterBtn = document.getElementById('plant-peashooter-btn');
    const gameMessage = document.getElementById('game-message');
    
    // --- 游戏状态和配置 ---
    let sunCount = 100;
    let isPlanting = false;
    const PEASHOOTER_COST = 50;
    const GRID_ROWS = 5;
    const GRID_COLS = 9;
    const CELL_WIDTH = 100; // 对应 CSS 中每列的宽度
    const PEA_SPEED = 5; // 豌豆每帧移动的像素
    const ZOMBIE_SPEED = 0.5; // 僵尸每帧移动的像素
    
    // 存储植物、僵尸和豌豆的数组
    const plants = []; // [{row: 0, col: 1, element: div, health: 100, attack: 10}]
    const zombies = []; // [{row: 0, element: div, health: 50, attack: 5, x: 800}]
    const peas = []; // [{row: 0, x: 100, element: div, attack: 10}]

    // --- 核心游戏功能 ---

    // 1. 初始化网格
    function initGrid() {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', handleCellClick);
                gameGrid.appendChild(cell);
            }
        }
    }

    // 2. 更新阳光数量
    function updateSun(amount) {
        sunCount += amount;
        sunCountSpan.textContent = sunCount;
    }

    // 3. 种植植物
    function handleCellClick(e) {
        const cell = e.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // 检查该格子是否已经有植物
        if (plants.some(p => p.row === row && p.col === col)) {
            setMessage("这个格子已经有植物了！");
            isPlanting = false;
            return;
        }

        if (isPlanting) {
            if (sunCount >= PEASHOOTER_COST) {
                // 种植豌豆射手
                const plant = document.createElement('div');
                plant.classList.add('plant', 'peashooter');
                plant.textContent = '🌵';
                cell.appendChild(plant);

                // 注册植物数据
                plants.push({
                    row: row,
                    col: col,
                    element: plant,
                    health: 100,
                    attack: 10,
                    lastShot: Date.now() // 记录上次射击时间
                });

                updateSun(-PEASHOOTER_COST);
                setMessage(`在 (行${row}, 列${col}) 种植了豌豆射手！`);
            } else {
                setMessage("阳光不足！");
            }
            isPlanting = false;
        }
    }

    // 4. 豌豆射手按钮点击
    plantPeashooterBtn.addEventListener('click', () => {
        if (sunCount >= PEASHOOTER_COST) {
            isPlanting = true;
            setMessage("请点击网格种植豌豆射手！");
        } else {
            setMessage("阳光不足，无法种植！");
        }
    });

    // 5. 僵尸生成 (每 8 秒生成一个)
    function spawnZombie() {
        const randomRow = Math.floor(Math.random() * GRID_ROWS);
        
        const zombieEl = document.createElement('div');
        zombieEl.classList.add('zombie', 'basic-zombie');
        zombieEl.textContent = '🧟';
        
        // 初始位置在最右侧（第 9 列的右边）
        const startX = GRID_COLS * CELL_WIDTH; // 900px
        zombieEl.style.left = `${startX}px`;
        zombieEl.style.top = `${randomRow * 100 + 5}px`; // 调整到行内居中
        
        gameGrid.appendChild(zombieEl);

        zombies.push({
            row: randomRow,
            element: zombieEl,
            health: 50,
            attack: 5,
            x: startX 
        });
    }
    
    // 6. 游戏消息
    function setMessage(msg) {
        gameMessage.textContent = msg;
    }

    // --- 游戏循环/动画 ---
    
    // 核心循环：处理所有动画和逻辑
    function gameLoop() {
        // 移动僵尸、豌豆，处理射击和碰撞
        
        // ** A. 豌豆射击逻辑 **
        plants.forEach(plant => {
            // 简单判断：只要这一行有僵尸，就射击
            if (zombies.some(z => z.row === plant.row)) {
                const now = Date.now();
                // 射击频率控制（每 2 秒射击一次）
                if (now - plant.lastShot > 2000) { 
                    shootPea(plant);
                    plant.lastShot = now;
                }
            }
        });

        // ** B. 豌豆移动和碰撞检测 **
        for (let i = peas.length - 1; i >= 0; i--) {
            const pea = peas[i];
            pea.x += PEA_SPEED;
            pea.element.style.left = `${pea.x}px`;
            
            // 豌豆是否出界？
            if (pea.x > GRID_COLS * CELL_WIDTH) {
                pea.element.remove();
                peas.splice(i, 1);
                continue;
            }

            // 碰撞检测：豌豆与僵尸
            let hit = false;
            for (let j = zombies.length - 1; j >= 0; j--) {
                const zombie = zombies[j];
                // 简单碰撞检测：豌豆x位置 >= 僵尸x位置
                if (zombie.row === pea.row && pea.x >= zombie.x) {
                    zombie.health -= pea.attack;
                    