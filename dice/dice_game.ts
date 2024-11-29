// diceGame.js
export class DiceGame {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.options = {
            height: '25vh',
            backgroundColor: 0x0a4012,
            diceColor: 0x8B0000,
            ...options
        };
        
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.dice = [];
        
        this.initPhysics();
        this.initScene();
        this.initLights();
        this.createDice();
        this.setupMotionHandling();
        this.animate();
    }

    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Add ground and walls
        const groundMaterial = new CANNON.Material();
        const groundBody = new CANNON.Body({ 
            mass: 0,
            material: groundMaterial,
            shape: new CANNON.Plane()
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
        
        // Add walls (we'll match these to viewport size)
        this.addWalls();
    }

    addWalls() {
        const wallMaterial = new CANNON.Material();
        const wallShape = new CANNON.Plane();
        
        // Left wall
        const leftWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        leftWall.addShape(wallShape);
        leftWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
        leftWall.position.set(-8, 0, 0);
        this.world.addBody(leftWall);

        // Right wall
        const rightWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        rightWall.addShape(wallShape);
        rightWall.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
        rightWall.position.set(8, 0, 0);
        this.world.addBody(rightWall);

        // Front and back walls
        const frontWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        frontWall.addShape(wallShape);
        frontWall.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        frontWall.position.set(0, 0, 6);
        this.world.addBody(frontWall);

        const backWall = new CANNON.Body({ mass: 0, material: wallMaterial });
        backWall.addShape(wallShape);
        backWall.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        backWall.position.set(0, 0, -6);
        this.world.addBody(backWall);
    }

    initScene() {
        this.scene.background = new THREE.Color(this.options.backgroundColor);
        
        const aspect = window.innerWidth / (window.innerHeight * 0.25);
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.25);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        this.camera.position.set(0, 1, 12);
        this.camera.lookAt(0, 0, 0);
    }

    initLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 2.0);
        this.scene.add(ambient);
        
        [[-5,3,-5], [5,3,-5], [-5,3,5], [5,3,5]].forEach(pos => {
            const light = new THREE.PointLight(0xffffff, 1.0);
            light.position.set(...pos);
            this.scene.add(light);
        });
    }

    createDiceMaterial() {
        const dotPositions = [
            [[64, 64]],
            [[32, 32], [96, 96]],
            [[32, 32], [64, 64], [96, 96]],
            [[32, 32], [32, 96], [96, 32], [96, 96]],
            [[32, 32], [32, 96], [64, 64], [96, 32], [96, 96]],
            [[32, 32], [32, 64], [32, 96], [96, 32], [96, 64], [96, 96]]
        ];

        return dotPositions.map(dots => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 128;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#8B0000';
            ctx.fillRect(0, 0, 128, 128);

            ctx.fillStyle = '#ffffff';
            dots.forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.fill();
            });

            return new THREE.MeshStandardMaterial({
                map: new THREE.CanvasTexture(canvas),
                metalness: 0.7,
                roughness: 0.2
            });
        });
    }

    createDice() {
        const geometry = new THREE.BoxGeometry(6, 6, 6);
        const materials = this.createDiceMaterial();
        const shape = new CANNON.Box(new CANNON.Vec3(3, 3, 3));

        [-6.5, 6.5].forEach(x => {
            const diceMesh = new THREE.Mesh(geometry, materials);
            diceMesh.position.x = x;
            this.scene.add(diceMesh);

            const diceBody = new CANNON.Body({
                mass: 1,
                shape: shape,
                material: new CANNON.Material()
            });
            diceBody.position.set(x, 5, 0);
            this.world.addBody(diceBody);

            this.dice.push({ mesh: diceMesh, body: diceBody });
        });
    }

    setupMotionHandling() {
        const handleMotion = (event) => {
            const sensitivity = 50;
            const x = event.accelerationIncludingGravity.x * sensitivity;
            const y = event.accelerationIncludingGravity.y * sensitivity;
            const z = event.accelerationIncludingGravity.z * sensitivity;

            this.dice.forEach(die => {
                die.body.applyForce(new CANNON.Vec3(x, y, z), die.body.position);
            });
        };

        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            // iOS
            const button = document.createElement('button');
            button.textContent = 'Enable Motion Controls';
            button.style.position = 'fixed';
            button.style.zIndex = '1000';
            button.style.top = '20px';
            button.style.left = '50%';
            button.style.transform = 'translateX(-50%)';
            document.body.appendChild(button);

            button.addEventListener('click', async () => {
                const permission = await DeviceMotionEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    button.remove();
                }
            });
        } else {
            // Android
            window.addEventListener('devicemotion', handleMotion);
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.world.step(1/60);
        
        this.dice.forEach(die => {
            die.mesh.position.copy(die.body.position);
            die.mesh.quaternion.copy(die.body.quaternion);
        });
        
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        const aspect = window.innerWidth / (window.innerHeight * 0.25);
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight * 0.25);
    }
}