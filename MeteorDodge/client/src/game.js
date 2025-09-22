// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 200; // pixels per second
const METEOR_MIN_SPEED = 100;
const METEOR_MAX_SPEED = 300;
const METEOR_ACCELERATION = 20; // speed increase per second
const STAR_SPEED = 150;
const METEOR_SPAWN_RATE = 1.0; // meteors per second initially
const STAR_SPAWN_RATE = 0.3; // stars per second
const SCORE_PER_SECOND = 1;
const STAR_BONUS = 10;

// Game variables
let canvas, ctx;
let lastTime = 0;
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let bestScore = 0;
let gameTime = 0;
let meteorSpawnTimer = 0;
let starSpawnTimer = 0;
let scoreTimer = 0;

// Audio system
let sounds = {
    background: null,
    hit: [],
    success: []
};
let isMuted = false;
let audioUnlocked = false;

// Game objects
let player = {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED
};

let meteors = [];
let stars = [];
let starField = [];

// Input handling
let keys = {
    left: false,
    right: false,
    space: false
};

// Initialize the game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Initialize audio system
    initAudio();
    
    // Load best score from localStorage
    bestScore = parseInt(localStorage.getItem('bestScore') || '0');
    document.getElementById('bestScore').textContent = bestScore;
    
    // Create starfield background
    createStarField();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

function initAudio() {
    // Load background music
    sounds.background = new Audio('/sounds/background.mp3');
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.preload = 'auto';
    sounds.background.onerror = () => console.log('Could not load background music');
    
    // Create sound effect pools for overlapping playback
    for (let i = 0; i < 3; i++) {
        let hitSound = new Audio('/sounds/hit.mp3');
        hitSound.volume = 0.7;
        hitSound.preload = 'auto';
        hitSound.onerror = () => console.log('Could not load hit sound');
        sounds.hit.push(hitSound);
        
        let successSound = new Audio('/sounds/success.mp3');
        successSound.volume = 0.6;
        successSound.preload = 'auto';
        successSound.onerror = () => console.log('Could not load success sound');
        sounds.success.push(successSound);
    }
}

function playSound(soundName) {
    if (isMuted || !audioUnlocked || !sounds[soundName]) return;
    
    try {
        // For sound effect pools, find an available sound or create a clone
        if (Array.isArray(sounds[soundName])) {
            let availableSound = sounds[soundName].find(audio => audio.ended || audio.paused);
            if (!availableSound) {
                // If pool is exhausted, clone the first sound for better overlap
                availableSound = sounds[soundName][0].cloneNode();
                availableSound.volume = sounds[soundName][0].volume;
            }
            availableSound.currentTime = 0;
            availableSound.play().catch(e => {
                console.log(`Could not play sound: ${soundName}`);
            });
        }
    } catch (e) {
        console.log(`Error playing sound: ${soundName}`);
    }
}

function unlockAudio() {
    if (audioUnlocked) return;
    
    audioUnlocked = true;
    console.log('Audio unlocked');
}

function startBackgroundMusic() {
    if (isMuted || !audioUnlocked || !sounds.background) return;
    
    try {
        sounds.background.play().catch(e => {
            console.log('Could not start background music');
        });
    } catch (e) {
        console.log('Error starting background music');
    }
}

function stopBackgroundMusic() {
    if (sounds.background) {
        sounds.background.pause();
        sounds.background.currentTime = 0;
    }
}

function createStarField() {
    starField = [];
    for (let i = 0; i < 100; i++) {
        starField.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 2 + 1
        });
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        // Unlock audio on first user interaction
        unlockAudio();
        
        switch(e.code) {
            case 'ArrowLeft':
                keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                keys.right = true;
                e.preventDefault();
                break;
            case 'Space':
                // Handle spacebar for game start/restart directly in event handler
                if (gameState === 'start') {
                    startGame();
                    startBackgroundMusic();
                } else if (gameState === 'gameOver') {
                    restartGame();
                    startBackgroundMusic();
                }
                keys.space = true;
                e.preventDefault();
                break;
        }
    });
    
    // Add touch/click support for mobile
    document.addEventListener('click', (e) => {
        unlockAudio();
        if (gameState === 'start') {
            startGame();
            startBackgroundMusic();
        } else if (gameState === 'gameOver') {
            restartGame();
        }
    });
    
    document.addEventListener('touchstart', (e) => {
        unlockAudio();
        if (gameState === 'start') {
            startGame();
            startBackgroundMusic();
        } else if (gameState === 'gameOver') {
            restartGame();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'ArrowRight':
                keys.right = false;
                break;
            case 'Space':
                keys.space = false;
                break;
        }
    });
}

function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    // Limit deltaTime to prevent large jumps
    deltaTime = Math.min(deltaTime, 0.1);
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    if (gameState === 'start') {
        updateStarField(deltaTime);
    } else if (gameState === 'playing') {
        updatePlayer(deltaTime);
        updateMeteors(deltaTime);
        updateStars(deltaTime);
        updateStarField(deltaTime);
        updateSpawning(deltaTime);
        updateScore(deltaTime);
        checkCollisions();
    } else if (gameState === 'gameOver') {
        updateStarField(deltaTime);
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    gameTime = 0;
    meteors = [];
    stars = [];
    meteorSpawnTimer = 0;
    starSpawnTimer = 0;
    scoreTimer = 0;
    
    // Reset player position
    player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    
    // Hide start screen
    document.getElementById('startScreen').classList.add('hidden');
    
    updateScoreDisplay();
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    startGame();
}

function endGame() {
    gameState = 'gameOver';
    
    // Stop background music and play hit sound
    stopBackgroundMusic();
    playSound('hit');
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore.toString());
    }
    
    // Show game over screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('bestScore').textContent = bestScore;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function updatePlayer(deltaTime) {
    if (keys.left && player.x > 0) {
        player.x -= player.speed * deltaTime;
    }
    if (keys.right && player.x < CANVAS_WIDTH - player.width) {
        player.x += player.speed * deltaTime;
    }
    
    // Keep player within bounds
    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
}

function updateMeteors(deltaTime) {
    for (let i = meteors.length - 1; i >= 0; i--) {
        let meteor = meteors[i];
        
        // Update position
        meteor.y += meteor.speed * deltaTime;
        
        // Update rotation
        meteor.rotation += meteor.rotationSpeed * deltaTime;
        
        // Increase speed over time
        meteor.speed += METEOR_ACCELERATION * deltaTime;
        
        // Remove meteors that are off screen
        if (meteor.y > CANVAS_HEIGHT + meteor.size) {
            meteors.splice(i, 1);
        }
    }
}

function updateStars(deltaTime) {
    for (let i = stars.length - 1; i >= 0; i--) {
        let star = stars[i];
        
        // Update position
        star.y += star.speed * deltaTime;
        
        // Update rotation for sparkle effect
        star.rotation += star.rotationSpeed * deltaTime;
        
        // Remove stars that are off screen
        if (star.y > CANVAS_HEIGHT + star.size) {
            stars.splice(i, 1);
        }
    }
}

function updateStarField(deltaTime) {
    for (let star of starField) {
        // Twinkling effect
        star.opacity += Math.sin(gameTime * star.twinkleSpeed) * 0.01;
        star.opacity = Math.max(0.1, Math.min(1, star.opacity));
    }
}

function updateSpawning(deltaTime) {
    gameTime += deltaTime;
    
    // Spawn meteors
    meteorSpawnTimer += deltaTime;
    let currentMeteorSpawnRate = METEOR_SPAWN_RATE + gameTime * 0.1; // Increase spawn rate over time
    if (meteorSpawnTimer >= 1 / currentMeteorSpawnRate) {
        spawnMeteor();
        meteorSpawnTimer = 0;
    }
    
    // Spawn stars
    starSpawnTimer += deltaTime;
    if (starSpawnTimer >= 1 / STAR_SPAWN_RATE) {
        if (Math.random() < 0.7) { // 70% chance to spawn a star
            spawnStar();
        }
        starSpawnTimer = 0;
    }
}

function updateScore(deltaTime) {
    scoreTimer += deltaTime;
    if (scoreTimer >= 1) {
        score += SCORE_PER_SECOND;
        scoreTimer = 0;
        updateScoreDisplay();
    }
}

function spawnMeteor() {
    let size = Math.random() * 20 + 15; // Random size between 15-35
    meteors.push({
        x: Math.random() * (CANVAS_WIDTH - size),
        y: -size,
        size: size,
        speed: METEOR_MIN_SPEED + Math.random() * (METEOR_MAX_SPEED - METEOR_MIN_SPEED),
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 6, // Random rotation speed
        color: `hsl(${Math.random() * 60 + 10}, 70%, 50%)` // Orange/red colors
    });
}

function spawnStar() {
    let size = 12;
    stars.push({
        x: Math.random() * (CANVAS_WIDTH - size),
        y: -size,
        size: size,
        speed: STAR_SPEED,
        rotation: 0,
        rotationSpeed: 3,
        color: '#ffeb3b'
    });
}

function checkCollisions() {
    let playerCenterX = player.x + player.width / 2;
    let playerCenterY = player.y + player.height / 2;
    
    // Check meteor collisions
    for (let meteor of meteors) {
        let meteorCenterX = meteor.x + meteor.size / 2;
        let meteorCenterY = meteor.y + meteor.size / 2;
        
        let distance = Math.sqrt(
            Math.pow(playerCenterX - meteorCenterX, 2) + 
            Math.pow(playerCenterY - meteorCenterY, 2)
        );
        
        if (distance < (player.width / 2 + meteor.size / 2) * 0.8) { // Slightly smaller collision box
            endGame();
            return;
        }
    }
    
    // Check star collisions
    for (let i = stars.length - 1; i >= 0; i--) {
        let star = stars[i];
        let starCenterX = star.x + star.size / 2;
        let starCenterY = star.y + star.size / 2;
        
        let distance = Math.sqrt(
            Math.pow(playerCenterX - starCenterX, 2) + 
            Math.pow(playerCenterY - starCenterY, 2)
        );
        
        if (distance < (player.width / 2 + star.size / 2)) {
            // Collect star
            score += STAR_BONUS;
            stars.splice(i, 1);
            playSound('success');
            updateScoreDisplay();
        }
    }
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw starfield background
    drawStarField();
    
    if (gameState === 'playing' || gameState === 'gameOver') {
        // Draw player
        drawPlayer();
        
        // Draw meteors
        for (let meteor of meteors) {
            drawMeteor(meteor);
        }
        
        // Draw stars
        for (let star of stars) {
            drawStar(star);
        }
    }
}

function drawStarField() {
    for (let star of starField) {
        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Draw spaceship shape
    ctx.fillStyle = '#00ff88';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2); // Top point
    ctx.lineTo(-player.width / 2, player.height / 2); // Bottom left
    ctx.lineTo(-player.width / 4, player.height / 3); // Inner left
    ctx.lineTo(player.width / 4, player.height / 3); // Inner right
    ctx.lineTo(player.width / 2, player.height / 2); // Bottom right
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Draw engine glow
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.ellipse(0, player.height / 2 + 3, player.width / 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawMeteor(meteor) {
    ctx.save();
    ctx.translate(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2);
    ctx.rotate(meteor.rotation);
    
    // Create rocky meteor shape
    ctx.fillStyle = meteor.color;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    let sides = 8;
    for (let i = 0; i < sides; i++) {
        let angle = (i / sides) * Math.PI * 2;
        let radius = meteor.size / 2 * (0.8 + Math.sin(angle * 3) * 0.2); // Irregular shape
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Add some surface details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-meteor.size / 6, -meteor.size / 6, meteor.size / 8, meteor.size / 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawStar(star) {
    ctx.save();
    ctx.translate(star.x + star.size / 2, star.y + star.size / 2);
    ctx.rotate(star.rotation);
    
    // Draw 5-pointed star
    ctx.fillStyle = star.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        let angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        let outerRadius = star.size / 2;
        let innerRadius = outerRadius * 0.4;
        
        // Outer point
        let x1 = Math.cos(angle) * outerRadius;
        let y1 = Math.sin(angle) * outerRadius;
        
        // Inner point
        let innerAngle = angle + Math.PI / 5;
        let x2 = Math.cos(innerAngle) * innerRadius;
        let y2 = Math.sin(innerAngle) * innerRadius;
        
        if (i === 0) {
            ctx.moveTo(x1, y1);
        } else {
            ctx.lineTo(x1, y1);
        }
        ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Add sparkle effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, star.size / 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Initialize the game when the page loads
window.addEventListener('load', init);
