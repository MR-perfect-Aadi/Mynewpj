// Game Configuration
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        width: 40,
        height: 60,
        jumpForce: 15,
        gravity: 0.6,
        slideTime: 500,
        lanes: [-100, 0, 100],
        speed: 200
    },
    game: {
        initialSpeed: 5,
        speedIncrement: 0.001,
        maxSpeed: 12,
        obstacleFrequency: 0.015,
        coinFrequency: 0.03
    },
    colors: {
        track: '#4a4a4a',
        trackLines: '#ffeb3b',
        player: '#00bcd4',
        obstacle: '#f44336',
        coin: '#ffc107',
        sky: '#87ceeb'
    }
};

// Game State
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.canvas.width;
        this.canvas.height = CONFIG.canvas.height;

        this.score = 0;
        this.coins = 0;
        this.speed = CONFIG.game.initialSpeed;
        this.gameState = 'menu'; // menu, playing, gameover
        this.frameCount = 0;

        this.player = new Player();
        this.obstacles = [];
        this.coins = [];
        this.tracks = [];

        this.keys = {};
        this.setupEventListeners();
        this.init();
    }

    init() {
        // Initialize track segments
        for (let i = 0; i < 10; i++) {
            this.tracks.push({
                y: i * 100,
                type: 'normal'
            });
        }

        this.update();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.handleInput(e.key);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // UI buttons
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
    }

    handleInput(key) {
        if (this.gameState !== 'playing') return;

        switch(key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.player.moveLeft();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.player.moveRight();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                this.player.jump();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.player.slide();
                break;
        }
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('start-screen').classList.add('hidden');
        this.score = 0;
        this.coins = 0;
        this.speed = CONFIG.game.initialSpeed;
        this.updateUI();
    }

    restartGame() {
        this.gameState = 'playing';
        document.getElementById('game-over-screen').classList.add('hidden');
        this.score = 0;
        this.coins = 0;
        this.speed = CONFIG.game.initialSpeed;
        this.obstacles = [];
        this.coins = [];
        this.player.reset();
        this.updateUI();
    }

    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('final-score').textContent = Math.floor(this.score);
        document.getElementById('final-coins').textContent = this.coins;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('coins').textContent = this.coins;
    }

    spawnObstacle() {
        if (Math.random() < CONFIG.game.obstacleFrequency) {
            const lane = CONFIG.player.lanes[Math.floor(Math.random() * 3)];
            const type = Math.random() < 0.5 ? 'box' : 'barrier';
            this.obstacles.push(new Obstacle(lane, -100, type));
        }
    }

    spawnCoin() {
        if (Math.random() < CONFIG.game.coinFrequency) {
            const lane = CONFIG.player.lanes[Math.floor(Math.random() * 3)];
            this.coins.push(new Coin(lane, -100));
        }
    }

    checkCollisions() {
        // Check obstacle collisions
        for (let obstacle of this.obstacles) {
            if (this.player.collidesWith(obstacle)) {
                this.gameOver();
                return;
            }
        }

        // Check coin collection
        for (let i = this.coins.length - 1; i >= 0; i--) {
            if (this.player.collidesWith(this.coins[i])) {
                this.coins.splice(i, 1);
                this.coins++;
                this.updateUI();
            }
        }
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky
        this.ctx.fillStyle = CONFIG.colors.sky;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'playing') {
            // Update game speed
            this.speed = Math.min(
                CONFIG.game.maxSpeed,
                CONFIG.game.initialSpeed + this.frameCount * CONFIG.game.speedIncrement
            );

            // Update score
            this.score += this.speed * 0.1;
            if (this.frameCount % 30 === 0) {
                this.updateUI();
            }

            // Update tracks
            for (let track of this.tracks) {
                track.y += this.speed;
                if (track.y > this.canvas.height) {
                    track.y = -100;
                }
            }

            // Spawn entities
            this.spawnObstacle();
            this.spawnCoin();

            // Update obstacles
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                this.obstacles[i].update(this.speed);
                if (this.obstacles[i].y > this.canvas.height + 100) {
                    this.obstacles.splice(i, 1);
                }
            }

            // Update coins
            for (let i = this.coins.length - 1; i >= 0; i--) {
                this.coins[i].update(this.speed);
                if (this.coins[i].y > this.canvas.height + 100) {
                    this.coins.splice(i, 1);
                }
            }

            // Update player
            this.player.update();

            // Check collisions
            this.checkCollisions();

            this.frameCount++;
        }

        // Draw everything
        this.draw();

        requestAnimationFrame(() => this.update());
    }

    draw() {
        const centerX = this.canvas.width / 2;

        // Draw track
        this.ctx.fillStyle = CONFIG.colors.track;
        this.ctx.fillRect(centerX - 150, 0, 300, this.canvas.height);

        // Draw lane lines
        this.ctx.strokeStyle = CONFIG.colors.trackLines;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 20]);

        for (let track of this.tracks) {
            // Left lane line
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 50, track.y);
            this.ctx.lineTo(centerX - 50, track.y + 100);
            this.ctx.stroke();

            // Right lane line
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + 50, track.y);
            this.ctx.lineTo(centerX + 50, track.y + 100);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);

        // Draw obstacles
        for (let obstacle of this.obstacles) {
            obstacle.draw(this.ctx, centerX);
        }

        // Draw coins
        for (let coin of this.coins) {
            coin.draw(this.ctx, centerX);
        }

        // Draw player
        this.player.draw(this.ctx, centerX);
    }
}

// Player Class
class Player {
    constructor() {
        this.laneIndex = 1; // Start in middle lane
        this.currentLane = CONFIG.player.lanes[this.laneIndex];
        this.targetLane = this.currentLane;
        this.y = 400;
        this.velocityY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
    }

    reset() {
        this.laneIndex = 1;
        this.currentLane = CONFIG.player.lanes[this.laneIndex];
        this.targetLane = this.currentLane;
        this.y = 400;
        this.velocityY = 0;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
    }

    moveLeft() {
        if (this.laneIndex > 0) {
            this.laneIndex--;
            this.targetLane = CONFIG.player.lanes[this.laneIndex];
        }
    }

    moveRight() {
        if (this.laneIndex < 2) {
            this.laneIndex++;
            this.targetLane = CONFIG.player.lanes[this.laneIndex];
        }
    }

    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.isJumping = true;
            this.velocityY = -CONFIG.player.jumpForce;
        }
    }

    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = CONFIG.player.slideTime;
        }
    }

    update() {
        // Smooth lane transition
        if (this.currentLane < this.targetLane) {
            this.currentLane += CONFIG.player.speed / 60;
            if (this.currentLane > this.targetLane) {
                this.currentLane = this.targetLane;
            }
        } else if (this.currentLane > this.targetLane) {
            this.currentLane -= CONFIG.player.speed / 60;
            if (this.currentLane < this.targetLane) {
                this.currentLane = this.targetLane;
            }
        }

        // Handle jumping
        if (this.isJumping) {
            this.velocityY += CONFIG.player.gravity;
            this.y += this.velocityY;

            if (this.y >= 400) {
                this.y = 400;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }

        // Handle sliding
        if (this.isSliding) {
            this.slideTimer -= 16; // ~60fps
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                this.slideTimer = 0;
            }
        }
    }

    draw(ctx, centerX) {
        const x = centerX + this.currentLane;
        const y = this.y;
        const width = this.width;
        const height = this.isSliding ? this.height / 2 : this.height;

        // Draw player shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x, 460, width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw player body
        ctx.fillStyle = CONFIG.colors.player;
        ctx.fillRect(x - width / 2, y - height / 2, width, height);

        // Draw player details
        ctx.fillStyle = '#ffffff';
        // Eyes
        ctx.fillRect(x - 10, y - 20, 8, 8);
        ctx.fillRect(x + 2, y - 20, 8, 8);
    }

    collidesWith(entity) {
        const playerLeft = this.currentLane - this.width / 2;
        const playerRight = this.currentLane + this.width / 2;
        const playerTop = this.y - (this.isSliding ? this.height / 4 : this.height / 2);
        const playerBottom = this.y + (this.isSliding ? this.height / 4 : this.height / 2);

        const entityLeft = entity.x - entity.width / 2;
        const entityRight = entity.x + entity.width / 2;
        const entityTop = entity.y - entity.height / 2;
        const entityBottom = entity.y + entity.height / 2;

        return playerLeft < entityRight &&
               playerRight > entityLeft &&
               playerTop < entityBottom &&
               playerBottom > entityTop;
    }
}

// Obstacle Class
class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'box' ? 40 : 60;
        this.height = type === 'box' ? 40 : 80;
    }

    update(speed) {
        this.y += speed;
    }

    draw(ctx, centerX) {
        const x = centerX + this.x;
        const y = this.y;

        ctx.fillStyle = CONFIG.colors.obstacle;

        if (this.type === 'box') {
            // Draw box obstacle
            ctx.fillRect(x - this.width / 2, y - this.height / 2, this.width, this.height);

            // Add detail
            ctx.strokeStyle = '#d32f2f';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - this.width / 2, y - this.height / 2, this.width, this.height);
        } else {
            // Draw barrier obstacle
            ctx.fillRect(x - this.width / 2, y - this.height / 2, this.width, this.height);

            // Add stripes
            ctx.fillStyle = '#ffeb3b';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(
                    x - this.width / 2,
                    y - this.height / 2 + i * 30,
                    this.width,
                    10
                );
            }
        }
    }
}

// Coin Class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.rotation = 0;
    }

    update(speed) {
        this.y += speed;
        this.rotation += 0.1;
    }

    draw(ctx, centerX) {
        const x = centerX + this.x;
        const y = this.y;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        // Draw coin
        ctx.fillStyle = CONFIG.colors.coin;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Add detail
        ctx.fillStyle = '#ffa000';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Start the game
const game = new Game();
