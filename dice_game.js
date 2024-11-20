let camera, scene, renderer, world;
let dice = [];
let diceBody = [];
let aspectRatio;
let tableWidth, tableDepth;

// Materials and textures
const woodTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(4, 1);

function createDiceMaterials() {
    const materials = [];
    const loader = new THREE.TextureLoader();
    
    for (let i = 1; i <= 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Dark red background with metallic look
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(0, 0, 128, 128);
        
        // White dots with slight shadow
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        
        const dotPositions = {
            1: [[64, 64]],
            2: [[32, 32], [96, 96]],
            3: [[32, 32], [64, 64], [96, 96]],
            4: [[32, 32], [32, 96], [96, 32], [96, 96]],
            5: [[32, 32], [32, 96], [64, 64], [96, 32], [96, 96]],
            6: [[32, 32], [32, 64], [32, 96], [96, 32], [96, 64], [96, 96]]
        };
        
        const dots = dotPositions[i];
        dots.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        materials.push(new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.8,
            roughness: 0.2,
        }));
    }
    
    return materials;
}

function initPhysics() {
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 20; // Increased iterations for better stability
    
    // Ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Create wall material with appropriate friction and restitution
    const wallMaterial = new CANNON.Material({
        friction: 0.3,
        restitution: 0.6
    });

    aspectRatio = window.innerWidth / window.innerHeight;
    tableWidth = 20 * aspectRatio;
    tableDepth = 20;

    const wallThickness = 1;
    const wallHeight = 2;

    // Create walls using boxes instead of planes for better collision
    const walls = [
        // Right wall
        { pos: [tableWidth/2, wallHeight/2, 0], rot: [0, 0, 0], size: [wallThickness, wallHeight, tableDepth] },
        // Left wall
        { pos: [-tableWidth/2, wallHeight/2, 0], rot: [0, 0, 0], size: [wallThickness, wallHeight, tableDepth] },
        // Back wall
        { pos: [0, wallHeight/2, -tableDepth/2], rot: [0, 0, 0], size: [tableWidth, wallHeight, wallThickness] },
        // Front wall
        { pos: [0, wallHeight/2, tableDepth/2], rot: [0, 0, 0], size: [tableWidth, wallHeight, wallThickness] }
    ];

    walls.forEach(wall => {
        const shape = new CANNON.Box(new CANNON.Vec3(wall.size[0]/2, wall.size[1]/2, wall.size[2]/2));
        const body = new CANNON.Body({ mass: 0, material: wallMaterial });
        body.addShape(shape);
        body.position.set(...wall.pos);
        body.quaternion.setFromEuler(...wall.rot);
        world.addBody(body);
    });
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    aspectRatio = window.innerWidth / window.innerHeight;
    const frustumSize = 20;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspectRatio / -2,
        frustumSize * aspectRatio / 2,
        frustumSize / 2,
        frustumSize / -2,
        1,
        1000
    );
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add point lights for better wood material highlighting
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5);
    pointLight1.position.set(-10, 10, -10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(10, 10, 10);
    scene.add(pointLight2);

    camera.position.set(0, 20, 0);
    camera.lookAt(0, 0, 0);

    tableWidth = 20 * aspectRatio;
    tableDepth = 20;

    // Create table surface with felt texture
    const tableGeometry = new THREE.PlaneGeometry(tableWidth, tableDepth);
    const tableMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0a4012,
        roughness: 1,
        metalness: 0
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.rotation.x = -Math.PI / 2;
    table.receiveShadow = true;
    scene.add(table);

    // Create wooden walls
    const wallHeight = 2;
    const wallThickness = 1;
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        map: woodTexture,
        roughness: 0.8,
        metalness: 0.2
    });

    const walls = [
        // Back wall
        { size: [tableWidth, wallHeight, wallThickness], pos: [0, wallHeight/2, -tableDepth/2] },
        // Front wall
        { size: [tableWidth, wallHeight, wallThickness], pos: [0, wallHeight/2, tableDepth/2] },
        // Left wall
        { size: [wallThickness, wallHeight, tableDepth], pos: [-tableWidth/2, wallHeight/2, 0] },
        // Right wall
        { size: [wallThickness, wallHeight, tableDepth], pos: [tableWidth/2, wallHeight/2, 0] }
    ];

    walls.forEach(wall => {
        const geometry = new THREE.BoxGeometry(...wall.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...wall.pos);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
    });

    createDice();

    if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleDeviceMotion);
    }

    window.addEventListener('resize', onWindowResize, false);
}

function createDice() {
    const diceGeometry = new THREE.BoxGeometry(1, 1, 1);
    const diceMaterials = createDiceMaterials();

    // Create 3 dice with improved physics properties
    for (let i = 0; i < 3; i++) {
        const die = new THREE.Mesh(diceGeometry, diceMaterials);
        die.castShadow = true;
        die.receiveShadow = true;
        scene.add(die);
        dice.push(die);

        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        const body = new CANNON.Body({ 
            mass: 1,
            linearDamping: 0.4, // Increased damping for more realistic movement
            angularDamping: 0.4,
            material: new CANNON.Material({
                friction: 0.5,
                restitution: 0.3 // Lower restitution for less bouncy dice
            })
        });
        body.addShape(shape);
        body.position.set(
            (Math.random() - 0.5) * tableWidth * 0.5,
            5 + i * 2,
            (Math.random() - 0.5) * tableDepth * 0.5
        );
        body.angularVelocity.set(
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
        );
        world.addBody(body);
        diceBody.push(body);
    }
}

function handleDeviceMotion(event) {
    const sensitivity = 3;
    const x = -event.accelerationIncludingGravity.x * sensitivity;
    const y = event.accelerationIncludingGravity.y * sensitivity;
    
    world.gravity.set(x, -9.82, y);
}

function onWindowResize() {
    aspectRatio = window.innerWidth / window.innerHeight;
    const frustumSize = 20;
    
    camera.left = -frustumSize * aspectRatio / 2;
    camera.right = frustumSize * aspectRatio / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    tableWidth = 20 * aspectRatio;
}

function animate() {
    requestAnimationFrame(animate);
    world.step(1/60);

    for (let i = 0; i < dice.length; i++) {
        dice[i].position.copy(diceBody[i].position);
        dice[i].quaternion.copy(diceBody[i].quaternion);
    }

    renderer.render(scene, camera);
}

// Initialize and start the game
initPhysics();
init();
animate();
