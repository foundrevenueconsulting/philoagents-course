import { Scene } from 'phaser';
import Character from '../classes/Character';
import DialogueBox from '../classes/DialogueBox';
import DialogueManager from '../classes/DialogueManager';
import { multiplayerService } from '../services/MultiplayerService';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.controls = null;
        this.player = null;
        this.cursors = null;
        this.dialogueBox = null;
        this.spaceKey = null;
        this.activePhilosopher = null;
        this.dialogueManager = null;
        this.philosophers = [];
        this.labelsVisible = true;
        
        // Multiplayer properties
        this.isMultiplayerMode = false;
        this.gameConfig = {};
        this.localPlayer = null;
        this.remotePlayers = new Map();
        this.multiplayerConnected = false;
        this.connectionStatusText = null;
    }

    init(data) {
        // Initialize game configuration from scene data
        this.gameConfig = data || {};
        this.isMultiplayerMode = this.gameConfig.multiplayerMode || false;
        
        console.log('Game scene initialized with config:', this.gameConfig);
    }

    async create ()
    {
        const map = this.createTilemap();
        const tileset = this.addTileset(map);
        const layers = this.createLayers(map, tileset);
        let screenPadding = 20;
        let maxDialogueHeight = 200;

        this.createPhilosophers(map, layers);

        // Setup multiplayer if enabled
        if (this.isMultiplayerMode) {
            await this.setupMultiplayer();
        }

        this.setupPlayer(map, layers.worldLayer);
        const camera = this.setupCamera(map);

        this.setupControls(camera);

        this.setupDialogueSystem();

        this.dialogueBox = new DialogueBox(this);
        this.dialogueText = this.add
            .text(60, this.game.config.height - maxDialogueHeight - screenPadding + screenPadding, '', {
            font: "18px monospace",
            fill: "#ffffff",
            padding: { x: 20, y: 10 },
            wordWrap: { width: 680 },
            lineSpacing: 6,
            maxLines: 5
            })
            .setScrollFactor(0)
            .setDepth(30)
            .setVisible(false);

        this.spaceKey = this.input.keyboard.addKey('SPACE');
        
        // Initialize the dialogue manager
        this.dialogueManager = new DialogueManager(this);
        this.dialogueManager.initialize(this.dialogueBox);

        // Setup connection status display for multiplayer
        if (this.isMultiplayerMode) {
            this.setupConnectionStatusDisplay();
        }
    }

    createPhilosophers(map, layers) {
        // Biotype emoji indicators
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
        };

        const philosopherConfigs = [
            { id: "socrates", name: `${biotypeEmojis[philosopherBiotypes["socrates"]]} Socrates`, spawnName: "Socrates", defaultDirection: "right", roamRadius: 800 },
            { id: "aristotle", name: `${biotypeEmojis[philosopherBiotypes["aristotle"]]} Aristotle`, spawnName: "Aristotle", defaultDirection: "right", roamRadius: 700 },
            { id: "plato", name: `${biotypeEmojis[philosopherBiotypes["plato"]]} Plato`, spawnName: "Plato", defaultDirection: "front", roamRadius: 750 },
            { id: "descartes", name: `${biotypeEmojis[philosopherBiotypes["descartes"]]} Descartes`, spawnName: "Descartes", defaultDirection: "front", roamRadius: 650 },
            { id: "leibniz", name: `${biotypeEmojis[philosopherBiotypes["leibniz"]]} Leibniz`, spawnName: "Leibniz", defaultDirection: "front", roamRadius: 720 },
            { id: "ada_lovelace", name: `${biotypeEmojis[philosopherBiotypes["ada_lovelace"]]} Ada Lovelace`, spawnName: "Ada Lovelace", defaultDirection: "front", roamRadius: 680 },
            { id: "turing", name: `${biotypeEmojis[philosopherBiotypes["turing"]]} Turing`, spawnName: "Turing", defaultDirection: "front", roamRadius: 770 },
            { id: "searle", name: `${biotypeEmojis[philosopherBiotypes["searle"]]} Searle`, spawnName: "Searle", defaultDirection: "front", roamRadius: 730 },
            { id: "chomsky", name: `${biotypeEmojis[philosopherBiotypes["chomsky"]]} Chomsky`, spawnName: "Chomsky", defaultDirection: "front", roamRadius: 690 },
            { id: "dennett", name: `${biotypeEmojis[philosopherBiotypes["dennett"]]} Dennett`, spawnName: "Dennett", defaultDirection: "front", roamRadius: 710 },
            { 
                id: "miguel", 
                name: "Miguel", 
                defaultDirection: "front", 
                roamRadius: 300,
                defaultMessage: "Hey there! I'm Miguel, but you can call me Mr Agent. I'd love to chat, but I'm currently writing my Substack article for tomorrow. If you're curious about my work, take a look at The Neural Maze!" 
            },
            { 
                id: "paul", 
                name: "Paul", 
                defaultDirection: "front",
                roamRadius: 300,
                defaultMessage: "Hey, I'm busy teaching my cat AI with my latest course. I can't talk right now. Check out Decoding ML for more on my thoughts." 
            }
        ];

        this.philosophers = [];
        
        philosopherConfigs.forEach(config => {
            const spawnPoint = map.findObject("Objects", (obj) => obj.name === (config.spawnName || config.name));
            
            this[config.id] = new Character(this, {
                id: config.id,
                name: config.name,
                spawnPoint: spawnPoint,
                atlas: config.id,
                defaultDirection: config.defaultDirection,
                worldLayer: layers.worldLayer,
                defaultMessage: config.defaultMessage,
                roamRadius: config.roamRadius,
                moveSpeed: config.moveSpeed || 40,
                pauseChance: config.pauseChance || 0.2,
                directionChangeChance: config.directionChangeChance || 0.3,
                handleCollisions: true
            });
            
            this.philosophers.push(this[config.id]);
        });

        // Make all philosopher labels visible initially
        this.togglePhilosopherLabels(true);

        // Add collisions between philosophers
        for (let i = 0; i < this.philosophers.length; i++) {
            for (let j = i + 1; j < this.philosophers.length; j++) {
                this.physics.add.collider(
                    this.philosophers[i].sprite, 
                    this.philosophers[j].sprite
                );
            }
        }
    }

    checkPhilosopherInteraction() {
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
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                if (!this.dialogueBox || !this.dialogueBox.isVisible()) {
                    // Send multiplayer event when starting dialogue
                    if (this.isMultiplayerMode && this.multiplayerConnected) {
                        multiplayerService.sendPhilosopherInteraction(nearbyPhilosopher.id, 'start');
                    }
                    this.dialogueManager.startDialogue(nearbyPhilosopher);
                } else if (!this.dialogueManager.isTyping) {
                    this.dialogueManager.continueDialogue();
                }
            }
            
            if (this.dialogueBox && this.dialogueBox.isVisible()) {
                nearbyPhilosopher.facePlayer(this.player);
            }
        } else if (this.dialogueBox && this.dialogueBox.isVisible()) {
            // Send multiplayer event when ending dialogue
            if (this.isMultiplayerMode && this.multiplayerConnected && this.activePhilosopher) {
                multiplayerService.sendPhilosopherInteraction(this.activePhilosopher.id, 'end');
            }
            this.dialogueManager.closeDialogue();
        }
    }

    createTilemap() {
        return this.make.tilemap({ key: "map" });
    }

    addTileset(map) {
        const tuxmonTileset = map.addTilesetImage("tuxmon-sample-32px-extruded", "tuxmon-tiles");
        const greeceTileset = map.addTilesetImage("ancient_greece_tileset", "greece-tiles");
        const plantTileset = map.addTilesetImage("plant", "plant-tiles");

        return [tuxmonTileset, greeceTileset, plantTileset];
    }

    createLayers(map, tilesets) {
        const belowLayer = map.createLayer("Below Player", tilesets, 0, 0);
        const worldLayer = map.createLayer("World", tilesets, 0, 0);
        const aboveLayer = map.createLayer("Above Player", tilesets, 0, 0);
        worldLayer.setCollisionByProperty({ collides: true });
        aboveLayer.setDepth(10);
        return { belowLayer, worldLayer, aboveLayer };
    }

    setupPlayer(map, worldLayer) {
        const spawnPoint = map.findObject("Objects", (obj) => obj.name === "Spawn Point");
        
        // Determine character type and atlas
        const characterType = this.isMultiplayerMode ? this.gameConfig.characterType : 'sophia';
        const atlasKey = characterType === 'ada' ? 'ada' : characterType; // Handle ada_lovelace -> ada mapping
        
        console.log('🎮 Setting up player:', { characterType, atlasKey, isMultiplayer: this.isMultiplayerMode });
        
        // Check if atlas exists
        if (!this.textures.exists(atlasKey)) {
            console.error(`❌ Atlas '${atlasKey}' not found! Available textures:`, this.textures.list);
            // Fallback to a known working atlas
            const fallbackAtlas = 'sophia';
            console.log(`🔄 Falling back to atlas: ${fallbackAtlas}`);
            this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, fallbackAtlas, 'sophia-front')
                .setSize(30, 40)
                .setOffset(0, 6);
        } else {
            this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, atlasKey, `${characterType}-front`)
                .setSize(30, 40)
                .setOffset(0, 6);
        }
        
        console.log('✅ Player created:', !!this.player, 'Body exists:', !!this.player?.body);

        // Store reference for multiplayer
        if (this.isMultiplayerMode) {
            this.localPlayer = this.player;
            this.localPlayer.characterType = characterType;
            this.localPlayer.playerId = multiplayerService.getLocalPlayerId();
            
            // Add player name label for multiplayer
            this.addPlayerNameLabel(this.localPlayer, this.gameConfig.playerName || 'You');
        }

        this.physics.add.collider(this.player, worldLayer);
        
        this.philosophers.forEach(philosopher => {
            this.physics.add.collider(this.player, philosopher.sprite);
        });

        this.createPlayerAnimations(characterType);

        // Set world bounds for physics
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, true, true);
    }

    createPlayerAnimations(characterType = 'sophia') {
        const anims = this.anims;
        const atlasKey = characterType === 'ada' ? 'ada' : characterType;
        
        const animConfig = [
            { key: `${characterType}-left-walk`, prefix: `${characterType}-left-walk-` },
            { key: `${characterType}-right-walk`, prefix: `${characterType}-right-walk-` },
            { key: `${characterType}-front-walk`, prefix: `${characterType}-front-walk-` },
            { key: `${characterType}-back-walk`, prefix: `${characterType}-back-walk-` }
        ];
        
        animConfig.forEach(config => {
            // Only create animation if it doesn't already exist
            if (!anims.exists(config.key)) {
                anims.create({
                    key: config.key,
                    frames: anims.generateFrameNames(atlasKey, { prefix: config.prefix, start: 0, end: 8, zeroPad: 4 }),
                    frameRate: 10,
                    repeat: -1,
                });
            }
        });
    }

    setupCamera(map) {
        const camera = this.cameras.main;
        camera.startFollow(this.player);
        camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        return camera;
    }

    setupControls(camera) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
            camera: camera,
            left: this.cursors.left,
            right: this.cursors.right,
            up: this.cursors.up,
            down: this.cursors.down,
            speed: 0.5,
        });
        
        this.labelsVisible = true;
        
        // Add ESC key for pause menu
        this.input.keyboard.on('keydown-ESC', () => {
            if (!this.dialogueBox || !this.dialogueBox.isVisible()) {
                this.scene.pause();
                this.scene.launch('PauseMenu');
            }
        });
    }

    setupDialogueSystem() {
        const screenPadding = 20;
        const maxDialogueHeight = 200;
        
        this.dialogueBox = new DialogueBox(this);
        this.dialogueText = this.add
            .text(60, this.game.config.height - maxDialogueHeight - screenPadding + screenPadding, '', {
                font: "18px monospace",
                fill: "#ffffff",
                padding: { x: 20, y: 10 },
                wordWrap: { width: 680 },
                lineSpacing: 6,
                maxLines: 5
            })
            .setScrollFactor(0)
            .setDepth(30)
            .setVisible(false);

        this.spaceKey = this.input.keyboard.addKey('SPACE');
        
        this.dialogueManager = new DialogueManager(this);
        this.dialogueManager.initialize(this.dialogueBox);
    }

    update(time, delta) {
        const isInDialogue = this.dialogueBox && this.dialogueBox.isVisible();
        
        if (!isInDialogue) {
            const wasMoving = this.updatePlayerMovement();
            
            // Send multiplayer updates if player moved
            if (wasMoving && this.isMultiplayerMode) {
                this.sendPlayerUpdate();
            }
        }
        
        this.checkPhilosopherInteraction();
        
        if (this.player) {
            this.philosophers.forEach(philosopher => {
                philosopher.update(this.player, isInDialogue);
            });
        }
        
        if (this.controls) {
            this.controls.update(delta);
        }

        // Update player name labels
        if (this.isMultiplayerMode) {
            this.updatePlayerNameLabels();
        }
    }

    updatePlayerMovement() {
        // Early return if player or player body is not ready
        if (!this.player || !this.player.body) {
            return false;
        }
        
        const speed = 175;
        const prevVelocity = this.player.body.velocity.clone();
        this.player.body.setVelocity(0);

        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(speed);
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-speed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(speed);
        }

        this.player.body.velocity.normalize().scale(speed);

        const currentVelocity = this.player.body.velocity.clone();
        const isMoving = Math.abs(currentVelocity.x) > 0 || Math.abs(currentVelocity.y) > 0;
        
        // Get character type for animations
        const characterType = this.isMultiplayerMode ? this.gameConfig.characterType : 'sophia';
        const atlasKey = characterType === 'ada' ? 'ada' : characterType;
        
        if (this.cursors.left.isDown && isMoving) {
            this.player.anims.play(`${characterType}-left-walk`, true);
        } else if (this.cursors.right.isDown && isMoving) {
            this.player.anims.play(`${characterType}-right-walk`, true);
        } else if (this.cursors.up.isDown && isMoving) {
            this.player.anims.play(`${characterType}-back-walk`, true);
        } else if (this.cursors.down.isDown && isMoving) {
            this.player.anims.play(`${characterType}-front-walk`, true);
        } else {
            this.player.anims.stop();
            if (prevVelocity.x < 0) this.player.setTexture(atlasKey, `${characterType}-left`);
            else if (prevVelocity.x > 0) this.player.setTexture(atlasKey, `${characterType}-right`);
            else if (prevVelocity.y < 0) this.player.setTexture(atlasKey, `${characterType}-back`);
            else if (prevVelocity.y > 0) this.player.setTexture(atlasKey, `${characterType}-front`);
            else {
                // If prevVelocity is zero, maintain current direction
                // Get current texture frame name
                const currentFrame = this.player.frame.name;
                
                // Extract direction from current animation or texture
                let direction = "front"; // Default
                
                // Check if the current frame name contains direction indicators
                if (currentFrame.includes("left")) direction = "left";
                else if (currentFrame.includes("right")) direction = "right";
                else if (currentFrame.includes("back")) direction = "back";
                else if (currentFrame.includes("front")) direction = "front";
                
                // Set the static texture for that direction
                this.player.setTexture(atlasKey, `${characterType}-${direction}`);
            }
        }
        
        return isMoving;
    }

    togglePhilosopherLabels(visible) {
        this.philosophers.forEach(philosopher => {
            if (philosopher.nameLabel) {
                philosopher.nameLabel.setVisible(visible);
            }
        });
    }

    // Multiplayer methods
    async setupMultiplayer() {
        console.log('🎮 Game: Setting up multiplayer connection...');
        console.log(`   └─ Player: ${this.gameConfig.playerName}`);
        console.log(`   └─ Character: ${this.gameConfig.characterType}`);
        
        try {
            const connected = await multiplayerService.joinRoom(
                this.gameConfig.playerName,
                this.gameConfig.characterType
            );

            if (connected) {
                this.multiplayerConnected = true;
                console.log('🎉 Game: Successfully connected to multiplayer room');
                this.setupMultiplayerEvents();
            } else {
                console.warn('⚠️ Game: Failed to connect to multiplayer, falling back to single player');
                this.fallbackToSinglePlayer();
            }
        } catch (error) {
            console.error('💥 Game: Multiplayer setup failed:', error);
            console.error('   └─ Error message:', error.message);
            console.error('   └─ Stack:', error.stack);
            this.fallbackToSinglePlayer();
        }
    }

    setupMultiplayerEvents() {
        console.log('🎯 Game: Setting up multiplayer event callbacks...');
        
        // Handle new players joining
        multiplayerService.onPlayerJoined((playerId, playerData) => {
            console.log(`🎮 Game: Player joined callback - ${playerId}`);
            if (playerId !== multiplayerService.getLocalPlayerId()) {
                this.createRemotePlayer(playerId, playerData);
            }
        });

        // Handle players leaving
        multiplayerService.onPlayerLeft((playerId, playerData) => {
            console.log(`🎮 Game: Player left callback - ${playerId}`);
            this.removeRemotePlayer(playerId);
        });

        // Handle player movement updates
        multiplayerService.onPlayerMoved((playerId, playerData) => {
            console.log(`🎮 Game: Player moved callback - ${playerId}`);
            this.updateRemotePlayer(playerId, playerData);
        });

        // Handle game events
        multiplayerService.onGameEvent((event) => {
            console.log('🎮 Game: Game event callback:', event);
            this.handleMultiplayerGameEvent(event);
        });

        // Handle connection errors
        multiplayerService.onError((error) => {
            console.error('🎮 Game: Multiplayer error callback:', error);
            this.showConnectionError(error);
        });

        // Handle room state changes
        multiplayerService.onStateChange((state) => {
            console.log('Room state updated:', state);
        });
    }

    createRemotePlayer(playerId, playerData) {
        console.log(`Creating remote player: ${playerId}`, playerData);
        
        // Create remote player sprite
        const characterType = playerData.characterType || 'sophia';
        const atlasKey = characterType === 'ada' ? 'ada' : characterType;
        
        const remotePlayer = this.physics.add.sprite(
            playerData.x || 400, 
            playerData.y || 300, 
            atlasKey, 
            `${characterType}-front`
        )
        .setSize(30, 40)
        .setOffset(0, 6)
        .setTint(0xcccccc); // Slightly transparent for remote players

        remotePlayer.characterType = characterType;
        remotePlayer.playerId = playerId;
        
        // Create animations for this character type
        this.createPlayerAnimations(characterType);
        
        // Add player name label
        this.addPlayerNameLabel(remotePlayer, playerData.playerName || playerId);
        
        // Add collisions
        this.physics.add.collider(remotePlayer, this.player);
        this.philosophers.forEach(philosopher => {
            this.physics.add.collider(remotePlayer, philosopher.sprite);
        });

        this.remotePlayers.set(playerId, remotePlayer);
    }

    removeRemotePlayer(playerId) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            if (remotePlayer.nameLabel) {
                remotePlayer.nameLabel.destroy();
            }
            remotePlayer.destroy();
            this.remotePlayers.delete(playerId);
        }
    }

    updateRemotePlayer(playerId, playerData) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            // Smoothly interpolate position
            this.tweens.add({
                targets: remotePlayer,
                x: playerData.x,
                y: playerData.y,
                duration: 100,
                ease: 'Linear'
            });

            // Update animation if provided
            if (playerData.animation) {
                remotePlayer.anims.play(playerData.animation, true);
            } else {
                remotePlayer.anims.stop();
                if (playerData.direction) {
                    remotePlayer.setTexture(remotePlayer.texture.key, `${remotePlayer.characterType}-${playerData.direction}`);
                }
            }
        }
    }

    addPlayerNameLabel(player, name) {
        if (player.nameLabel) {
            player.nameLabel.destroy();
        }
        
        player.nameLabel = this.add.text(player.x, player.y - 50, name, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(25);
    }

    setupConnectionStatusDisplay() {
        this.connectionStatusText = this.add.text(10, 10, 'Connecting...', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setScrollFactor(0).setDepth(50);

        // Update status based on connection
        if (this.multiplayerConnected) {
            this.connectionStatusText.setText(`Connected (${multiplayerService.getPlayerCount()} players)`);
            this.connectionStatusText.setColor('#00ff00');
        }
    }

    handleMultiplayerGameEvent(event) {
        console.log('Handling multiplayer game event:', event);
        
        switch (event.type) {
            case 'philosopher_interaction':
                this.handlePhilosopherInteractionEvent(event);
                break;
            case 'chat_message':
                this.handleChatMessage(event);
                break;
            default:
                console.log('Unknown multiplayer event type:', event.type);
        }
    }

    handlePhilosopherInteractionEvent(event) {
        const philosopher = this.philosophers.find(p => p.id === event.philosopherId);
        if (philosopher) {
            // Show visual indicator for ongoing interactions
            if (event.action === 'start') {
                this.showPhilosopherBusyIndicator(philosopher, event.playerName);
            } else if (event.action === 'end') {
                this.hidePhilosopherBusyIndicator(philosopher);
            }
        }
    }

    showPhilosopherBusyIndicator(philosopher, playerName) {
        if (philosopher.busyIndicator) {
            philosopher.busyIndicator.destroy();
        }
        
        philosopher.busyIndicator = this.add.text(
            philosopher.sprite.x,
            philosopher.sprite.y - 70,
            `💬 ${playerName}`,
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(26);
    }

    hidePhilosopherBusyIndicator(philosopher) {
        if (philosopher.busyIndicator) {
            philosopher.busyIndicator.destroy();
            philosopher.busyIndicator = null;
        }
    }

    handleChatMessage(event) {
        // Simple chat message display (could be enhanced with a proper chat UI)
        console.log(`${event.playerName}: ${event.message}`);
    }

    showConnectionError(error) {
        if (this.connectionStatusText) {
            this.connectionStatusText.setText('Connection Error');
            this.connectionStatusText.setColor('#ff0000');
        }
    }

    fallbackToSinglePlayer() {
        console.log('Falling back to single player mode');
        this.isMultiplayerMode = false;
        this.multiplayerConnected = false;
        
        if (this.connectionStatusText) {
            this.connectionStatusText.setText('Single Player Mode');
            this.connectionStatusText.setColor('#ffff00');
        }
    }

    sendPlayerUpdate() {
        if (this.isMultiplayerMode && this.multiplayerConnected && this.localPlayer) {
            // Additional null checks to prevent errors
            if (!this.localPlayer.anims || typeof this.localPlayer.x !== 'number' || typeof this.localPlayer.y !== 'number') {
                console.warn('⚠️ LocalPlayer not ready for updates:', {
                    hasAnims: !!this.localPlayer.anims,
                    hasX: typeof this.localPlayer.x,
                    hasY: typeof this.localPlayer.y,
                    hasFrame: !!this.localPlayer.frame
                });
                return;
            }
            
            const currentAnim = this.localPlayer.anims.currentAnim;
            const animationKey = currentAnim ? currentAnim.key : null;
            
            // Determine direction from current frame
            let direction = 'front';
            if (this.localPlayer.frame && this.localPlayer.frame.name) {
                const currentFrame = this.localPlayer.frame.name;
                if (currentFrame.includes('left')) direction = 'left';
                else if (currentFrame.includes('right')) direction = 'right';
                else if (currentFrame.includes('back')) direction = 'back';
                else if (currentFrame.includes('front')) direction = 'front';
            }

            multiplayerService.sendPlayerUpdate(
                this.localPlayer.x,
                this.localPlayer.y,
                animationKey,
                direction
            );
        }
    }

    updatePlayerNameLabels() {
        // Update local player label
        if (this.localPlayer && this.localPlayer.nameLabel) {
            this.localPlayer.nameLabel.setPosition(this.localPlayer.x, this.localPlayer.y - 50);
        }
        
        // Update remote player labels
        this.remotePlayers.forEach(remotePlayer => {
            if (remotePlayer.nameLabel) {
                remotePlayer.nameLabel.setPosition(remotePlayer.x, remotePlayer.y - 50);
            }
        });
    }

    shutdown() {
        // Clean up multiplayer connection when scene is destroyed
        if (this.isMultiplayerMode && this.multiplayerConnected) {
            multiplayerService.leaveRoom();
        }
    }

    destroy() {
        // Additional cleanup
        this.shutdown();
    }
}
