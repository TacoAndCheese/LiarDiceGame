document.addEventListener('DOMContentLoaded', function() {
    // Audio elements
    const bgMusic = document.getElementById('bgMusic');
    const diceSound = new Audio('audio/dice-142528.mp3');
    const musicToggle = document.getElementById('music-toggle');
    const musicIcon = document.getElementById('music-icon');

    // Screen elements
    const mainMenu = document.getElementById('main-menu');
    const optionsScreen = document.getElementById('options-screen');
    const rulesScreen = document.getElementById('rules-screen');
    const gameScreen = document.getElementById('game-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    
    // Game elements
    const diceContainer = document.querySelector('.game-dice-container');
    const diceCountDisplay = document.querySelector('.dice-count-number');
    const gameMessage = document.getElementById('game-message');
    const gameResult = document.getElementById('game-result');
    const rollBtn = document.getElementById('roll-btn');
    const hideBtn = document.getElementById('hide-btn');
    const showBtn = document.getElementById('show-btn');
    const addDiceBtn = document.getElementById('add-dice-btn');
    const removeDiceBtn = document.getElementById('remove-dice-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const backButtons = document.querySelectorAll('.back-to-menu');
    const menuItems = document.querySelectorAll('.menu-item');
    const volumeSlider = document.getElementById('volume-slider');
    const effectsSlider = document.getElementById('effects-slider');
    const changeNameBtn = document.getElementById('change-name-btn');
    const nameChangeModal = document.getElementById('name-change-modal');
    const newNameInput = document.getElementById('new-name-input');
    const confirmNameChange = document.getElementById('confirm-name-change');
    const cancelNameChange = document.getElementById('cancel-name-change');
    const closeModalBtn = document.querySelector('.close-modal');

    // Game state variables
    let playerDice = [];
    let currentDiceCount = 5;
    let isRolling = false;
    let musicEnabled = true;
    let cupVisible = false;

    // 3D Dice variables
    let scene, camera, renderer, world;
    let diceMeshes = [];
    let diceBodies = [];
    let diceRolling = false;
    let diceValues = [];
    let physicsFrameRate = 1 / 60;
    let physicsMaxSubSteps = 3;
    let lastTime;
    
    // Cup variables
    let cupMesh;
    let cupBody;

    let isDragging = false;
    let selectedDie = null;
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let touchStartPos = null;
    let lastTouchTime = 0;
    let playerName = localStorage.getItem('liarsDicePlayerName') || "PLAYER";
    // Game state variables
let currentBid = null;
let computerDiceCount = 5;
let gameState = 'waiting'; // 'waiting', 'player-turn', 'computer-turn', 'challenge'
let computerDice = [];
let roundNumber = 0;


    function updatePlayerNameDisplay() {
        const playerNameElements = document.querySelectorAll('.player-name');
        playerNameElements.forEach(el => {
            el.textContent = playerName;
        });
    }

    function createBackgroundDice() {
        const diceContainer = document.querySelector('.dice-decoration');
        const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        // Clear existing dice
        diceContainer.innerHTML = '';
        
        // Create 20 dice for background
        for (let i = 0; i < 20; i++) {
            const die = document.createElement('span');
            die.textContent = diceFaces[Math.floor(Math.random() * diceFaces.length)];
            
            // Random positioning and animation delays
            die.style.left = `${Math.random() * 100}%`;
            die.style.animationDelay = `${Math.random() * 5}s`;
            die.style.animationDuration = `${8 + Math.random() * 7}s`;
            die.style.fontSize = `${1 + Math.random() * 2}rem`;
            
            diceContainer.appendChild(die);
        }
    }

    function setupEventListeners() {
        // Music toggle
        musicToggle.addEventListener('click', toggleMusic);
        musicToggle.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleMusic();
        });
        musicToggle.style.touchAction = 'manipulation';
        
        // Menu navigation
        menuItems.forEach(item => {
            item.addEventListener('click', handleMenuItemClick);
            item.addEventListener('touchend', function(e) {
                e.preventDefault();
                handleMenuItemClick.call(this);
            });
            item.style.touchAction = 'manipulation';
        });

        // Back buttons
        backButtons.forEach(button => {
            button.addEventListener('click', returnToMainMenu);
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                returnToMainMenu();
            });
            button.style.touchAction = 'manipulation';
        });

        // Volume controls
        volumeSlider.addEventListener('input', handleVolumeChange);
        effectsSlider.addEventListener('input', handleEffectsVolumeChange);

        // Game controls
        rollBtn.addEventListener('click', rollDice);
        rollBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            rollDice();
        });
        rollBtn.style.touchAction = 'manipulation';
        
        // Cup controls
        hideBtn.addEventListener('click', toggleDiceCover);
        hideBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleDiceCover();
        });
        hideBtn.style.touchAction = 'manipulation';
        
        showBtn.addEventListener('click', toggleDiceCover);
        showBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleDiceCover();
        });
        showBtn.style.touchAction = 'manipulation';
        
        // Dice count controls
        addDiceBtn.addEventListener('click', () => adjustDiceCount(1));
        addDiceBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            adjustDiceCount(1);
        });
        addDiceBtn.style.touchAction = 'manipulation';
        
        removeDiceBtn.addEventListener('click', () => adjustDiceCount(-1));
        removeDiceBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            adjustDiceCount(-1);
        });
        removeDiceBtn.style.touchAction = 'manipulation';
        
        // Play Again button
        playAgainBtn.addEventListener('click', handlePlayAgain);
        playAgainBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            handlePlayAgain();
        });
        playAgainBtn.style.touchAction = 'manipulation';

        changeNameBtn.addEventListener('click', () => {
            newNameInput.value = playerName;
            nameChangeModal.classList.remove('hidden');
            newNameInput.focus();
        });
        
        confirmNameChange.addEventListener('click', savePlayerName);
        cancelNameChange.addEventListener('click', closeNameModal);
        closeModalBtn.addEventListener('click', closeNameModal);
        
        // Close modal when clicking outside
        nameChangeModal.addEventListener('click', (e) => {
            if (e.target === nameChangeModal) {
                closeNameModal();
            }
        });
        
        // Allow Enter key to submit
        newNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                savePlayerName();
            }
        });

                // Bid quantity controls
                document.getElementById('increase-quantity').addEventListener('click', () => {
                    const element = document.getElementById('bid-quantity-value');
                    let value = parseInt(element.textContent);
                    if (value < 20) {
                        element.textContent = value + 1;
                    }
                });
            
                document.getElementById('decrease-quantity').addEventListener('click', () => {
                    const element = document.getElementById('bid-quantity-value');
                    let value = parseInt(element.textContent);
                    if (value > 1) {
                        element.textContent = value - 1;
                    }
                });
            
                // Bid face controls
                document.getElementById('increase-face').addEventListener('click', () => {
                    const element = document.getElementById('bid-face-value');
                    let value = parseInt(element.textContent);
                    if (value < 6) {
                        element.textContent = value + 1;
                    }
                });
            
                document.getElementById('decrease-face').addEventListener('click', () => {
                    const element = document.getElementById('bid-face-value');
                    let value = parseInt(element.textContent);
                    if (value > 1) {
                        element.textContent = value - 1;
                    }
                });
            
                // Bid button
                document.getElementById('make-bid-btn').addEventListener('click', () => {
                    const quantity = parseInt(document.getElementById('bid-quantity-value').textContent);
                    const face = parseInt(document.getElementById('bid-face-value').textContent);
                    makeBid(quantity, face);
                });
            
                // Challenge button
                document.getElementById('challenge-btn').addEventListener('click', challenge);
    }


    function savePlayerName() {
        const newName = newNameInput.value.trim();
        if (newName && newName !== playerName) {
            playerName = newName.substring(0, 12); // Limit to 12 chars
            localStorage.setItem('liarsDicePlayerName', playerName);
            updatePlayerNameDisplay();
            closeNameModal();
            showToast("Name changed successfully!");
        } else {
            closeNameModal();
        }
    }

    function closeNameModal() {
        nameChangeModal.classList.add('hidden');
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 2500);
    }

    function init3DDice() {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        if (scene) {
            clear3DDice();
        }
        const loader = new THREE.GLTFLoader();
        
        // Camera setup - adjusted for better viewing angle
        camera = new THREE.PerspectiveCamera(60, diceContainer.clientWidth / diceContainer.clientHeight, 0.1, 1000);
        camera.position.set(-0.1, 10.5, 11.8); 
        camera.lookAt(0, 0, 0);
        
        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(diceContainer.clientWidth, diceContainer.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        renderer.domElement.style.zIndex = '1';
        renderer.domElement.addEventListener('mousedown', onMouseDown, false);
        renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        renderer.domElement.addEventListener('mouseup', onMouseUp, false);
        renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
        renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });
        diceContainer.insertBefore(renderer.domElement, diceContainer.firstChild);
        
        // Lights - enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1200;
        directionalLight.shadow.mapSize.height = 1200;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        scene.add(directionalLight);
        
        // Add fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, 5);
        scene.add(fillLight);
        
        // Load 3D table model
        loader.load(
            'models/blackjack_table.glb', // Replace with your model path
            (gltf) => {
                const table = gltf.scene;
                
                // Set scale, position and rotation as specified
                table.scale.set(25, 15, 25);
                table.position.set(0, -15, 20);
                table.rotation.y = Math.PI;
                
                // Enable shadows and set material properties
                table.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material.roughness = 0.7;
                        child.material.metalness = 0.2;
                    }
                });
                
                scene.add(table);
            }
        );
        
        // Physics world
        world = new CANNON.World();
        world.gravity.set(0, -15, 0); // Stronger gravity for faster settling
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 50;
        
        // Create a ground plane for physics (kept as simple plane)
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.y = -0.5;
        world.addBody(groundBody);
        
        loadScene();
        // Create the cup
        createCup();
        
        // Create dice geometry and materials
        createDiceMeshes();
        
        // Start animation loop
        lastTime = performance.now();
        animate();
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
    }

    function createCup() {
        // Remove existing cup if any
        if (cupMesh) {
            scene.remove(cupMesh);
            if (cupMesh.geometry) cupMesh.geometry.dispose();
            if (cupMesh.material) {
                if (Array.isArray(cupMesh.material)) {
                    for (const material of cupMesh.material) {
                        if (material) material.dispose();
                    }
                } else {
                    cupMesh.material.dispose();
                }
            }
            cupMesh = null;
        }
    
        // Create loader
        const loader = new THREE.GLTFLoader();
    
        loader.load(
            'models/Stark-Cup.glb',
            (gltf) => {
                cupMesh = gltf.scene;
                
                // Scale down significantly
                cupMesh.scale.set(0.16, 0.16, 0.16);
                
                // Position at (0,0,0)
                cupMesh.position.set(-6.08, 12, 6);
                
                // Rotate -90 degrees (around X-axis)
                cupMesh.rotation.x = -Math.PI / 2;
                
                // Enable shadows
                cupMesh.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x5C4033, // Charcoal hex color
                            roughness: 0.8,
                            metalness: 0.4
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Add to scene
                scene.add(cupMesh);
                cupMesh.visible = cupVisible;
                
                // No physics body needed (removed CANNON.js code)
            },
            undefined,
            (error) => {
                console.error('Error loading cup model:', error);
                createSimpleCup();
            }
        );
    }
    
    function createSimpleCup() {
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();
        
        // Load texture (replace 'path/to/your/texture.jpg' with your actual texture path)
        const cupTexture = textureLoader.load("https://static.vecteezy.com/system/resources/thumbnails/006/793/299/small_2x/wood-texture-planks-vertical-patterns-light-brown-design-background-vector.jpg");
        cupTexture.wrapS = THREE.RepeatWrapping;
        cupTexture.wrapT = THREE.RepeatWrapping;
        cupTexture.repeat.set(2, 1);

        // Cup dimensions
        const radius = 7;
        const height = 6;
        const segments = 16;
        
        // Create cup mesh with texture
        const cupGeometry = new THREE.CylinderGeometry(radius, radius, height, 256);
        const cupMaterial = new THREE.MeshStandardMaterial({ 
            map: cupTexture,
            metalness: 0.3,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        cupMesh = new THREE.Mesh(cupGeometry, cupMaterial);
        cupMesh.position.set(0, height/2, 0);
        cupMesh.rotation.x = Math.PI;
        cupMesh.castShadow = true;
        cupMesh.receiveShadow = true;
        cupMesh.visible = cupVisible;
        scene.add(cupMesh);
    }

    // Modify the rollDice function to not hide the cup:
    function rollDice() {
        if (diceRolling || currentDiceCount <= 0) return;
        
        diceRolling = true;
        isRolling = true;
        disableAllButtons();
        
        diceSound.currentTime = 0;
        diceSound.play();
        
        // Remove any existing dice but keep the cup
        for (const mesh of diceMeshes) {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    for (const material of mesh.material) {
                        if (material) material.dispose();
                    }
                } else {
                    mesh.material.dispose();
                }
            }
        }
        
        for (const body of diceBodies) {
            world.removeBody(body);
        }
        
        diceMeshes = [];
        diceBodies = [];
        
        // Create new dice
        createDiceMeshes();
        
        // Start the rolling animation
        roll3DDice();
    }

    function onWindowResize() {
        camera.aspect = diceContainer.clientWidth / diceContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(diceContainer.clientWidth, diceContainer.clientHeight);
    }

    function createDiceMeshes() {
        // Dice geometry
        const diceGeometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Materials for each face (gold color)
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xd4af37 }), // right
            new THREE.MeshStandardMaterial({ color: 0xd4af37 }), // left
            new THREE.MeshStandardMaterial({ color: 0xd4af37 }), // top
            new THREE.MeshStandardMaterial({ color: 0xd4af37 }), // bottom
            new THREE.MeshStandardMaterial({ color: 0xd4af37 }), // front
            new THREE.MeshStandardMaterial({ color: 0xd4af37 })  // back
        ];
        
        // Create dots for dice faces
        const dotGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const dotMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        
        // Create dice meshes based on currentDiceCount
        for (let i = 0; i < currentDiceCount; i++) {
            const diceMesh = new THREE.Mesh(diceGeometry, materials);
            diceMesh.castShadow = true;
            diceMesh.receiveShadow = true;
            
            // Add dots to represent dice faces
            addDiceDots(diceMesh, dotGeometry, dotMaterial);
            
            scene.add(diceMesh);
            diceMeshes.push(diceMesh);
            
            // Create physics body
            const diceShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            const diceBody = new CANNON.Body({
                mass: 1,
                shape: diceShape,
                material: new CANNON.Material({ restitution: 0.3, friction: 0.3 })
            });
            
            // Position dice in a row
            diceBody.position.set((i - (currentDiceCount - 1) / 2) * 2, 5, 0);
            diceBody.linearDamping = 0.1;
            diceBody.angularDamping = 0.1;
            
            // Add some initial rotation and velocity
            diceBody.angularVelocity.set(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
            
            diceBody.velocity.set(0, -5, 0);
            
            world.addBody(diceBody);
            diceBodies.push(diceBody);
        }
    }

    function addDiceDots(diceMesh, dotGeometry, dotMaterial) {
        // Positions for dots on each face (1-6)
        const dotPositions = {
            1: [[0, 0, 0.51]],
            2: [[-0.3, -0.3, 0.51], [0.3, 0.3, 0.51]],
            3: [[-0.3, -0.3, 0.51], [0, 0, 0.51], [0.3, 0.3, 0.51]],
            4: [[-0.3, -0.3, 0.51], [-0.3, 0.3, 0.51], [0.3, -0.3, 0.51], [0.3, 0.3, 0.51]],
            5: [[-0.3, -0.3, 0.51], [-0.3, 0.3, 0.51], [0, 0, 0.51], [0.3, -0.3, 0.51], [0.3, 0.3, 0.51]],
            6: [[-0.3, -0.3, 0.51], [-0.3, 0, 0.51], [-0.3, 0.3, 0.51], 
                [0.3, -0.3, 0.51], [0.3, 0, 0.51], [0.3, 0.3, 0.51]]
        };
        
        // Create dots for each face and add collider information
        for (let face = 1; face <= 6; face++) {
            const positions = dotPositions[face];
            for (const pos of positions) {
                const dot = new THREE.Mesh(dotGeometry, dotMaterial);
                
                // Position dot on the appropriate face
                // Also add userData to identify which face this is
                switch(face) {
                    case 1: 
                        dot.position.set(pos[0], pos[1], pos[2]);
                        dot.userData = { face: 1 };
                        break;
                    case 2: 
                        dot.position.set(pos[0], pos[1], -pos[2]);
                        dot.userData = { face: 2 };
                        break;
                    case 3: 
                        dot.position.set(pos[0], pos[2], pos[1]);
                        dot.userData = { face: 3 };
                        break;
                    case 4: 
                        dot.position.set(pos[0], -pos[2], pos[1]);
                        dot.userData = { face: 4 };
                        break;
                    case 5: 
                        dot.position.set(pos[2], pos[0], pos[1]);
                        dot.userData = { face: 5 };
                        break;
                    case 6: 
                        dot.position.set(-pos[2], pos[0], pos[1]);
                        dot.userData = { face: 6 };
                        break;
                }
                
                diceMesh.add(dot);
            }
        }
    }


    function animate() {
        requestAnimationFrame(animate);
        
        const time = performance.now();
        const delta = (time - lastTime) / 1000;
        
        // Update physics - but skip if we're dragging a die or if world doesn't exist
        if (!isDragging && world) {
            world.step(physicsFrameRate, delta, physicsMaxSubSteps);
        }
        
        // Update dice positions - only if both arrays exist and have matching lengths
        if (diceMeshes && diceBodies && diceMeshes.length === diceBodies.length) {
            for (let i = 0; i < diceMeshes.length; i++) {
                diceMeshes[i].position.copy(diceBodies[i].position);
                diceMeshes[i].quaternion.copy(diceBodies[i].quaternion);
            }
        }
        
        // Only render if renderer and scene exist
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
        
        lastTime = time;
        
        // Check if dice have settled (only when not dragging)
        if (diceRolling && !isDragging && diceBodies) {
            let allStopped = true;
            for (const body of diceBodies) {
                if (body.velocity.length() > 0.1 || body.angularVelocity.length() > 0.1) {
                    allStopped = false;
                    break;
                }
            }
            
            if (allStopped) {
                diceRolling = false;
                isRolling = false;
                calculateDiceValues();
                updateButtonStates();
            }
        }
    }

    function calculateDiceValues() {
        diceValues = [];        
        
        for (let i = 0; i < diceMeshes.length; i++) {
            const die = diceMeshes[i];
            const dieWorldPosition = new THREE.Vector3();
            die.getWorldPosition(dieWorldPosition);
            
            
            // Create a matrix to transform local directions to world space
            const matrix = new THREE.Matrix4().compose(
                new THREE.Vector3(),
                die.quaternion,
                new THREE.Vector3(1, 1, 1)
            );
            
            // Directions for each face in local space
            const faceDirections = [
                new THREE.Vector3(0, 0, 1),  // Face 1 (front)
                new THREE.Vector3(0, 0, -1), // Face 2 (back)
                new THREE.Vector3(0, 1, 0),  // Face 3 (top)
                new THREE.Vector3(0, -1, 0),  // Face 4 (bottom)
                new THREE.Vector3(1, 0, 0),  // Face 5 (right)
                new THREE.Vector3(-1, 0, 0)   // Face 6 (left)
            ];
            
            // Transform directions to world space
            const worldDirections = faceDirections.map(dir => {
                return dir.applyMatrix4(matrix).normalize();
            });
            
            // Find which face is most downward-pointing
            let maxDot = -Infinity;
            let faceValue = 1;
            
            for (let j = 0; j < worldDirections.length; j++) {
                const dot = worldDirections[j].dot(new THREE.Vector3(0, -1, 0));
                if (dot > maxDot) {
                    maxDot = dot;
                    faceValue = j + 1; // Faces are 1-6
                }
            }
            
            // Map the face value to the displayed result
            let displayedValue;
            switch(faceValue) {
                case 6: displayedValue = 5; break;
                case 5: displayedValue = 6; break;
                case 4: displayedValue = 3; break;
                case 3: displayedValue = 4; break;
                case 2: displayedValue = 1; break;
                case 1: displayedValue = 2; break;
                default: displayedValue = 1;
            }
            
            diceValues.push(displayedValue);
        }
        
        // Update playerDice with the new values (0-5 index)
        playerDice = diceValues.map(v => v - 1);
        updateResultsDisplay();
    }


    function roll3DDice() {
        if (diceRolling || currentDiceCount <= 0) return;
        
        diceRolling = true;
        isRolling = true;
        disableAllButtons();
        
        diceSound.currentTime = 0;
        diceSound.play();
        
        // Reset dice positions and apply new forces with consistent timing
        for (let i = 0; i < diceBodies.length; i++) {
            const body = diceBodies[i];
            
            // Reset position (spread them out more)
            body.position.set(
                (i - (currentDiceCount - 1) / 2) * 3,
                8,
                0
            );
            
            // Consistent downward velocity for all dice
            body.velocity.set(
                Math.random() * 2 - 1,
                -12,
                Math.random() * 2 - 1
            );
            
            // Random rotation
            body.quaternion.set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).normalize();
            
            // Consistent angular velocity for all dice
            body.angularVelocity.set(
                (Math.random() * 10 - 5) * 1.5,
                (Math.random() * 10 - 5) * 1.5,
                (Math.random() * 10 - 5) * 1.5
            );
            
            // Adjust damping to make them settle at about the same time
            body.linearDamping = 0.4;
            body.angularDamping = 0.4;
        }
    }

    function clear3DDice() {
        // Remove all dice from scene and physics world
        for (const mesh of diceMeshes) {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    for (const material of mesh.material) {
                        if (material) material.dispose();
                    }
                } else {
                    mesh.material.dispose();
                }
            }
        }
        
        for (const body of diceBodies) {
            world.removeBody(body);
        }
        
        diceMeshes = [];
        diceBodies = [];
        
        // Don't remove the renderer here
    }


    function toggleDiceCover() {
        if (isRolling || currentDiceCount <= 0) return;
        
        cupVisible = !cupVisible;
        if (cupMesh) cupMesh.visible = cupVisible;
        
        // Play cup sound effect
        const cupSound = document.getElementById('cupSound');
        cupSound.currentTime = 0;
        cupSound.volume = parseFloat(effectsSlider.value);
        cupSound.play();
        
        // Update button states
        hideBtn.classList.toggle('hidden');
        showBtn.classList.toggle('hidden');
    }

    function updateDiceCount() {
        diceCountDisplay.textContent = currentDiceCount;
    }

    function disableAllButtons() {
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.disabled = true;
        });
    }

    function updateButtonStates() {
        const noDiceLeft = currentDiceCount <= 0;
        rollBtn.disabled = isRolling || noDiceLeft;
        hideBtn.disabled = isRolling || noDiceLeft;
        showBtn.disabled = isRolling || noDiceLeft;
        addDiceBtn.disabled = isRolling || currentDiceCount >= 5;
        removeDiceBtn.disabled = isRolling || currentDiceCount <= 0;
    }

    function endGame(hasWon) {
        isRolling = false;
        diceRolling = false;
        showScreen(gameOverScreen);
        
        if (hasWon) {
            gameResult.textContent = "You won! Computer is out of dice!";
            document.querySelector('.result-icon').className = 'result-icon';
            document.querySelector('.result-icon').innerHTML = '<i class="fas fa-trophy"></i>';
        } else {
            gameResult.textContent = "Game Over - You're out of dice!";
            document.querySelector('.result-icon').className = 'result-icon';
            document.querySelector('.result-icon').innerHTML = '<i class="fas fa-skull"></i>';
        }
        
        playAgainBtn.disabled = false;
        clear3DDice();
    }

    // Screen management
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        screen.classList.remove('hidden');
        
        // Initialize 3D dice when showing game screen
        if (screen === gameScreen && currentDiceCount > 0) {
            init3DDice();
        }
    }
    
    function returnToMainMenu() {
        resetGame();
        showScreen(mainMenu);
    }

    function adjustDiceCount(change) {
        if (isRolling) return;
        
        const newCount = currentDiceCount + change;
        
        // Validate bounds (0-5 dice)
        if (newCount < 0 || newCount > 5) return;
        
        // Play dice sound
        diceSound.currentTime = 0;
        diceSound.play();
        
        currentDiceCount = newCount;
        updateDiceCount();
        
        // Clear and recreate the dice
        clear3DDice();
        
        if (currentDiceCount > 0 && !gameScreen.classList.contains('hidden')) {
            createDiceMeshes();
        }
        
        // Check for game over immediately after adjustment
        if (currentDiceCount <= 0) {
            endGame(false);
            return;
        }
        
        if (computerDiceCount <= 0) {
            endGame(true);
            return;
        }
    
        if (change !== 0) {
            diceValues = [];
            updateResultsDisplay();
        }
        
        updateButtonStates();
    }

    function initializeGame() {
        setupEventListeners();
        tryAutoplay();
        createBackgroundDice();
        gameMessage.style.display = 'none';
        
        // Always start with "PLAYER" as default name
        playerName = "PLAYER";
        // Only use saved name if it exists and isn't "PLAYER"
        const savedName = localStorage.getItem('liarsDicePlayerName');
        if (savedName && savedName !== "PLAYER") {
            playerName = savedName;
        }
        updatePlayerNameDisplay();
    }
    
    function resetGame() {
        // Clear all 3D objects and physics
        clear3DDice();
        
        // Reset game state variables
        playerDice = [];
        currentDiceCount = 5;
        computerDiceCount = 5;
        isRolling = false;
        diceRolling = false;
        cupVisible = false;
        diceValues = [];
        currentBid = null;
        gameState = 'waiting';
        roundNumber = 0;
        computerDice = [];
        
        // Reset UI
        updateDiceCount();
        updateComputerDiceCount();
        updateBidDisplay();
        showGameMessage("");
        updateResultsDisplay();
        
        // Reset bid controls
        document.getElementById('bid-quantity-value').textContent = '1';
        document.getElementById('bid-face-value').textContent = '1';
        
        // Reset buttons
        hideBtn.classList.remove('hidden');
        showBtn.classList.add('hidden');
        updateButtonStates();
        
        // Completely clean up Three.js and Cannon.js
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement.parentNode === diceContainer) {
                diceContainer.removeChild(renderer.domElement);
            }
        }
        
        scene = null;
        camera = null;
        renderer = null;
        world = null;
    }

    function startGame() {
        resetGame();
        playerDice = Array(currentDiceCount).fill(0);
        computerDiceCount = 5;
        updateDiceCount();
        updateComputerDiceCount();
        currentBid = null;
        roundNumber = 0;
        gameState = 'waiting';
        
        init3DDice();
        showScreen(gameScreen);
        
        // Start the first round immediately
        startNewRound();
    }
    
    function startNewRound() {
        roundNumber++;
        currentBid = null;
        updateBidDisplay();
        showGameMessage("");
        
        // Roll dice for both players
        rollComputerDice();
        rollDice();
        
        // Wait for dice to settle before starting the round
        setTimeout(() => {
            // Alternate who starts each round
            if (roundNumber % 2 === 0) {
                gameState = 'computer-turn';
                computerTurn();
            } else {
                gameState = 'player-turn';
                updateButtonStates();
                showGameMessage("Your turn - make a bid or challenge");
            }
        }, 2000);
    }

    function handlePlayAgain() {
        resetGame();
        startGame();
    }

    function handleVolumeChange() {
        bgMusic.volume = this.value;
    }

    function handleEffectsVolumeChange() {
        const volume = parseFloat(this.value);
        diceSound.volume = volume;
    }

    function handleMenuItemClick() {
        const action = this.getAttribute('data-action');
        handleMenuAction(action);
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': 
                resetGame();
                startGame(); 
                break;
            case 'multiplayer':
                showScreen(lobbyScreen);
                break;
            case 'options': 
                showScreen(optionsScreen); 
                break;
            case 'rules': 
                showScreen(rulesScreen); 
                break;
        }
    }

    // Music functions
    function toggleMusic() {
        musicEnabled = !musicEnabled;
        
        if (musicEnabled) {
            bgMusic.play().catch(e => console.log("Audio play failed:", e));
            musicToggle.classList.remove('off');
            musicIcon.textContent = '🔊';
        } else {
            bgMusic.pause();
            musicToggle.classList.add('off');
            musicIcon.textContent = '🔇';
        }
    }

    function tryAutoplay() {
        bgMusic.play()
            .then(() => {
                musicEnabled = true;
                musicToggle.classList.remove('off');
                musicIcon.textContent = '🔊';
            })
            .catch(error => {
                musicEnabled = false;
                musicToggle.classList.add('off');
                musicIcon.textContent = '🔇';
            });
    }

    function updateResultsDisplay() {
        const resultsContainer = document.getElementById('dice-results-display');
        resultsContainer.innerHTML = '';
        
        if (!diceValues || diceValues.length === 0) return;
        
        // Dice face icons (using UTF-8 dice characters)
        const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        diceValues.forEach(value => {
            if (value >= 1 && value <= 6) {
                const icon = document.createElement('div');
                icon.className = 'result-icon';
                icon.textContent = diceIcons[value - 1];
                icon.title = `Dice value: ${value}`;
                resultsContainer.appendChild(icon);
            }
        });
    }

    function getMousePosition(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    function getTouchPosition(event) {
        if (event.touches.length > 0) {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
        }
    }
    
    function onMouseDown(event) {
        if (diceRolling || isRolling) return;
        
        getMousePosition(event);
        checkDieSelection();
    }
    
    function onMouseMove(event) {
        if (!isDragging || !selectedDie || diceRolling || isRolling) return;
        
        getMousePosition(event);
        moveSelectedDie();
    }
    
    function onMouseUp() {
        if (isDragging && selectedDie) {
            // Apply some velocity when releasing
            const body = diceBodies[diceMeshes.indexOf(selectedDie)];
            if (body) {
                body.velocity.set(
                    (Math.random() - 0.5) * 5,
                    0,
                    (Math.random() - 0.5) * 5
                );
            }
        }
        isDragging = false;
        selectedDie = null;
    }
    
    function onTouchStart(event) {
        if (diceRolling || isRolling) return;
        
        event.preventDefault();
        getTouchPosition(event);
        
        // Check for double tap
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTouchTime;
        if (tapLength < 300 && tapLength > 0) {
            // Double tap - roll all dice
            rollDice();
            return;
        }
        lastTouchTime = currentTime;
        
        touchStartPos = { x: mouse.x, y: mouse.y };
        checkDieSelection();
    }
    
    function onTouchMove(event) {
        if (!isDragging || !selectedDie || diceRolling || isRolling) return;
        
        event.preventDefault();
        getTouchPosition(event);
        moveSelectedDie();
    }
    
    function onTouchEnd(event) {
        if (isDragging && selectedDie) {
            event.preventDefault();
            const body = diceBodies[diceMeshes.indexOf(selectedDie)];
            if (body) {
                body.velocity.set(
                    (Math.random() - 0.5) * 5,
                    0,
                    (Math.random() - 0.5) * 5
                );
            }
        }
        isDragging = false;
        selectedDie = null;
        touchStartPos = null;
    }
    
    function checkDieSelection() {
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(diceMeshes);
        
        if (intersects.length > 0) {
            selectedDie = intersects[0].object;
            isDragging = true;
            
            // Lift the die slightly when selected
            const body = diceBodies[diceMeshes.indexOf(selectedDie)];
            if (body) {
                body.position.y += 0.5;
                body.velocity.set(0, 0, 0);
                body.angularVelocity.set(0, 0, 0);
            }
        }
    }
    
    function moveSelectedDie() {
        if (!selectedDie) return;
        
        // Find the physics body for the selected die
        const dieIndex = diceMeshes.indexOf(selectedDie);
        if (dieIndex === -1) return;
        
        const body = diceBodies[dieIndex];
        if (!body) return;
        
        // Create a ray from the camera through the mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Create a plane at the table height to intersect with
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        
        if (intersection) {
            // Move the physics body to the intersection point
            body.position.copy(intersection);
            body.position.y += 0.5; // Keep it slightly above the table
            
            // Zero out velocity to prevent physics from interfering
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
        }
    }

    function loadScene() {
        // Create texture loader
        const textureLoader = new THREE.TextureLoader();
        const loader = new THREE.GLTFLoader();
        
        // Load textures (replace these URLs with your actual texture paths)
        const Texture_1= textureLoader.load("textures/floor1.avif");
        const Texture_2= textureLoader.load("textures/floor2.jpg");
        
            // Load first model
        loader.load(
        'models/slotmachine_uncompressed.glb', // Replace with your actual model path
        (gltf) => {
            const model1 = gltf.scene;
            model1.scale.set(40,40,40);
            model1.position.set(43, -4,-30);
            model1.rotation.y= -0.87*Math.PI; 
            model1.castShadow = true;
            model1.receiveShadow = true;
            scene.add(model1);
        },
        undefined,
        (error) => {
            console.error('Error loading model 1:', error);
        }
    );

    // Load second model
        loader.load(
        'models/slotmachine_uncompressed.glb', // Replace with your actual model path
        (gltf) => {
            const model2 = gltf.scene;
            model2.scale.set(40,40,40);
            model2.position.set(-43, -4,-30); 
            model2.rotation.y= -2.2*Math.PI;
            model2.castShadow = true;
            model2.receiveShadow = true;
            scene.add(model2);
        },
        undefined,
        (error) => {
            console.error('Error loading model 2:', error);
        }
    );

        // Create a large plane for the base with texture
        const planeGeometry = new THREE.PlaneGeometry(300, 200);
        const planeMaterial = new THREE.MeshStandardMaterial({ 
            map: Texture_2,
            roughness: 0.8,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        plane.position.set(0, -6, 0);
        plane.receiveShadow = true;
        scene.add(plane);
        
        // Create a red plane for contrast with texture
        const redPlaneGeometry = new THREE.PlaneGeometry(50, 200);
        const redPlaneMaterial = new THREE.MeshStandardMaterial({ 
            map: Texture_1,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const redPlane = new THREE.Mesh(redPlaneGeometry, redPlaneMaterial);
        redPlane.rotation.x = -Math.PI / 2;
        redPlane.position.set(0, -5.8, 0); // Slightly above the white plane
        redPlane.receiveShadow = true;
        scene.add(redPlane);
        
        // Add physics bodies for the planes
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.y = -20;
        world.addBody(groundBody);
    }

    function updateComputerDiceCount() {
        document.getElementById('computer-dice-count').textContent = computerDiceCount;
    }
    
    function rollComputerDice() {
        computerDice = [];
        for (let i = 0; i < computerDiceCount; i++) {
            computerDice.push(Math.floor(Math.random() * 6) + 1); // 1-6
        }
        console.log("Computer's dice:", computerDice); // Add this line
    }
    
    function calculateTotalDice() {
        const allDice = [...diceValues, ...computerDice];
        const counts = [0, 0, 0, 0, 0, 0];
        
        // Count each face (1-6)
        allDice.forEach(value => {
            counts[value - 1]++;
        });
        
        return counts;
    }
    
    function isValidBid(newBid) {
        if (!currentBid) return true; // First bid is always valid
        
        // New bid must have higher quantity or same quantity but higher face value
        return (newBid.quantity > currentBid.quantity) || 
               (newBid.quantity === currentBid.quantity && newBid.face > currentBid.face);
    }
    
    function makeBid(quantity, face) {
        if (gameState !== 'player-turn') {
            showGameMessage("It's not your turn!");
            return;
        }
        
        const newBid = { quantity, face };
        
        if (!isValidBid(newBid)) {
            showGameMessage(`Invalid bid! Must be higher than current bid (${currentBid ? `${currentBid.quantity} ${currentBid.face}s` : 'none'})`);
            return;
        }
        
        currentBid = {
            quantity,
            face,
            bidder: 'player' // Track who made this bid
        };
        updateBidDisplay();
        showGameMessage(`You bid ${quantity} ${face}s`);
        
        // Computer's turn
        gameState = 'computer-turn';
        setTimeout(computerTurn, 1500);
    }
    
    function challenge() {
        if (gameState !== 'player-turn') {
            showGameMessage("It's not your turn!");
            return;
        }
        
        if (!currentBid) {
            showGameMessage("There's no bid to challenge!");
            return;
        }
        
        gameState = 'challenge';
        disableAllButtons();
        
        // Calculate actual counts
        const counts = calculateTotalDice();
        const actualCount = counts[currentBid.face - 1];
        
        showGameMessage(`Challenging ${currentBid.quantity} ${currentBid.face}s...`);
        
        setTimeout(() => {
            if (actualCount >= currentBid.quantity) {
                // Bid was correct - challenger (player) loses
                showGameMessage(`There were ${actualCount} ${currentBid.face}s! You lose a die.`);
                adjustDiceCount(-1);
            } else {
                // Bid was incorrect - bidder loses
                const bidder = currentBid.bidder;
                showGameMessage(`There were only ${actualCount} ${currentBid.face}s! ${bidder === 'computer' ? 'Computer' : 'You'} lose a die.`);
                
                if (bidder === 'computer') {
                    computerDiceCount = Math.max(1, computerDiceCount - 1);
                    updateComputerDiceCount();
                } else {
                    adjustDiceCount(-1);
                }
            }
            
            // Check if game is over
            if (currentDiceCount <= 0) {
                endGame(false);
            } else if (computerDiceCount <= 0) {
                endGame(true);
            } else {
                // Start new round
                setTimeout(startNewRound, 2000);
            }
        }, 1500);
    }
    
    function computerTurn() {
        if (gameState !== 'computer-turn') return;
        
        disableAllButtons();
        showGameMessage("Computer is thinking...");
        
        // Calculate probabilities
        const counts = calculateTotalDice();
        const totalDice = diceValues.length + computerDice.length;
        
        setTimeout(() => {
            if (currentBid) {
                // Decide whether to bid or challenge
                const bidProbability = calculateBidProbability(currentBid, counts, totalDice);
                
                if (Math.random() < bidProbability) {
                    // Make a smarter bid
                    const newBid = makeSmartBid(currentBid, counts, totalDice);
                    currentBid = {
                        quantity: newBid.quantity,
                        face: newBid.face,
                        bidder: 'computer' // Track who made this bid
                    };
                    updateBidDisplay();
                    showGameMessage(`Computer bids ${newBid.quantity} ${newBid.face}s`);
                    
                    // Player's turn
                    setTimeout(() => {
                        gameState = 'player-turn';
                        updateButtonStates();
                        showGameMessage("Your turn - make a bid or challenge");
                    }, 1500);
                } else {
                    // Challenge
                    computerChallenge();
                }
            } else {
                // First bid of the round
                const newBid = makeFirstBid(counts);
                currentBid = {
                    quantity: newBid.quantity,
                    face: newBid.face,
                    bidder: 'computer' // Track who made this bid
                };
                updateBidDisplay();
                showGameMessage(`Computer bids ${newBid.quantity} ${newBid.face}s`);
                
                // Player's turn
                setTimeout(() => {
                    gameState = 'player-turn';
                    updateButtonStates();
                    showGameMessage("Your turn - make a bid or challenge");
                }, 1500);
            }
        }, 1500); // Thinking delay
    }
    
    function calculateBidProbability(currentBid, counts, totalDice) {
        const currentFaceCount = counts[currentBid.face - 1];
        const remainingDice = totalDice - diceValues.length;
        const needed = currentBid.quantity - currentFaceCount;
        
        // If the bid is mathematically impossible (needed > remaining dice)
        if (needed > remainingDice) {
            return 0.05; // 95% chance to challenge
        }
        
        // Calculate probability based on how likely the bid is to be true
        const probabilityPerDie = 1/6; // Chance a random die matches our face
        const expectedMatches = remainingDice * probabilityPerDie;
        const totalExpected = currentFaceCount + expectedMatches;
        
        // Base probability is higher when the bid seems likely
        let baseProbability = 0.6; // Default 60% chance to continue bidding
        
        // Adjust based on how close the expected total is to the bid
        if (totalExpected > currentBid.quantity) {
            // Bid is likely true - more likely to continue
            baseProbability += 0.3;
        } else if (totalExpected < currentBid.quantity - 1) {
            // Bid seems unlikely - more likely to challenge
            baseProbability -= 0.3;
        }
        
        // Adjust based on computer's own dice
        const computerCount = computerDice.filter(d => d === currentBid.face).length;
        if (computerCount > 0) {
            // Computer has some of this face - more likely to continue
            baseProbability += 0.1;
        } else {
            // Computer has none of this face - more likely to challenge
            baseProbability -= 0.1;
        }
        
        // Ensure probability stays within reasonable bounds
        return Math.max(0.05, Math.min(0.95, baseProbability));
    }

    function makeSmartBid(currentBid, counts, totalDice) {
        const currentFace = currentBid.face;
        const currentQuantity = currentBid.quantity;
        
        // Calculate how many of each face we have (including computer's dice)
        const ourCounts = [...counts];
        computerDice.forEach(die => ourCounts[die - 1]++);
        
        // Find the face we have the most of (including computer's dice)
        let bestFace = currentFace;
        let maxCount = ourCounts[currentFace - 1];
        for (let face = 1; face <= 6; face++) {
            if (ourCounts[face - 1] > maxCount) {
                maxCount = ourCounts[face - 1];
                bestFace = face;
            }
        }
        
        // Decide whether to increase quantity or face value
        // Prefer increasing quantity when we have strong evidence
        const increaseQuantity = (Math.random() < 0.7) || (currentFace >= 6);
        
        if (increaseQuantity) {
            return {
                quantity: currentQuantity + 1,
                face: bestFace // Switch to our strongest face
            };
        } else {
            // When increasing face, choose the next face we have some of
            let newFace = currentFace;
            for (let face = currentFace + 1; face <= 6; face++) {
                if (ourCounts[face - 1] > 0) {
                    newFace = face;
                    break;
                }
            }
            if (newFace === currentFace) newFace = Math.min(6, currentFace + 1);
            
            return {
                quantity: currentQuantity,
                face: newFace
            };
        }
    }
    
    function makeFirstBid(counts) {
        // Count computer's dice along with estimated player's dice
        const ourCounts = [...counts];
        computerDice.forEach(die => ourCounts[die - 1]++);
        
        // Find our most common face
        let mostCommonFace = 1;
        let maxCount = ourCounts[0];
        for (let face = 2; face <= 6; face++) {
            if (ourCounts[face - 1] > maxCount) {
                maxCount = ourCounts[face - 1];
                mostCommonFace = face;
            }
        }
        
        // Start with a conservative bid based on our count
        const baseQuantity = Math.max(1, maxCount);
        
        // Add some randomness but keep it reasonable
        const randomAdjustment = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const finalQuantity = Math.max(1, baseQuantity + randomAdjustment);
        
        return {
            quantity: finalQuantity,
            face: mostCommonFace
        };
    }
    
    function getRandomFaceExcept(currentFace) {
        let newFace;
        do {
            newFace = Math.floor(Math.random() * 6) + 1;
        } while (newFace === currentFace);
        return newFace;
    }
    
    function getNextLikelyFace(currentFace, counts) {
        // Find next face we have that's higher than current
        for (let face = currentFace + 1; face <= 6; face++) {
            if (counts[face - 1] > 0) {
                return face;
            }
        }
        // If no higher faces, just increment
        return Math.min(6, currentFace + 1);
    }
    

    function computerChallenge() {
        showGameMessage("Computer challenges your bid!");
        
        // Add visual indicator
        const challengeIndicator = document.createElement('div');
        challengeIndicator.className = 'turn-indicator computer-turn-indicator';
        challengeIndicator.textContent = 'COMPUTER CHALLENGES!';
        document.body.appendChild(challengeIndicator);
        
        setTimeout(() => {
            challengeIndicator.remove();
        }, 2000);
        
        // Calculate actual counts
        const counts = calculateTotalDice();
        const actualCount = counts[currentBid.face - 1];
        
        setTimeout(() => {
            if (actualCount >= currentBid.quantity) {
                // Bid was correct - challenger (computer) loses
                showGameMessage(`There were ${actualCount} ${currentBid.face}s! Computer loses a die.`);
                computerDiceCount = Math.max(1, computerDiceCount - 1);
                updateComputerDiceCount();
            } else {
                // Bid was incorrect - bidder (player) loses
                showGameMessage(`There were only ${actualCount} ${currentBid.face}s! You lose a die.`);
                adjustDiceCount(-1);
            }
            
            // Check if game is over
            if (currentDiceCount <= 0) {
                endGame(false);
            } else if (computerDiceCount <= 0) {
                endGame(true);
            } else {
                // Start new round
                setTimeout(startNewRound, 2000);
            }
        }, 1500);
    }
    
    function updateBidDisplay() {
        const bidDisplay = document.getElementById('current-bid');
        if (currentBid) {
            bidDisplay.textContent = `Current bid: ${currentBid.quantity} ${currentBid.face}s`;
        } else {
            bidDisplay.textContent = "Current bid: None";
        }
    }
    
    function showGameMessage(message) {
        const messageElement = document.getElementById('game-message');
        messageElement.textContent = message;
    }
    
    function updateButtonStates() {
        const noDiceLeft = currentDiceCount <= 0;
        rollBtn.disabled = isRolling || noDiceLeft;
        hideBtn.disabled = isRolling || noDiceLeft;
        showBtn.disabled = isRolling || noDiceLeft;
        addDiceBtn.disabled = isRolling || currentDiceCount >= 5;
        removeDiceBtn.disabled = isRolling || currentDiceCount <= 0;
        
        // Bid/challenge buttons
        const makeBidBtn = document.getElementById('make-bid-btn');
        const challengeBtn = document.getElementById('challenge-btn');
        
        makeBidBtn.disabled = gameState !== 'player-turn' || isRolling;
        challengeBtn.disabled = gameState !== 'player-turn' || !currentBid || isRolling;
        
        // Bid adjustment buttons - always enabled during player's turn
        const isPlayerTurn = gameState === 'player-turn';
        document.getElementById('decrease-quantity').disabled = !isPlayerTurn || isRolling;
        document.getElementById('increase-quantity').disabled = !isPlayerTurn || isRolling;
        document.getElementById('decrease-face').disabled = !isPlayerTurn || isRolling;
        document.getElementById('increase-face').disabled = !isPlayerTurn || isRolling;
    }

    // Initialize the game
    initializeGame();
});