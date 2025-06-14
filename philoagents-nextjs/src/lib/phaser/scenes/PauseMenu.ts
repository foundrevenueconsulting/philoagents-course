import { Scene } from 'phaser';

export class PauseMenu extends Scene {
    private userName: string = '';
    private isAuthenticated: boolean = false;

    constructor() {
        super('PauseMenu');
    }

    create() {
        // Get user context
        this.userName = this.game.registry.get('userName') || 'Anonymous Player';
        this.isAuthenticated = this.game.registry.get('isAuthenticated') || false;

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 
            0.7
        );

        // Create pause menu container
        const menuContainer = this.add.container(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2
        );

        // Menu background
        const menuBg = this.add.rectangle(0, 0, 400, 500, 0x2c3e50);
        const menuBorder = this.add.rectangle(0, 0, 400, 500, 0xffffff, 0)
            .setStrokeStyle(3, 0xffffff);

        // Title
        const title = this.add.text(0, -200, 'Game Paused', {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // User info
        const userInfo = this.add.text(0, -150, `Player: ${this.userName}`, {
            fontSize: '18px',
            color: '#ecf0f1',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const authStatus = this.add.text(0, -125, 
            this.isAuthenticated ? 'Status: Authenticated' : 'Status: Guest Mode', {
            fontSize: '14px',
            color: this.isAuthenticated ? '#2ecc71' : '#f39c12',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Menu buttons
        const buttonStyle = {
            fontSize: '20px',
            color: '#2c3e50',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ecf0f1',
            padding: { x: 20, y: 10 }
        };

        // Resume button
        const resumeButton = this.add.text(0, -50, 'Resume Game', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.buttonHover(resumeButton))
            .on('pointerout', () => this.buttonOut(resumeButton))
            .on('pointerdown', () => this.resumeGame());

        // Settings button (placeholder)
        const settingsButton = this.add.text(0, 10, 'Settings', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.buttonHover(settingsButton))
            .on('pointerout', () => this.buttonOut(settingsButton))
            .on('pointerdown', () => this.showSettings());

        // Dashboard button
        const dashboardButton = this.add.text(0, 70, 'Return to Dashboard', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.buttonHover(dashboardButton))
            .on('pointerout', () => this.buttonOut(dashboardButton))
            .on('pointerdown', () => this.returnToDashboard());

        // Main menu button
        const mainMenuButton = this.add.text(0, 130, 'Main Menu', buttonStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerover', () => this.buttonHover(mainMenuButton))
            .on('pointerout', () => this.buttonOut(mainMenuButton))
            .on('pointerdown', () => this.returnToMainMenu());

        // Instructions
        const instructions = this.add.text(0, 200, 'Press ESC to resume', {
            fontSize: '14px',
            color: '#95a5a6',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Add all elements to container
        menuContainer.add([
            menuBg, 
            menuBorder, 
            title, 
            userInfo, 
            authStatus,
            resumeButton, 
            settingsButton, 
            dashboardButton,
            mainMenuButton,
            instructions
        ]);

        // ESC key to resume
        this.input.keyboard?.on('keydown-ESC', () => {
            this.resumeGame();
        });

        // Click overlay to resume
        overlay.setInteractive().on('pointerdown', () => {
            this.resumeGame();
        });
    }

    private buttonHover(button: Phaser.GameObjects.Text) {
        button.setStyle({ backgroundColor: '#3498db', color: '#ffffff' });
    }

    private buttonOut(button: Phaser.GameObjects.Text) {
        button.setStyle({ backgroundColor: '#ecf0f1', color: '#2c3e50' });
    }

    private resumeGame() {
        this.scene.resume('Game');
        this.scene.stop();
    }

    private showSettings() {
        // Create settings overlay
        const settingsContainer = this.add.container(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2
        );

        const settingsBg = this.add.rectangle(0, 0, 350, 300, 0x34495e);
        const settingsBorder = this.add.rectangle(0, 0, 350, 300, 0xffffff, 0)
            .setStrokeStyle(2, 0xffffff);

        const settingsTitle = this.add.text(0, -120, 'Settings', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        const settingsContent = this.add.text(0, -20, [
            'Settings panel coming soon!',
            '',
            'Future features:',
            '• Audio settings',
            '• Graphics options',
            '• Conversation preferences',
            '• Accessibility options'
        ], {
            fontSize: '14px',
            color: '#ecf0f1',
            fontFamily: 'Arial, sans-serif',
            align: 'center'
        }).setOrigin(0.5);

        const closeButton = this.add.text(0, 100, 'Close', {
            fontSize: '16px',
            color: '#2c3e50',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ecf0f1',
            padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setInteractive();

        closeButton.on('pointerdown', () => {
            settingsContainer.destroy();
        });

        settingsContainer.add([settingsBg, settingsBorder, settingsTitle, settingsContent, closeButton]);
    }

    private returnToDashboard() {
        // Navigate back to dashboard (handled by React Router)
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
        }
    }

    private returnToMainMenu() {
        this.scene.stop('Game');
        this.scene.stop();
        this.scene.start('MainMenu');
    }
}