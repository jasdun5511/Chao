const sunDisplay = document.getElementById('sun-display');
const scoreDisplay = document.getElementById('score-display');
const msgArea = document.getElementById('message-area');

let sun = 150; // 初始阳光
let score = 0;
let gameActive = true;
let selectedPlantType = null; // 当前选中的植物类型

// 植物数据配置
const plantStats = {
    'sunflower': { cost: 50, hp: 3, symbol: '🌻', name: '向日葵' },
    'pea':       { cost: 100, hp: 4, symbol: '🌱', name: '豌豆射手' },
    'ice':       { cost: 175, hp: 4, symbol: '🧊', name: '寒冰射手' },
    'nut':       { cost: 50, hp: 20, symbol: '🌰', name: '坚果墙' } // 高血量
};

// 游戏状态管理
// 创建5行数据 (0-4)
const lanes = Array(5).fill(null).map(() => ({
    plants: [], // 一行可以种多个植物吗？这里简化：一个格子一个植物。为了简单，我们还是假设一行只能种一个主力，但为了逻辑通用，我们用数组。
    // *修正*：为了简化操作，我们设定：一行点击任意位置都种在最左边。
    hasPlant: false, 
    plantObj: null, // 存储植物具体信息
    zombies: [],
    bullets: []
}));

// 1. 选择植物
function selectPlant(type) {
    if (!gameActive) return;
    
    // 检查钱够不够
    if (sun < plantStats[type].cost) {
        msgArea.textContent = "阳光不足！";
        msgArea.style.color = "red";
        setTimeout(() => msgArea.style.color = "#aaa", 1000);
        return;
    }

    selectedPlantType = type;
    
    // UI更新：高亮选中的卡片
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    document.getElementById('card-' + type).classList.add('selected');
    msgArea.textContent = `已选择: ${plantStats[type].name} (点击草坪种植)`;
}

// 2. 点击草坪种植
function handleLaneClick(laneIndex) {
    if (!gameActive || !selectedPlantType) return;
    
    const laneData = lanes[laneIndex];

    if (laneData.hasPlant) {
        msgArea.textContent = "这里已经有植物了！";
        return;
    }

    const stats = plantStats[selectedPlantType];

    // 再次扣款检查 (防止手速过快)
    if (sun < stats.cost) return;

    // 扣除阳光
    sun -= stats.cost;
    updateUI();

    // 放置植物 DOM
    const laneDiv = document.getElementById(`lane-${laneIndex}`);
    const plantDiv = document.createElement('div');
    plantDiv.classList.add('element', 'plant');
    plantDiv.textContent = stats.symbol;
    laneDiv.appendChild(plantDiv);

    // 记录数据
    const newPlant = {
        type: selectedPlantType,
        hp: stats.hp,
        element: plantDiv,
        laneIndex: laneIndex
    };

    laneData.hasPlant = true;
    laneData.plantObj = newPlant;

    // 启动植物特定技能
    activatePlantSkill(newPlant);

    // 重置选择
    selectedPlantType = null;
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    msgArea.textContent = "种植成功！";
}

// 3. 激活植物技能
function activatePlantSkill(plant) {
    // 向日葵：每5秒产25阳光
    if (plant.type === 'sunflower') {
        plant.timer = setInterval(() => {
            if (!gameActive || plant.hp <= 0) return;
            sun += 25;
            updateUI();
            // 视觉特效
            plant.element.style.textShadow = "0 0 20px yellow";
            setTimeout(() => plant.element.style.textShadow = "none", 500);
        }, 5000);
    }
    
    // 射手类：检测僵尸并射击
    if (plant.type === 'pea' || plant.type === 'ice') {
        plant.timer = setInterval(() => {
            if (!gameActive || plant.hp <= 0) return;
            
            // 只有当这一行有僵尸且僵尸在植物右边时才射击
            const laneZombies = lanes[plant.laneIndex].zombies;
            // 简单的判断：只要这行有僵尸就射击
            if (laneZombies.length > 0) {
                shoot(plant);
            }
        }, 1500); // 1.5秒一发
    }
}

function shoot(plant) {
    const laneDiv = document.getElementById(`lane-${plant.laneIndex}`);
    const bullet = document.createElement('div');
    bullet.classList.add('element', 'bullet');
    
    let isIce = (plant.type === 'ice');
    bullet.textContent = isIce ? '🔵' : '🟢'; // 冰豌豆是蓝色的
    bullet.style.left = '70px';

    laneDiv.appendChild(bullet);

    lanes[plant.laneIndex].bullets.push({
        element: bullet,
        pos: 70,
        isIce: isIce
    });
}

function updateUI() {
    sunDisplay.textContent = sun;
    scoreDisplay.textContent = score;
}

// 4. 生成僵尸
function spawnZombie() {
    if (!gameActive) return;

    const laneIndex = Math.floor(Math.random() * 5); // 0-4行
    const laneDiv = document.getElementById(`lane-${laneIndex}`);
    
    // 随机僵尸类型：30% 概率出路障僵尸
    const isConehead = Math.random() < 0.3;
    
    const zombieDiv = document.createElement('div');
    zombieDiv.classList.add('element', 'zombie');
    zombieDiv.textContent = isConehead ? '⛑️' : '🧟'; // 路障僵尸带个帽子
    zombieDiv.style.left = '800px';

    laneDiv.appendChild(zombieDiv);

    lanes[laneIndex].zombies.push({
        element: zombieDiv,
        pos: 800,
        hp: isConehead ? 12 : 6, // 路障血量加倍
        speed: isConehead ? 0.8 : 1.0, // 路障稍微慢一点
        isFrozen: false
    });
}

// 随着时间推移，僵尸生成越来越快
let spawnRate = 3000;
let gameTimer = 0;
function zombieSpawner() {
    if (!gameActive) return;
    spawnZombie();
    
    // 每30秒加快一点节奏
    gameTimer++;
    if (gameTimer % 10 === 0 && spawnRate > 1000) {
        spawnRate -= 200;
    }
    setTimeout(zo