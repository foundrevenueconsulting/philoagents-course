import { Scene } from 'phaser';
import { ConversationSystem } from '@/lib/phaser/ConversationSystem';
import { multiplayerService } from '@/lib/services/MultiplayerService';
import { Character } from '@/lib/phaser/classes/Character';

interface GameData {
    multiplayerMode?: boolean;
    userName?: string;
    userId?: string;
    isAuthenticated?: boolean;
    characterType?: string;
}

export class Game extends Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private player?: Phaser.Physics.Arcade.Sprite;
    private isMultiplayerMode: boolean = false;
    private gameConfig: GameData = {};
    private userName: string = '';
    private userId: string = '';
    private isAuthenticated: boolean = false;
    private conversationSystem?: ConversationSystem;
    private worldMap?: Phaser.Tilemaps.Tilemap;
    private worldLayer?: Phaser.Tilemaps.TilemapLayer | null;
    private philosophers: Character[] = [];

    constructor() {
        super('Game');
    }

    init(data: GameData) {
        // Initialize game configuration from scene data and registry
        this.gameConfig = data || {};
        this.isMultiplayerMode = this.gameConfig.multiplayerMode || false;
        this.userName = this.gameConfig.userName || this.game.registry.get('userName') || 'Anonymous Player';
        this.userId = this.gameConfig.userId || this.game.registry.get('userId') || 'anonymous';
        this.isAuthenticated = this.gameConfig.isAuthenticated || this.game.registry.get('isAuthenticated') || false;
        
        // console.log('PhiloAgents Game scene initialized:', {
        //     multiplayerMode: this.isMultiplayerMode,
        //     userName: this.userName,
        //     userId: this.userId,
        //     isAuthenticated: this.isAuthenticated
        // });
    }

    create() {
        // Create the game world
        this.createWorld();
        this.createPlayer();
        this.createPhilosophers();
        // this.createUI();
        this.setupControls();
        this.setupConversationSystem();
        this.setupMultiplayer();
    }


    private createWorld() {
        try {
            // Create tilemap and world
            const map = this.make.tilemap({ key: 'map' });
            
            if (!map) {
                console.error('Failed to load tilemap');
                this.createFallbackWorld();
                return;
            }
            
            // console.log('Tilemap loaded successfully. Dimensions:', map.widthInPixels, 'x', map.heightInPixels);
            // console.log('Available layers:', map.layers.map(layer => layer.name));
            
            // Add tilesets - matching the original implementation
            const tuxmonTileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'tuxmon-tiles');
            const greeceTileset = map.addTilesetImage('ancient_greece_tileset', 'greece-tiles');
            const plantTileset = map.addTilesetImage('plant', 'plant-tiles');
            
            const tilesets = [tuxmonTileset, greeceTileset, plantTileset].filter((tileset): tileset is Phaser.Tilemaps.Tileset => tileset !== null);
            
            if (tilesets.length === 0) {
                console.error('Failed to load any tilesets');
                this.createFallbackWorld();
                return;
            }
            
            // console.log('Loaded tilesets:', tilesets.length);

            // Create layers in the proper order (matching original)
            const belowLayer = map.createLayer('Below Player', tilesets, 0, 0);
            const worldLayer = map.createLayer('World', tilesets, 0, 0);
            const aboveLayer = map.createLayer('Above Player', tilesets, 0, 0);
            
            // Configure layers
            if (worldLayer) {
                worldLayer.setCollisionByProperty({ collides: true });
                // console.log('World layer collision set');
            }
            
            if (aboveLayer) {
                aboveLayer.setDepth(10);
                // console.log('Above layer depth set to 10');
            }
            
            // console.log('Created layers:', {
            //     belowLayer: !!belowLayer,
            //     worldLayer: !!worldLayer,
            //     aboveLayer: !!aboveLayer
            // });
            
            // Set world bounds
            if (map.widthInPixels && map.heightInPixels) {
                this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
                this.physics.world.setBoundsCollision(true, true, true, true);
                // console.log('Set world bounds:', map.widthInPixels, 'x', map.heightInPixels);
            } else {
                // Fallback world size
                this.physics.world.setBounds(0, 0, 1600, 1200);
                this.physics.world.setBoundsCollision(true, true, true, true);
            }
            
            // Store the map and layers for later use
            this.worldMap = map;
            this.worldLayer = worldLayer;
            
        } catch (error) {
            console.error('Error creating world:', error);
            this.createFallbackWorld();
        }
    }

    private createFallbackWorld() {
        // console.log('Creating fallback world');
        
        // Create a simple colored background
        const bg = this.add.rectangle(800, 600, 1600, 1200, 0x4a90e2);
        bg.setOrigin(0.5);
        
        // Add some visual elements to make it clear this is the game world
        // this.add.text(800, 100, 'PhiloAgents World', {
        //     fontSize: '48px',
        //     color: '#ffffff',
        //     fontFamily: 'Arial, sans-serif'
        // }).setOrigin(0.5);
        
        // this.add.text(800, 150, 'Walk around and talk to philosophers!', {
        //     fontSize: '24px',
        //     color: '#ffffff',
        //     fontFamily: 'Arial, sans-serif'
        // }).setOrigin(0.5);
        
        // Set world bounds for fallback
        this.physics.world.setBounds(0, 0, 1600, 1200);
    }

    private createPlayer() {
        // Create player sprite at spawn point
        const spawnX = 800; // Center of world
        const spawnY = 600;
        
        // console.log('Attempting to create player at:', spawnX, spawnY);
        
        // Try to create Sophia player first
        if (this.textures.exists('sophia')) {
            this.createSophiaPlayer(spawnX, spawnY);
        } else {
            console.warn('Sophia texture not found, using fallback player');
            this.createFallbackPlayer(spawnX, spawnY);
        }
    }

    private createFallbackPlayer(x: number, y: number) {
        // console.log('Creating fallback player at:', x, y);
        
        // Create a magenta rectangle using Graphics
        const graphics = this.add.graphics();
        graphics.fillStyle(0xff00ff, 1);
        graphics.fillRect(-25, -25, 50, 50);
        graphics.lineStyle(4, 0x00ff00, 1);
        graphics.strokeRect(-25, -25, 50, 50);
        
        // Generate texture from graphics
        graphics.generateTexture('fallback-player', 50, 50);
        graphics.destroy(); // Clean up the temporary graphics
        
        // Create physics sprite using the generated texture
        this.player = this.physics.add.sprite(x, y, 'fallback-player');
        this.player.setDisplaySize(50, 50);
        this.player.setDepth(300);
        
        // console.log('Physics sprite player created at:', this.player.x, this.player.y, 'depth:', this.player.depth);
        
        // Now we can safely add physics properties
        if (this.player.body) {
            (this.player.body as Phaser.Physics.Arcade.Body).setSize(50, 50);
            (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
        }
        
        // Add player label (temporary for debugging)
        this.add.text(x, y - 40, 'FALLBACK PLAYER', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#ff0000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(301);
        
        // Setup camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(1);
        
        // Use map bounds if available
        if (this.worldMap) {
            this.cameras.main.setBounds(0, 0, this.worldMap.widthInPixels, this.worldMap.heightInPixels);
        } else {
            this.cameras.main.setBounds(0, 0, 1600, 1200);
        }
        
        // Add collision with world layer
        if (this.worldLayer) {
            this.physics.add.collider(this.player, this.worldLayer);
        }
        
        
        // console.log('Player creation complete. Player type:', typeof this.player, 'Position:', this.player.x, this.player.y);
    }

    private createSophiaPlayer(x: number, y: number) {
        // console.log('Creating Sophia player at:', x, y);
        
        try {
            // Check if Sophia texture and frames are available
            const texture = this.textures.get('sophia');
            if (!texture || texture.key === '__MISSING') {
                console.error('Sophia texture not available');
                this.createFallbackPlayer(x, y);
                return;
            }

            // Get available frames
            const frameNames = texture.getFrameNames();
            // console.log('Available Sophia frames:', frameNames);

            // Try to find an idle front frame
            let frameKey = 'sophia_idle_front.png';
            if (!frameNames.includes(frameKey)) {
                // Try alternative frame names
                frameKey = frameNames.find(frame => 
                    frame.includes('idle') && frame.includes('front')
                ) || frameNames.find(frame => 
                    frame.includes('front')
                ) || frameNames[0];
            }

            // console.log('Using frame:', frameKey);

            // Create Sophia sprite
            this.player = this.physics.add.sprite(x, y, 'sophia', frameKey);
            this.player.setDepth(100); // High depth to be visible
            this.player.setScale(1); // Normal scale

            // Setup physics
            if (this.player.body) {
                (this.player.body as Phaser.Physics.Arcade.Body).setSize(32, 48); // Adjust to sprite size
                (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
            }

            // Setup camera
            this.cameras.main.startFollow(this.player);
            this.cameras.main.setZoom(1);
            
            // Use map bounds if available
            if (this.worldMap) {
                this.cameras.main.setBounds(0, 0, this.worldMap.widthInPixels, this.worldMap.heightInPixels);
            } else {
                this.cameras.main.setBounds(0, 0, 1600, 1200);
            }
            
            // Add collision with world layer
            if (this.worldLayer) {
                this.physics.add.collider(this.player, this.worldLayer);
            }
            
            // Add collisions with philosophers (will be set up after philosophers are created)

            // Create player animations
            this.createPlayerAnimations();

            // console.log('Sophia player created successfully at:', this.player.x, this.player.y);

        } catch (error) {
            console.error('Error creating Sophia player:', error);
            this.createFallbackPlayer(x, y);
        }
    }

    private createPlayerAnimations() {
        if (!this.player) return;

        try {
            const texture = this.textures.get('sophia');
            if (!texture || texture.key === '__MISSING') return;

            const frameNames = texture.getFrameNames();

            // Create idle animation
            const idleFrames = frameNames.filter(frame => frame.includes('idle'));
            if (idleFrames.length > 0) {
                this.anims.create({
                    key: 'player_idle',
                    frames: idleFrames.map(frame => ({ key: 'sophia', frame })),
                    frameRate: 2,
                    repeat: -1
                });
            }

            // Create walk animations for each direction
            const directions = ['front', 'back', 'left', 'right'];
            directions.forEach(direction => {
                const walkFrames = frameNames.filter(frame => 
                    frame.includes('walk') && frame.includes(direction)
                );
                if (walkFrames.length > 0) {
                    this.anims.create({
                        key: `player_walk_${direction}`,
                        frames: walkFrames.map(frame => ({ key: 'sophia', frame })),
                        frameRate: 8,
                        repeat: -1
                    });
                }
            });

            // Start with idle animation
            if (this.anims.exists('player_idle')) {
                this.player.play('player_idle');
            }

        } catch (error) {
            console.error('Error creating player animations:', error);
        }
    }

    private createPhilosophers() {
        if (!this.worldMap) {
            console.error('Cannot create philosophers: worldMap not available');
            return;
        }

        // Biotype emoji indicators (matching original)
        const biotypeEmojis = {
            sanguine: "🜁",     // Air
            choleric: "🜂",     // Fire
            melancholic: "🜃",  // Water
            phlegmatic: "🜄"    // Earth
        };

        // Philosopher-to-biotype mappings (matches backend)
        const philosopherBiotypes = {
            "socrates": "sanguine",
            "aristotle": "choleric", 
            "plato": "melancholic",
            "descartes": "melancholic",
            "leibniz": "choleric",
            "ada_lovelace": "sanguine",
            "turing": "melancholic",
            "searle": "phlegmatic",
            "chomsky": "choleric",
            "dennett": "sanguine"
        } as const;

        const philosopherConfigs = [
            { id: "socrates", name: `${biotypeEmojis[philosopherBiotypes["socrates"]]} Socrates`, spawnName: "Socrates", defaultDirection: "right", roamRadius: 800 },
            { id: "aristotle", name: `${biotypeEmojis[philosopherBiotypes["aristotle"]]} Aristotle`, spawnName: "Aristotle", defaultDirection: "right", roamRadius: 700 },
            { id: "plato", name: `${biotypeEmojis[philosopherBiotypes["plato"]]} Plato`, spawnName: "Plato", defaultDirection: "front", roamRadius: 750 },
            { id: "descartes", name: `${biotypeEmojis[philosopherBiotypes["descartes"]]} Descartes`, spawnName: "Descartes", defaultDirection: "front", roamRadius: 650 },
            { id: "leibniz", name: `${biotypeEmojis[philosopherBiotypes["leibniz"]]} Leibniz`, spawnName: "Leibniz", defaultDirection: "front", roamRadius: 720 },
            // Note: ada_lovelace is mapped to 'ada' atlas
            { id: "ada", name: `${biotypeEmojis[philosopherBiotypes["ada_lovelace"]]} Ada Lovelace`, spawnName: "Ada Lovelace", defaultDirection: "front", roamRadius: 680 },
            { id: "turing", name: `${biotypeEmojis[philosopherBiotypes["turing"]]} Turing`, spawnName: "Turing", defaultDirection: "front", roamRadius: 770 },
            { id: "searle", name: `${biotypeEmojis[philosopherBiotypes["searle"]]} Searle`, spawnName: "Searle", defaultDirection: "front", roamRadius: 730 },
            { id: "chomsky", name: `${biotypeEmojis[philosopherBiotypes["chomsky"]]} Chomsky`, spawnName: "Chomsky", defaultDirection: "front", roamRadius: 690 },
            { id: "dennett", name: `${biotypeEmojis[philosopherBiotypes["dennett"]]} Dennett`, spawnName: "Dennett", defaultDirection: "front", roamRadius: 710 },
            // { 
            //     id: "miguel", 
            //     name: "Miguel", 
            //     spawnName: "Miguel",
            //     defaultDirection: "front", 
            //     roamRadius: 300,
            //     defaultMessage: "Hey there! I'm Miguel, but you can call me Mr Agent. I'd love to chat, but I'm currently writing my Substack article for tomorrow. If you're curious about my work, take a look at The Neural Maze!" 
            // },
            // { 
            //     id: "paul", 
            //     name: "Paul", 
            //     spawnName: "Paul",
            //     defaultDirection: "front",
            //     roamRadius: 300,
            //     defaultMessage: "Hey, I'm busy teaching my cat AI with my latest course. I can't talk right now. Check out Decoding ML for more on my thoughts." 
            // }
        ];

        this.philosophers = [];
        
        philosopherConfigs.forEach(config => {
            try {
                // Find spawn point from tilemap objects
                const spawnPoint = this.worldMap!.findObject("Objects", (obj) => obj.name === (config.spawnName || config.name));
                
                if (!spawnPoint) {
                    console.warn(`Spawn point not found for ${config.name}, using fallback position`);
                    // Create fallback spawn point
                    const fallbackSpawn = { x: 400 + Math.random() * 800, y: 400 + Math.random() * 400 };
                    this.createPhilosopherFromConfig(config, fallbackSpawn);
                    return;
                }
                
                this.createPhilosopherFromConfig(config, spawnPoint as { x: number; y: number });
                
            } catch (error) {
                console.error(`Error creating philosopher ${config.name}:`, error);
            }
        });

        // Add collisions between philosophers
        for (let i = 0; i < this.philosophers.length; i++) {
            for (let j = i + 1; j < this.philosophers.length; j++) {
                this.physics.add.collider(
                    this.philosophers[i].sprite, 
                    this.philosophers[j].sprite
                );
            }
        }
        
        // Add player collisions with philosophers
        if (this.player) {
            this.philosophers.forEach(philosopher => {
                this.physics.add.collider(this.player!, philosopher.sprite);
            });
        }

        // console.log(`Created ${this.philosophers.length} philosophers`);
    }

    private createPhilosopherFromConfig(config: {
        id: string;
        name: string;
        spawnName?: string;
        defaultDirection?: string;
        roamRadius?: number;
        defaultMessage?: string;
    }, spawnPoint: { x: number; y: number }) {
        // Check if texture exists
        const texture = this.textures.get(config.id);
        if (!texture || texture.key === '__MISSING') {
            console.warn(`Texture for ${config.id} not available, skipping`);
            return;
        }

        const character = new Character(this, {
            id: config.id,
            name: config.name,
            spawnPoint: spawnPoint,
            atlas: config.id,
            defaultDirection: config.defaultDirection,
            worldLayer: this.worldLayer,
            defaultMessage: config.defaultMessage,
            roamRadius: config.roamRadius,
            moveSpeed: 40,
            pauseChance: 0.2,
            directionChangeChance: 0.3
        });
        
        this.philosophers.push(character);
        // console.log(`Created philosopher: ${config.name} at (${spawnPoint.x}, ${spawnPoint.y})`);
    }


    // private createUI() {
    //     // Create UI elements
    //     const uiText = this.add.text(16, 16, '', {
    //         fontSize: '16px',
    //         color: '#ffffff',
    //         backgroundColor: '#000000',
    //         padding: { x: 8, y: 4 }
    //     });
    //     uiText.setScrollFactor(0);
    //     uiText.setDepth(100);
    //     uiText.setName('uiText');

    //     this.updateUI();
    // }

    // private updateUI() {
    //     const uiText = this.children.getByName('uiText') as Phaser.GameObjects.Text;
    //     if (uiText) {
    //         let playerInfo = 'Not created';
    //         if (this.player) {
    //             playerInfo = [
    //                 `Pos: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
    //                 `Visible: ${this.player.visible}`,
    //                 `Depth: ${this.player.depth}`,
    //                 `Active: ${this.player.active}`
    //             ].join(' | ');
    //         }
            
    //         uiText.setText([
    //             `Player: ${this.userName}`,
    //             `Player Info: ${playerInfo}`,
    //             `Mode: ${this.isMultiplayerMode ? 'Multiplayer' : 'Single Player'}`,
    //             `Auth: ${this.isAuthenticated ? 'Yes' : 'Guest'}`,
    //             '',
    //             'Controls:',
    //             'Arrow Keys - Move',
    //             'SPACE - Interact with philosophers',
    //             'ESC - Pause Menu',
    //             '',
    //             'Walk around and meet the philosophers!'
    //         ]);
    //     }
    // }

    private setupControls() {
        // Create cursor keys
        this.cursors = this.input.keyboard?.createCursorKeys();
        
        // Add SPACE and ESC key
        this.input.keyboard?.on('keydown-SPACE', this.handleInteraction, this);
        this.input.keyboard?.on('keydown-ESC', this.handlePause, this);
    }

    private setupConversationSystem() {
        this.conversationSystem = new ConversationSystem(this);
        // console.log('Conversation system initialized');
    }

    private async setupMultiplayer() {
        if (this.isMultiplayerMode) {
            // console.log('Setting up multiplayer connection...');
            this.showMultiplayerStatus('Connecting to multiplayer server...');
            
            // Setup multiplayer callbacks
            multiplayerService.setCallbacks({
                onPlayerJoined: (playerId, playerData) => {
                    // console.log('Remote player joined:', playerId, playerData);
                    this.showMultiplayerStatus(`${playerData.name || 'Player'} joined the room`);
                },
                onPlayerLeft: (playerId, playerData) => {
                    // console.log('Remote player left:', playerId, playerData);
                    this.showMultiplayerStatus(`${playerData.name || 'Player'} left the room`);
                },
                onError: (error) => {
                    console.error('Multiplayer error:', error);
                    this.showMultiplayerStatus('Multiplayer connection failed', true);
                }
            });
            
            // Attempt to join room
            const success = await multiplayerService.joinRoom({
                playerName: this.userName,
                characterType: this.gameConfig.characterType || 'sophia',
                userId: this.userId
            });
            
            if (success) {
                this.showMultiplayerStatus('Connected to multiplayer!');
            } else {
                this.showMultiplayerStatus('Failed to connect to multiplayer', true);
            }
        }
    }

    private showMultiplayerStatus(message: string, isError: boolean = false) {
        const statusText = this.add.text(this.cameras.main.width / 2, 50, message, {
            fontSize: '16px',
            color: isError ? '#ff4444' : '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
        statusText.setScrollFactor(0);
        statusText.setDepth(150);

        // Auto-remove after 3 seconds
        this.time.delayedCall(3000, () => {
            statusText.destroy();
        });
    }

    private handleInteraction() {
        if (!this.player) return;

        // Find nearby philosophers
        const nearbyPhilosopher = this.findNearbyPhilosopher();
        if (nearbyPhilosopher) {
            // console.log(`Interacting with ${nearbyPhilosopher.name}`);
            this.startConversation(nearbyPhilosopher);
        }
    }

    private checkPhilosopherInteraction() {
        // Early return if player is not ready
        if (!this.player) {
            return;
        }
        
        let nearbyPhilosopher = null;

        for (const philosopher of this.philosophers) {
            if (philosopher.isPlayerNearby(this.player)) {
                nearbyPhilosopher = philosopher;
                break;
            }
        }
        
        if (nearbyPhilosopher) {
            if (this.input.keyboard && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('SPACE'))) {
                if (!this.conversationSystem || !this.conversationSystem.isConversationActive()) {
                    this.startConversation(nearbyPhilosopher);
                } else {
                    // Continue dialogue if already active
                    // Note: This would need to be implemented in ConversationSystem
                }
            }
            
            if (this.conversationSystem && this.conversationSystem.isConversationActive()) {
                nearbyPhilosopher.facePlayer(this.player);
            }
        } else if (this.conversationSystem && this.conversationSystem.isConversationActive()) {
            this.conversationSystem.closeConversation();
        }
    }

    private findNearbyPhilosopher(): Character | null {
        if (!this.player) return null;

        for (const philosopher of this.philosophers) {
            if (philosopher.isPlayerNearby(this.player, 60)) {
                return philosopher;
            }
        }

        return null;
    }

    private startConversation(philosopher: Character) {
        if (!this.conversationSystem) {
            console.error('Conversation system not initialized');
            return;
        }

        // Start conversation using the enhanced conversation system
        this.conversationSystem.startConversation({
            philosopher: {
                key: philosopher.id,
                name: philosopher.name
            },
            userId: this.userId,
            userName: this.userName,
            isAuthenticated: this.isAuthenticated
        });
    }

    private handlePause() {
        // Don't pause if conversation is active
        if (this.conversationSystem?.isConversationActive()) {
            return;
        }
        
        this.scene.pause();
        this.scene.launch('PauseMenu');
    }

    update() {
        // Send multiplayer movement updates
        if (this.isMultiplayerMode && multiplayerService.connected && this.player) {
            multiplayerService.sendPlayerMovement(
                this.player.x, 
                this.player.y, 
                'front', // Direction will be determined by movement
                this.cursors ? (this.cursors.left.isDown || this.cursors.right.isDown || 
                              this.cursors.up.isDown || this.cursors.down.isDown) : false
            );
        }
        if (!this.player || !this.cursors) return;

        // Player movement
        let moving = false;
        const speed = 160;

        if (this.player.body) {
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            let direction = '';
            
            if (this.cursors.left.isDown) {
                body.setVelocityX(-speed);
                direction = 'left';
                moving = true;
            } else if (this.cursors.right.isDown) {
                body.setVelocityX(speed);
                direction = 'right';
                moving = true;
            } else {
                body.setVelocityX(0);
            }

            if (this.cursors.up.isDown) {
                body.setVelocityY(-speed);
                if (!direction) direction = 'back';
                moving = true;
            } else if (this.cursors.down.isDown) {
                body.setVelocityY(speed);
                if (!direction) direction = 'front';
                moving = true;
            } else {
                body.setVelocityY(0);
            }

            // Handle animations
            try {
                if (moving && direction) {
                    const walkAnim = `player_walk_${direction}`;
                    if (this.anims.exists(walkAnim)) {
                        this.player.play(walkAnim, true);
                    }
                } else if (!moving) {
                    if (this.anims.exists('player_idle')) {
                        this.player.play('player_idle', true);
                    }
                }
            } catch {
                // Ignore animation errors
            }
        }

        // Check for philosopher interactions
        this.checkPhilosopherInteraction();
        
        // Update philosophers
        const isInDialogue = this.conversationSystem?.isConversationActive() || false;
        if (this.player) {
            this.philosophers.forEach(philosopher => {
                philosopher.update(this.player!, isInDialogue);
            });
        }

        // Update UI every frame to show current player position
        // this.updateUI();
    }
}