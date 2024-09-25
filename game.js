// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up audio
let walkSound, shootSound, hitSound;
let audioLoaded = false;

let waterPlane, distantTerrain;

function createSkybox() {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    function createSkyTexture() {
        // Create sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, '#87CEEB');  // Sky blue at the top
        gradient.addColorStop(0.5, '#B0E0E6');  // Powder blue in the middle
        gradient.addColorStop(1, '#E0F6FF');  // Light cyan at the bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Add sun
        const sunGradient = ctx.createRadialGradient(size * 0.8, size * 0.2, 0, size * 0.8, size * 0.2, size * 0.3);
        sunGradient.addColorStop(0, '#FFFFFF');  // White core
        sunGradient.addColorStop(0.1, '#FFFFA1');  // Yellow
        sunGradient.addColorStop(0.2, '#FFD700');  // Gold
        sunGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.3)');  // Semi-transparent gold
        sunGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');  // Transparent yellow
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(size * 0.8, size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Add some clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size * 0.5;  // Only in upper half
            const radius = Math.random() * 50 + 25;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    const skyTexture = createSkyTexture();

    const skyMaterial = [
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide }),
        new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide })
    ];

    const skyGeometry = new THREE.BoxGeometry(2000, 2000, 2000);
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    skybox.position.set(camera.position.x, camera.position.y, camera.position.z);
    scene.add(skybox);

    return { skybox, skyTexture };
}

// Function to update skybox position
function updateSkyboxPosition() {
    if (skybox) {
        skybox.position.copy(camera.position);
    }
}

// Add this function to the global scope
window.updateSkyboxPosition = updateSkyboxPosition;


function createWater() {
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
    const waterMaterial = new THREE.MeshBasicMaterial({
        color: 0x0077be,
        transparent: true,
        opacity: 0.6
    });
    waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
    waterPlane.rotation.x = -Math.PI / 2;
    waterPlane.position.y = -0.5;
    scene.add(waterPlane);
}

function createDistantTerrain() {
    distantTerrain = new THREE.Group();

    // Create mountains
    for (let i = 0; i < 10; i++) {
        const mountainGeometry = new THREE.ConeGeometry(20 + Math.random() * 30, 50 + Math.random() * 50, 4);
        const mountainMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(
            (Math.random() - 0.5) * 500,
            -25,
            (Math.random() - 0.5) * 500
        );
        mountain.rotation.y = Math.random() * Math.PI;
        distantTerrain.add(mountain);
    }

    // Create ruins
    for (let i = 0; i < 5; i++) {
        const ruinGeometry = new THREE.BoxGeometry(10, 20, 10);
        const ruinMaterial = new THREE.MeshBasicMaterial({ color: 0xA0522D });
        const ruin = new THREE.Mesh(ruinGeometry, ruinMaterial);
        ruin.position.set(
            (Math.random() - 0.5) * 400,
            0,
            (Math.random() - 0.5) * 400
        );
        distantTerrain.add(ruin);
    }

    // Create dinosaurs (simplified as large, distant shapes)
    for (let i = 0; i < 3; i++) {
        const dinoGeometry = new THREE.CylinderGeometry(5, 5, 30, 8);
        const dinoMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
        const dino = new THREE.Mesh(dinoGeometry, dinoMaterial);
        dino.position.set(
            (Math.random() - 0.5) * 450,
            15,
            (Math.random() - 0.5) * 450
        );
        dino.rotation.x = Math.PI / 2;
        distantTerrain.add(dino);
    }

    scene.add(distantTerrain);
}

function loadAudio() {
    return new Promise((resolve) => {
        const audioFiles = {
            walkSound: 'walk.mp3',
            shootSound: 'shoot.mp3',
            hitSound: 'hit.mp3'
        };

        const audioElements = {};
        let loadedCount = 0;

        Object.entries(audioFiles).forEach(([key, file]) => {
            const audio = new Audio(file);
            audioElements[key] = audio;

            audio.addEventListener('canplaythrough', () => {
                loadedCount++;
                if (loadedCount === Object.keys(audioFiles).length) {
                    audioLoaded = true;
                    walkSound = audioElements.walkSound;
                    walkSound.volume = 0.15; // Set walk sound volume to 15%
                    shootSound = audioElements.shootSound;
                    hitSound = audioElements.hitSound;
                    resolve(audioElements);
                }
            });

            audio.addEventListener('error', () => {
                console.warn(`Failed to load audio: ${file}`);
                loadedCount++;
                if (loadedCount === Object.keys(audioFiles).length) {
                    resolve(audioElements);
                }
            });

            try {
                audio.load();
            } catch (error) {
                console.warn(`Failed to load audio: ${file}`);
                loadedCount++;
                if (loadedCount === Object.keys(audioFiles).length) {
                    resolve(audioElements);
                }
            }
        });

        // Set a timeout to resolve the promise if audio doesn't load within 5 seconds
        setTimeout(() => {
            if (!audioLoaded) {
                console.warn('Audio loading timed out');
                resolve(audioElements);
            }
        }, 5000);
    });
}

function testPlaySounds() {
    const playSound = (sound, name, delay) => {
        setTimeout(() => {
            sound.play()
                .catch(error => console.error(`Error playing ${name}:`, error));
        }, delay);
    };

    playSound(walkSound, 'walk sound', 0);
    playSound(shootSound, 'shoot sound', 1000);
    playSound(hitSound, 'hit sound', 2000);
}

let lastPlayTime = 0;
const playWalkSound = () => {
    const now = Date.now();
    if (now - lastPlayTime > 300) { // Play every 300ms
        if (walkSound) {
            walkSound.currentTime = 0;
            walkSound.play()
                .catch(error => console.error('Error playing walk sound:', error));
            lastPlayTime = now;
        }
    }
};

// Game state
let currentStage = 1;
const totalStages = 10;
let targetsLeft = 10;
let gameActive = true;
let timeLeft; // Will be set based on the current stage
let timerInterval; // Declare timerInterval at the top level

// Stage configurations
const stageConfigs = [
    { floorColor: 0xcccccc, wallColor: 0x8b4513, obstacleColor: 0x8888ff, targetColor: 0xff0000, skybox: 'day', fogColor: 0xaaaaaa, fogDensity: 0.01, terrainColor: 0x808080 },
    { floorColor: 0x90ee90, wallColor: 0x006400, obstacleColor: 0x8b4513, targetColor: 0xffa500, skybox: 'day', fogColor: 0xffaa77, fogDensity: 0.015, terrainColor: 0xA0522D },
    { floorColor: 0xadd8e6, wallColor: 0x4682b4, obstacleColor: 0xffffff, targetColor: 0xff69b4, skybox: 'night', fogColor: 0x000066, fogDensity: 0.02, terrainColor: 0x2F4F4F },
    { floorColor: 0xffd700, wallColor: 0x8b0000, obstacleColor: 0x32cd32, targetColor: 0x1e90ff, skybox: 'sunset', fogColor: 0xff4500, fogDensity: 0.025, terrainColor: 0xcd853f },
    { floorColor: 0xe6e6fa, wallColor: 0x800080, obstacleColor: 0xffa07a, targetColor: 0x00ff00, skybox: 'dusk', fogColor: 0x4b0082, fogDensity: 0.03, terrainColor: 0x556b2f },
    { floorColor: 0xf0e68c, wallColor: 0x2f4f4f, obstacleColor: 0x00ced1, targetColor: 0xff1493, skybox: 'dawn', fogColor: 0xffa500, fogDensity: 0.035, terrainColor: 0x8fbc8f },
    { floorColor: 0xb0c4de, wallColor: 0x483d8b, obstacleColor: 0xf08080, targetColor: 0x7cfc00, skybox: 'storm', fogColor: 0x708090, fogDensity: 0.04, terrainColor: 0x2f4f4f },
    { floorColor: 0xffa07a, wallColor: 0x8b4513, obstacleColor: 0x20b2aa, targetColor: 0xffd700, skybox: 'desert', fogColor: 0xd2691e, fogDensity: 0.045, terrainColor: 0xdeb887 },
    { floorColor: 0x98fb98, wallColor: 0x006400, obstacleColor: 0x9acd32, targetColor: 0xff4500, skybox: 'jungle', fogColor: 0x228b22, fogDensity: 0.05, terrainColor: 0x556b2f },
    { floorColor: 0xb0e0e6, wallColor: 0x4682b4, obstacleColor: 0x87cefa, targetColor: 0xffa500, skybox: 'arctic', fogColor: 0xf0f8ff, fogDensity: 0.055, terrainColor: 0xf0f8ff }
];

const targetsLeftElement = document.createElement('div');
targetsLeftElement.style.position = 'absolute';
targetsLeftElement.style.top = '10px';
targetsLeftElement.style.left = '10px';
targetsLeftElement.style.color = 'white';
targetsLeftElement.style.fontSize = '24px';
document.body.appendChild(targetsLeftElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '10px';
timerElement.style.right = '10px';
timerElement.style.color = 'white';
timerElement.style.fontSize = '24px';
document.body.appendChild(timerElement);

// Create crosshair
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.width = '20px';
crosshair.style.height = '20px';
crosshair.style.border = '2px solid white';
crosshair.style.borderRadius = '50%';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.pointerEvents = 'none'; // Ensure it doesn't interfere with mouse events
document.body.appendChild(crosshair);

function updateTargetsLeft() {
    targetsLeftElement.textContent = `Targets left: ${targetsLeft}`;
}

function updateTimer() {
    timerElement.textContent = `Time: ${timeLeft}s`;
}

function showGameEndScreen(message) {
    const gameEndElement = document.createElement('div');
    gameEndElement.textContent = message;
    gameEndElement.style.position = 'absolute';
    gameEndElement.style.top = '50%';
    gameEndElement.style.left = '50%';
    gameEndElement.style.transform = 'translate(-50%, -50%)';
    gameEndElement.style.color = 'white';
    gameEndElement.style.fontSize = '48px';
    document.body.appendChild(gameEndElement);

    setTimeout(() => {
        document.body.removeChild(gameEndElement);
        startNextStage();
    }, 3000);
}

function showMissionComplete() {
    console.log(`Mission Complete! Current stage: ${currentStage}`);
    gameActive = false;
    clearInterval(timerInterval);
    if (currentStage < totalStages) {
        currentStage++;
        console.log(`Moving to next stage. New stage: ${currentStage}`);
        showGameEndScreen(`Stage ${currentStage - 1} Complete!`);
    } else {
        console.log('All stages completed!');
        showGameEndScreen(`Congratulations! You completed all ${totalStages} stages!`);
        setTimeout(() => {
            fullRestartGame();
        }, 3000);
    }
}

function startNextStage() {
    console.log(`Starting stage ${currentStage}`);
    targetsLeft = 10;
    gameActive = true;
    timeLeft = Math.max(60 - (currentStage - 1) * 5, 15); // Decrease by 5 seconds each stage, minimum 15 seconds
    updateTargetsLeft();
    updateTimer();
    respawnTargets();
    updateStageEnvironment();
    startTimer(); // Restart the timer
    console.log(`Stage ${currentStage} environment updated`);
}

function updateStageEnvironment() {
    const config = stageConfigs[currentStage - 1];
    
    // Update floor
    floor.material.color.setHex(config.floorColor);
    
    // Update fence
    fence.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            if (child.material.map) {
                // This is likely the chain-link part
                child.material.color.setHex(config.wallColor);
            } else {
                // This is likely the post or wire part
                child.material.color.setHex(config.wallColor);
            }
        }
    });
    
    // Update obstacles
    obstacles.forEach(obstacle => {
        obstacle.material.color.setHex(config.obstacleColor);
    });
    
    // Update targets
    targets.forEach(target => {
        target.material.color.setHex(config.targetColor);
    });

    // Update skybox
    skybox.material.forEach(material => {
        material.map = skyTexture;
        material.needsUpdate = true;
    });

    // Update fog
    scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);

    // Update distant terrain color
    distantTerrain.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.material.color.setHex(config.terrainColor);
        }
    });
}

function showGameOver() {
    showGameEndScreen(`Game Over! You made it to stage ${currentStage}!`);
    setTimeout(() => {
        fullRestartGame();
    }, 3000);
}

function fullRestartGame() {
    currentStage = 1;
    targetsLeft = 10;
    timeLeft = 60; // Reset to 60 seconds for the first stage
    gameActive = true;
    updateTargetsLeft();
    updateTimer();
    respawnTargets();
    updateStageEnvironment();
    if (timerInterval) {
        clearInterval(timerInterval); // Clear any existing timer
    }
    startTimer(); // Restart the timer
    console.log('Full game restart initiated');
}

function restartStage() {
    targetsLeft = 10;
    gameActive = true;
    updateTargetsLeft();
    respawnTargets();
    console.log(`Restarting current stage: ${currentStage}`);
}

function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
        if (gameActive) {
            timeLeft--;
            updateTimer();
            if (timeLeft <= 0) {
                if (currentStage < totalStages) {
                    currentStage++;
                    timeLeft = 60; // Reset timer for the next stage
                    startNextStage();
                } else {
                    clearInterval(timerInterval);
                    gameActive = false;
                    showGameOver();
                }
            }
        } else {
            clearInterval(timerInterval);
        }
    }, 1000);
}

updateTargetsLeft();
updateTimer();

// Create a factory floor environment
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorTexture = createFactoryFloorTexture();
const floorMaterial = new THREE.MeshPhongMaterial({ 
    map: floorTexture, 
    side: THREE.DoubleSide,
    shininess: 100,
    bumpMap: floorTexture,
    bumpScale: 0.05
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = Math.PI / 2;
scene.add(floor);

function createFactoryFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base metallic color
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(0, 0, 512, 512);

    // Add some variation and wear
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 3 + 1;
        ctx.fillStyle = `rgba(100, 100, 100, ${Math.random() * 0.2})`;
        ctx.fillRect(x, y, size, size);
    }

    // Add grid lines
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
    }

    // Add some bolts or rivets
    ctx.fillStyle = '#444444';
    for (let i = 32; i < 512; i += 64) {
        for (let j = 32; j < 512; j += 64) {
            ctx.beginPath();
            ctx.arc(i, j, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return new THREE.CanvasTexture(canvas);
}

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Add industrial fence
function createFence() {
    const fenceGroup = new THREE.Group();
    const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
    const wireMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const postMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });

    // Create fence posts and wires
    for (let i = -10; i <= 10; i += 2) {
        // Vertical posts
        const post1 = new THREE.Mesh(postGeometry, postMaterial);
        post1.position.set(i, 1, -10);
        fenceGroup.add(post1);

        const post2 = new THREE.Mesh(postGeometry, postMaterial);
        post2.position.set(i, 1, 10);
        fenceGroup.add(post2);

        const post3 = new THREE.Mesh(postGeometry, postMaterial);
        post3.position.set(-10, 1, i);
        fenceGroup.add(post3);

        const post4 = new THREE.Mesh(postGeometry, postMaterial);
        post4.position.set(10, 1, i);
        fenceGroup.add(post4);

        // Horizontal wires
        if (i < 10) {
            const wireGeometry1 = new THREE.CylinderGeometry(0.01, 0.01, 2, 8);
            wireGeometry1.rotateZ(Math.PI / 2);
            const wire1 = new THREE.Mesh(wireGeometry1, wireMaterial);
            wire1.position.set(i + 1, 1.5, -10);
            fenceGroup.add(wire1);

            const wire2 = new THREE.Mesh(wireGeometry1, wireMaterial);
            wire2.position.set(i + 1, 1.5, 10);
            fenceGroup.add(wire2);

            const wireGeometry2 = new THREE.CylinderGeometry(0.01, 0.01, 2, 8);
            wireGeometry2.rotateX(Math.PI / 2);
            const wire3 = new THREE.Mesh(wireGeometry2, wireMaterial);
            wire3.position.set(-10, 1.5, i + 1);
            fenceGroup.add(wire3);

            const wire4 = new THREE.Mesh(wireGeometry2, wireMaterial);
            wire4.position.set(10, 1.5, i + 1);
            fenceGroup.add(wire4);
        }
    }

    // Add chain-link texture
    const chainLinkTexture = createChainLinkTexture();
    const chainLinkMaterial = new THREE.MeshBasicMaterial({
        map: chainLinkTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const fenceMeshNorth = new THREE.Mesh(new THREE.PlaneGeometry(20, 2), chainLinkMaterial);
    fenceMeshNorth.position.set(0, 1, -10);
    fenceGroup.add(fenceMeshNorth);

    const fenceMeshSouth = new THREE.Mesh(new THREE.PlaneGeometry(20, 2), chainLinkMaterial);
    fenceMeshSouth.position.set(0, 1, 10);
    fenceGroup.add(fenceMeshSouth);

    const fenceMeshEast = new THREE.Mesh(new THREE.PlaneGeometry(20, 2), chainLinkMaterial);
    fenceMeshEast.rotation.y = Math.PI / 2;
    fenceMeshEast.position.set(10, 1, 0);
    fenceGroup.add(fenceMeshEast);

    const fenceMeshWest = new THREE.Mesh(new THREE.PlaneGeometry(20, 2), chainLinkMaterial);
    fenceMeshWest.rotation.y = Math.PI / 2;
    fenceMeshWest.position.set(-10, 1, 0);
    fenceGroup.add(fenceMeshWest);

    scene.add(fenceGroup);
    return fenceGroup;
}

function createChainLinkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;

    // Draw diagonal lines
    for (let i = -32; i < 256; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 32, 32);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i + 32, 0);
        ctx.lineTo(i, 32);
        ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
}

const fence = createFence();

// Add obstacles and targets
const obstacles = [];
const targets = [];
const obstacleGeometry = new THREE.BoxGeometry(1, 2, 1);

// Create brick texture
function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Fill background
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, 256, 256);

    // Draw bricks
    context.fillStyle = '#8B0000';
    for (let y = 0; y < 256; y += 32) {
        for (let x = 0; x < 256; x += 64) {
            context.fillRect(x, y, 60, 28);
            context.fillRect(x + 32, y + 32, 60, 28);
        }
    }

    // Draw mortar lines
    context.strokeStyle = '#D2691E';
    context.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(256, y);
        context.stroke();
    }
    for (let x = 0; x <= 256; x += 32) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, 256);
        context.stroke();
    }

    return new THREE.CanvasTexture(canvas);
}

const brickTexture = createBrickTexture();
const obstacleMaterial = new THREE.MeshPhongMaterial({ map: brickTexture });

function createTargetGeometry() {
    const radius = 0.5;
    const detail = 1;
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    return geometry;
}

function createTargetMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');

    // Fill the background with white
    context.fillStyle = 'white';
    context.fillRect(0, 0, 256, 256);

    // Draw red stripes
    context.strokeStyle = 'red';
    context.lineWidth = 20;
    for (let i = 0; i < 5; i++) {
        context.beginPath();
        context.moveTo(0, i * 51);
        context.lineTo(256, i * 51);
        context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 100,
        specular: 0xffffff
    });
    return material;
}

const targetGeometry = createTargetGeometry();
const targetMaterial = createTargetMaterial();

for (let i = 0; i < 10; i++) {
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(
        Math.random() * 16 - 8,
        1,
        Math.random() * 16 - 8
    );
    // Randomly rotate the obstacle
    obstacle.rotation.y = Math.random() * Math.PI * 2;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Separate loop for targets to ensure we have 10 of each
for (let i = 0; i < 10; i++) {
    const target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.position.set(
        Math.random() * 16 - 8,
        1.5,
        Math.random() * 16 - 8
    );
    scene.add(target);
    targets.push(target);
}

// Player movement
const moveSpeed = 0.1;
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
const playerRadius = 0.5;

// Collision detection
const raycaster = new THREE.Raycaster();

// Weapon
const weaponGroup = new THREE.Group();

// Main body
const bodyGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.4, 8);
const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x3090C7, shininess: 100 });
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.rotation.x = Math.PI / 2;
weaponGroup.add(body);

// Barrel
const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
const barrelMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0, shininess: 150 });
const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
barrel.position.set(0, 0, -0.2);
barrel.rotation.x = Math.PI / 2;
weaponGroup.add(barrel);

// Energy cell
const cellGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.05);
const cellMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00, shininess: 200, transparent: true, opacity: 0.8 });
const cell = new THREE.Mesh(cellGeometry, cellMaterial);
cell.position.set(0, 0.07, 0.1);
weaponGroup.add(cell);

// Sight
const sightGeometry = new THREE.BoxGeometry(0.01, 0.03, 0.01);
const sightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
const sight = new THREE.Mesh(sightGeometry, sightMaterial);
sight.position.set(0, 0.06, -0.1);
weaponGroup.add(sight);

weaponGroup.position.set(0.3, -0.3, -0.5);
camera.add(weaponGroup);
scene.add(camera);

// Add a point light to make the weapon shine
const weaponLight = new THREE.PointLight(0xFFFFFF, 0.5, 1);
weaponLight.position.set(0.3, -0.2, -0.4);
camera.add(weaponLight);

// Mouse look
const mouseSensitivity = 0.002;
let mouseX = 0;
let mouseY = 0;

// Keyboard state
const keyboard = {};

// Player state
let isCrouching = false;
let isJumping = false;
const standingHeight = 1;
const crouchingHeight = 0.5;
const jumpHeight = 2;
const jumpDuration = 500; // in milliseconds

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    keyboard[event.code] = true;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        isCrouching = true;
        camera.position.y = crouchingHeight;
    }
    if (event.code === 'Space') {
        console.log('Space key pressed');
        if (!isJumping) {
            jump();
        } else {
            console.log('Cannot jump, already jumping');
        }
    }
});

document.addEventListener('keyup', (event) => {
    keyboard[event.code] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        isCrouching = false;
        camera.position.y = standingHeight;
    }
});

function jump() {
    console.log('Jump function called');
    if (!isJumping) {
        console.log('Starting jump');
        isJumping = true;
        const startHeight = camera.position.y;
        const startTime = Date.now();

        function jumpAnimation() {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / jumpDuration, 1);
            const height = startHeight + Math.sin(progress * Math.PI) * jumpHeight;

            console.log(`Jump progress: ${progress.toFixed(2)}, Height: ${height.toFixed(2)}`);
            camera.position.y = height;

            if (progress < 1) {
                requestAnimationFrame(jumpAnimation);
            } else {
                console.log('Jump completed');
                camera.position.y = startHeight;
                isJumping = false;
            }
        }

        jumpAnimation();
    } else {
        console.log('Jump already in progress');
    }
}

// Handle mouse click for shooting
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left mouse button
        shoot();
    }
});

// Shooting mechanism
function shoot() {
    const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.set(camera.position.x, camera.position.y, camera.position.z);
    bullet.quaternion.copy(camera.quaternion);
    
    scene.add(bullet);

    // Play shoot sound
    if (shootSound) {
        shootSound.currentTime = 0;
        shootSound.play().catch(error => console.error('Error playing shoot sound:', error));
    }
    
    // Muzzle flash
    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(weaponGroup.position);
    flash.position.z -= 0.3;
    camera.add(flash);
    
    // Remove flash after 50ms
    setTimeout(() => {
        camera.remove(flash);
    }, 50);
    
    // Bullet trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
    const trailPositions = new Float32Array(2 * 3);
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trail);
    
    // Bullet movement and trail update
    function updateBullet() {
        bullet.translateZ(-1);
        
        trailPositions[0] = camera.position.x;
        trailPositions[1] = camera.position.y;
        trailPositions[2] = camera.position.z;
        trailPositions[3] = bullet.position.x;
        trailPositions[4] = bullet.position.y;
        trailPositions[5] = bullet.position.z;
        trail.geometry.attributes.position.needsUpdate = true;
        
        // Check for target hits
        for (let i = 0; i < targets.length; i++) {
            if (bullet.position.distanceTo(targets[i].position) < 0.5) {
                if (gameActive) {
                    const hitPosition = targets[i].position.clone();
                    createBurstAnimation(hitPosition);
                    scene.remove(targets[i]);
                    targets.splice(i, 1);
                    targetsLeft--;
                    updateTargetsLeft();
                    // Play hit sound
                    if (hitSound) {
                        hitSound.currentTime = 0;
                        hitSound.play().catch(error => console.error('Error playing hit sound:', error));
                    }
                    if (targetsLeft === 0) {
                        gameActive = false;
                        showMissionComplete();
                    }
                }
                break;
            }
        }
        
        if (bullet.position.distanceTo(camera.position) > 100 || targets.length === 0) {
            scene.remove(bullet);
            scene.remove(trail);
        } else {
            requestAnimationFrame(updateBullet);
        }
    }
    updateBullet();
}

function createBurstAnimation(position) {
    const particleCount = 30;
    const particles = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff })
        );
        
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        
        particle.userData.velocity = velocity;
        particles.add(particle);
    }
    
    scene.add(particles);
    
    function animateParticles() {
        particles.children.forEach((particle, index) => {
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y -= 0.01; // Add gravity effect
            particle.material.opacity -= 0.02; // Fade out
            
            if (particle.material.opacity <= 0) {
                particles.remove(particle);
            }
        });
        
        if (particles.children.length > 0) {
            requestAnimationFrame(animateParticles);
        } else {
            scene.remove(particles);
        }
    }
    
    animateParticles();
}

// Handle mouse movement
document.addEventListener('mousemove', (event) => {
    mouseX -= event.movementX * mouseSensitivity;
    mouseY -= event.movementY * mouseSensitivity;

    // Clamp vertical rotation
    mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));

    camera.rotation.order = 'YXZ';
    camera.rotation.y = mouseX;
    camera.rotation.x = mouseY;
});

// Lock mouse pointer
renderer.domElement.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

camera.position.y = 1;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update skybox position
    updateSkyboxPosition();

    // Update weapon position
    weaponGroup.position.set(
        0.3 - Math.sin(Date.now() * 0.01) * 0.01,
        -0.3 + Math.sin(Date.now() * 0.01) * 0.01,
        -0.5 + Math.sin(Date.now() * 0.005) * 0.02
    );
    weaponGroup.rotation.x = Math.sin(Date.now() * 0.002) * 0.05;
    weaponGroup.rotation.y = Math.sin(Date.now() * 0.003) * 0.05;

    // Pulse the energy cell
    const cell = weaponGroup.children[2];
    cell.material.opacity = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;

    // Update target positions
    updateTargets();

    // Player movement
    playerVelocity.x = 0;
    playerVelocity.z = 0;

    const currentMoveSpeed = isCrouching ? moveSpeed * 0.5 : moveSpeed;

    if (keyboard['KeyW']) {
        playerVelocity.z = -currentMoveSpeed;
    }
    if (keyboard['KeyS']) {
        playerVelocity.z = currentMoveSpeed;
    }
    if (keyboard['KeyA']) {
        playerVelocity.x = -currentMoveSpeed;
    }
    if (keyboard['KeyD']) {
        playerVelocity.x = currentMoveSpeed;
    }

    // Update player position
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    playerVelocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

    // Collision detection
    const playerHeight = isCrouching ? crouchingHeight : standingHeight;
    raycaster.set(camera.position.clone().setY(playerHeight), playerVelocity.clone().normalize());
    const intersects = raycaster.intersectObjects([...obstacles, ...fence.children]);

    if (intersects.length === 0 || intersects[0].distance > playerRadius + playerVelocity.length()) {
        const newPosition = camera.position.clone().add(playerVelocity);

        // Check if the new position is within the map boundaries
        if (Math.abs(newPosition.x) < 9.5 && Math.abs(newPosition.z) < 9.5) {
            camera.position.copy(newPosition);
            // Play walk sound if moving
            if (playerVelocity.length() > 0) {
                playWalkSound();
            }
        }
    }

    // Ensure the camera is at the correct height
    camera.position.y = isCrouching ? crouchingHeight : standingHeight;

    renderer.render(scene, camera);
}

function updateTargets() {
    targets.forEach(target => {
        target.userData.angle += target.userData.speed;
        const newX = target.userData.spawnPosition.x + Math.cos(target.userData.angle) * target.userData.radius;
        const newZ = target.userData.spawnPosition.z + Math.sin(target.userData.angle) * target.userData.radius;
        target.position.set(newX, target.position.y, newZ);
        
        // Make the target face the center of its circular path
        target.lookAt(target.userData.spawnPosition);
    });
}

// Respawn targets
function respawnTargets() {
    // Remove any existing targets
    targets.forEach(target => scene.remove(target));
    targets.length = 0;

    // Spawn new targets
    for (let i = 0; i < 10; i++) {
        const target = new THREE.Mesh(targetGeometry, targetMaterial.clone());
        const spawnPosition = new THREE.Vector3(
            Math.random() * 16 - 8,
            1.5,
            Math.random() * 16 - 8
        );
        target.position.copy(spawnPosition);
        // Randomly rotate the target
        target.rotation.x = Math.random() * Math.PI * 2;
        target.rotation.y = Math.random() * Math.PI * 2;
        target.rotation.z = Math.random() * Math.PI * 2;
        // Add movement properties
        target.userData.spawnPosition = spawnPosition;
        target.userData.angle = Math.random() * Math.PI * 2;
        target.userData.radius = 0.5 + Math.random() * 0.5; // Random radius between 0.5 and 1
        target.userData.speed = 0.02 + Math.random() * 0.03; // Random speed
        scene.add(target);
        targets.push(target);
    }
}

// Initialize the game
// Declare global variables
let skybox, skyTexture;

function initGame() {
    loadAudio().then(() => {
        const skyboxObjects = createSkybox();
        skybox = skyboxObjects.skybox;
        skyTexture = skyboxObjects.skyTexture;
        createWater();
        createDistantTerrain();
        startNextStage();
        startTimer(); // Start the timer when the game initializes
        animate();
        
        // Show crosshair when the game starts
        crosshair.style.display = 'block';
    }).catch(error => {
        console.error('Error initializing game:', error);
    });
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the game when the page is ready
window.addEventListener('load', initGame);
