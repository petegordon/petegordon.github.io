let camera, scene, renderer, world;
let dice = [];
let diceBody = [];
let aspectRatio;
let tableWidth, tableDepth;
let isGameStarted = false;

// Materials and textures
const woodTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 1);

// Initialize motion permission handling
let permissionGranted = false;
const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');
const instructions = document.getElementById('instructions');
const startMessage = document.getElementById('start-message');

// iOS 13+ DeviceMotion permission request
function requestMotionPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
        // iOS 13+ device
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    permissionGranted = true;
                    window.addEventListener('devicemotion', handleDeviceMotion);
                    startGame();
                } else {
                    startMessage.textContent = 'Permission denied. Please enable motion sensors and reload.';
                }
            })
            .catch(console.error);
    } else {
        // Non iOS 13+ device
        permissionGranted = true;
        window.addEventListener('devicemotion', handleDeviceMotion);
        startGame();
    }
}

// Start button click handler
startButton.addEventListener('click', requestMotionPermission);

function startGame() {
    if (!isGameStarted) {
        isGameStarted = true;
        startScreen.style.display = 'none';
        instructions.style.display = 'block';
        initPhysics();
        init();
        animate();
    }
}

function createDiceMaterials() {
    // ... (rest of the createDiceMaterials function remains the same)
}

function initPhysics() {
    // ... (rest of the initPhysics function remains the same)
}

function init() {
    // ... (rest of the init function remains the same)
}

function createDice() {
    // ... (rest of the createDice function remains the same)
}

function handleDeviceMotion(event) {
    if (!permissionGranted) return;
    
    const sensitivity = 3;
    const x = -event.accelerationIncludingGravity.x * sensitivity;
    const y = event.accelerationIncludingGravity.y * sensitivity;
    
    if (world) {
        world.gravity.set(x, -9.82, y);
    }
}

function onWindowResize() {
    // ... (rest of the onWindowResize function remains the same)
}

function animate() {
    if (!isGameStarted) return;
    
    requestAnimationFrame(animate);
    world.step(1/60);

    for (let i = 0; i < dice.length; i++) {
        dice[i].position.copy(diceBody[i].position);
        dice[i].quaternion.copy(diceBody[i].quaternion);
    }

    renderer.render(scene, camera);
}

// Add keyboard controls for testing on desktop
window.addEventListener('keydown', (event) => {
    if (!permissionGranted) return;
    
    const gravityStrength = 15;
    switch(event.key) {
        case 'ArrowLeft':
            world.gravity.set(gravityStrength, -9.82, 0);
            break;
        case 'ArrowRight':
            world.gravity.set(-gravityStrength, -9.82, 0);
            break;
        case 'ArrowUp':
            world.gravity.set(0, -9.82, gravityStrength);
            break;
        case 'ArrowDown':
            world.gravity.set(0, -9.82, -gravityStrength);
            break;
    }
});

// Listen for orientation changes
window.addEventListener('orientationchange', () => {
    setTimeout(onWindowResize, 100);
});
