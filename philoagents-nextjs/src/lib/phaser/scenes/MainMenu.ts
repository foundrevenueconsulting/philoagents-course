import { Scene } from 'phaser';

interface ButtonElements {
    button: Phaser.GameObjects.Graphics;
    shadow: Phaser.GameObjects.Graphics;
    text: Phaser.GameObjects.Text;
}

interface InstructionElements {
    overlay: Phaser.GameObjects.Graphics;
    panel: Phaser.GameObjects.Graphics;
    title?: Phaser.GameObjects.Text;
    textElements?: Phaser.GameObjects.Text[];
    closeButton?: Phaser.GameObjects.Graphics;
    closeText?: Phaser.GameObjects.Text;
}

export class MainMenu extends Scene {
    private userName: string = '';
    private isAuthenticated: boolean = false;

    constructor() {
        super('MainMenu');
    }

    create() {
        // Get user context from game registry
        this.userName = this.game.registry.get('userName') || 'Anonymous Player';
        this.isAuthenticated = this.game.registry.get('isAuthenticated') || false;
        
        // Background
        this.add.image(0, 0, 'background').setOrigin(0, 0);
        this.add.image(510, 260, 'image').setScale(0.45);

        // Welcome message with user context
        this.add.text(this.cameras.main.width / 2, 100, `Welcome, ${this.userName}!`, {
            fontSize: '32px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // User status indicator
        const statusText = this.isAuthenticated ? 'Authenticated User' : 'Guest Mode';
        const statusColor = this.isAuthenticated ? '#2ecc71' : '#f39c12';
        this.add.text(this.cameras.main.width / 2, 140, statusText, {
            fontSize: '18px',
            color: statusColor,
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        const centerX = this.cameras.main.width / 2;
        const startY = 524;
        const buttonSpacing = 70;

        // Create menu buttons
        this.createButton(centerX, startY, 'Single Player', () => {
            this.scene.start('Game', { 
                multiplayerMode: false,
                userName: this.userName,
                isAuthenticated: this.isAuthenticated
            });
        });

        this.createButton(centerX, startY + buttonSpacing, 'Multiplayer', () => {
            this.startMultiplayerGame();
        });

        this.createButton(centerX, startY + buttonSpacing * 2, 'Instructions', () => {
            this.showInstructions();
        });

        // Add keyboard support
        this.input.keyboard?.on('keydown-ESC', () => {
            // Exit to dashboard (will be handled by React)
            window.history.back();
        });
    }

    private createButton(x: number, y: number, text: string, callback: () => void): ButtonElements {
        const buttonWidth = 350;
        const buttonHeight = 60;
        const cornerRadius = 20;
        const maxFontSize = 28;
        const padding = 10;

        const shadow = this.add.graphics();
        shadow.fillStyle(0x666666, 1);
        shadow.fillRoundedRect(x - buttonWidth / 2 + 4, y - buttonHeight / 2 + 4, buttonWidth, buttonHeight, cornerRadius);

        const button = this.add.graphics();
        button.fillStyle(0xffffff, 1);
        button.fillRoundedRect(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        button.setInteractive(
            new Phaser.Geom.Rectangle(x - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );

        let fontSize = maxFontSize;
        let buttonText: Phaser.GameObjects.Text;
        do {
            if (buttonText!) buttonText.destroy();
            
            buttonText = this.add.text(x, y, text, {
                fontSize: `${fontSize}px`,
                fontFamily: 'Arial',
                color: '#000000',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            fontSize -= 1;
        } while (buttonText.width > buttonWidth - padding && fontSize > 10);

        button.on('pointerover', () => {
            this.updateButtonStyle(button, shadow, x, y, buttonWidth, buttonHeight, cornerRadius, true);
            buttonText.y -= 2;
        });

        button.on('pointerout', () => {
            this.updateButtonStyle(button, shadow, x, y, buttonWidth, buttonHeight, cornerRadius, false);
            buttonText.y += 2;
        });

        button.on('pointerdown', callback);
        
        return { button, shadow, text: buttonText };
    }

    private updateButtonStyle(
        button: Phaser.GameObjects.Graphics, 
        shadow: Phaser.GameObjects.Graphics, 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        radius: number, 
        isHover: boolean
    ) {
        button.clear();
        shadow.clear();
        
        if (isHover) {
            button.fillStyle(0x87CEEB, 1);
            shadow.fillStyle(0x888888, 1);
            shadow.fillRoundedRect(x - width / 2 + 2, y - height / 2 + 2, width, height, radius);
        } else {
            button.fillStyle(0xffffff, 1);
            shadow.fillStyle(0x666666, 1);
            shadow.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 4, width, height, radius);
        }
        
        button.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
    }

    private showInstructions() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const elements = this.createInstructionPanel(centerX, centerY);
        
        const instructionContent = this.addInstructionContent(centerX, centerY);
        elements.title = instructionContent.title;
        elements.textElements = instructionContent.textElements;
        
        const closeElements = this.addCloseButton(centerX, centerY + 79, () => {
            this.destroyInstructionElements(elements);
        });
        elements.closeButton = closeElements.button;
        elements.closeText = closeElements.text;
        
        elements.overlay.on('pointerdown', () => {
            this.destroyInstructionElements(elements);
        });
    }
    
    private createInstructionPanel(centerX: number, centerY: number): InstructionElements {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        overlay.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.cameras.main.width, this.cameras.main.height),
            Phaser.Geom.Rectangle.Contains
        );
        
        const panel = this.add.graphics();
        panel.fillStyle(0xffffff, 1);
        panel.fillRoundedRect(centerX - 200, centerY - 150, 400, 300, 20);
        panel.lineStyle(4, 0x000000, 1);
        panel.strokeRoundedRect(centerX - 200, centerY - 150, 400, 300, 20);
        
        return { overlay, panel };
    }
    
    private addInstructionContent(centerX: number, centerY: number) {
        const title = this.add.text(centerX, centerY - 110, 'INSTRUCTIONS', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        const instructions = [
            'Arrow keys for moving',
            'SPACE for talking to philosophers',
            'ESC for closing the dialogue',
            'Your conversations are saved automatically'
        ];
        
        const textElements: Phaser.GameObjects.Text[] = [];
        let yPos = centerY - 59;
        instructions.forEach(instruction => {
            textElements.push(
                this.add.text(centerX, yPos, instruction, {
                    fontSize: '18px',
                    fontFamily: 'Arial',
                    color: '#000000'
                }).setOrigin(0.5)
            );
            yPos += 32;
        });
        
        return { title, textElements };
    }
    
    private addCloseButton(x: number, y: number, callback: () => void) {
        const adjustedY = y + 10;
        
        const buttonWidth = 120;
        const buttonHeight = 40;
        const cornerRadius = 10;
        
        const closeButton = this.add.graphics();
        closeButton.fillStyle(0x87CEEB, 1);
        closeButton.fillRoundedRect(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        closeButton.lineStyle(2, 0x000000, 1);
        closeButton.strokeRoundedRect(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        
        const closeText = this.add.text(x, adjustedY, 'Close', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        closeButton.setInteractive(
            new Phaser.Geom.Rectangle(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight),
            Phaser.Geom.Rectangle.Contains
        );
        
        closeButton.on('pointerover', () => {
            closeButton.clear();
            closeButton.fillStyle(0x5CACEE, 1);
            closeButton.fillRoundedRect(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
            closeButton.lineStyle(2, 0x000000, 1);
            closeButton.strokeRoundedRect(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.clear();
            closeButton.fillStyle(0x87CEEB, 1);
            closeButton.fillRoundedRect(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
            closeButton.lineStyle(2, 0x000000, 1);
            closeButton.strokeRoundedRect(x - buttonWidth / 2, adjustedY - buttonHeight / 2, buttonWidth, buttonHeight, cornerRadius);
        });
        
        closeButton.on('pointerdown', callback);
        
        return { button: closeButton, text: closeText };
    }
    
    private destroyInstructionElements(elements: InstructionElements) {
        elements.overlay.destroy();
        elements.panel.destroy();
        elements.title?.destroy();
        
        elements.textElements?.forEach(text => text.destroy());
        
        elements.closeButton?.destroy();
        elements.closeText?.destroy();
    }

    private startMultiplayerGame() {
        const userId = this.game.registry.get('userId');
        
        console.log('Starting multiplayer game with user context:', {
            userId,
            userName: this.userName,
            isAuthenticated: this.isAuthenticated
        });
        
        this.scene.start('Game', { 
            multiplayerMode: true,
            characterType: 'sophia', // Default character
            playerName: this.userName,
            userId: userId,
            isAuthenticated: this.isAuthenticated
        });
    }
}