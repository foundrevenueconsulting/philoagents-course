import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Set the base path for assets
        this.load.setPath('assets');

        // Add loading progress bar
        this.createLoadingScreen();

        // General assets
        this.load.image('background', 'talking_philosophers.jpg');
        this.load.image('image', 'image.png');
        this.load.image('logo', 'logo.png');

        // Tilesets
        this.load.image("tuxmon-tiles", "tilesets/tuxmon-sample-32px-extruded.png");
        this.load.image("greece-tiles", "tilesets/ancient_greece_tileset.png");
        this.load.image("plant-tiles", "tilesets/plant.png");

        // Tilemap
        this.load.tilemapTiledJSON("map", "tilemaps/philoagents-town.json");

        // Character assets - all philosophers
        this.load.atlas("sophia", "characters/sophia/atlas.png", "characters/sophia/atlas.json");
        this.load.atlas("socrates", "characters/socrates/atlas.png", "characters/socrates/atlas.json"); 
        this.load.atlas("plato", "characters/plato/atlas.png", "characters/plato/atlas.json"); 
        this.load.atlas("aristotle", "characters/aristotle/atlas.png", "characters/aristotle/atlas.json"); 
        this.load.atlas("descartes", "characters/descartes/atlas.png", "characters/descartes/atlas.json"); 
        this.load.atlas("leibniz", "characters/leibniz/atlas.png", "characters/leibniz/atlas.json"); 
        this.load.atlas("ada_lovelace", "characters/ada/atlas.png", "characters/ada/atlas.json"); 
        this.load.atlas("turing", "characters/turing/atlas.png", "characters/turing/atlas.json"); 
        this.load.atlas("searle", "characters/searle/atlas.png", "characters/searle/atlas.json"); 
        this.load.atlas("chomsky", "characters/chomsky/atlas.png", "characters/chomsky/atlas.json"); 
        this.load.atlas("dennett", "characters/dennett/atlas.png", "characters/dennett/atlas.json"); 
        this.load.atlas("miguel", "characters/miguel/atlas.png", "characters/miguel/atlas.json"); 
        this.load.atlas("paul", "characters/paul/atlas.png", "characters/paul/atlas.json"); 

        // Update progress bar during loading
        this.load.on('progress', (value: number) => {
            this.updateLoadingProgress(value);
        });
    }

    create() {
        // Get user context from game registry
        const isAuthenticated = this.game.registry.get('isAuthenticated');
        const userName = this.game.registry.get('userName');
        
        console.log('PhiloAgents assets loaded successfully');
        console.log(`User: ${userName} (${isAuthenticated ? 'authenticated' : 'anonymous'})`);
        
        // Transition to main menu
        this.scene.start('MainMenu');
    }

    private createLoadingScreen() {
        const { width, height } = this.cameras.main;
        
        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
        
        // Title
        this.add.text(width / 2, height / 2 - 100, 'PhiloAgents', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);
        
        // Subtitle
        this.add.text(width / 2, height / 2 - 50, 'Loading philosophical conversations...', {
            fontSize: '18px',
            color: '#bdc3c7',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);
        
        // Progress bar background
        this.add.rectangle(width / 2, height / 2 + 50, 400, 20, 0x34495e).setOrigin(0.5);
        
        // Progress bar (will be updated)
        this.add.rectangle(width / 2 - 200, height / 2 + 50, 0, 16, 0x3498db)
            .setOrigin(0, 0.5)
            .setName('progressBar');
    }

    private updateLoadingProgress(value: number) {
        const progressBar = this.children.getByName('progressBar') as Phaser.GameObjects.Rectangle;
        if (progressBar) {
            progressBar.width = 400 * value;
        }
    }
}