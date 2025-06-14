import { Scene } from 'phaser';

interface CharacterConfig {
    id: string;
    name: string;
    spawnPoint: { x: number; y: number };
    atlas: string;
    defaultDirection?: string;
    defaultMessage?: string;
    canRoam?: boolean;
    moveSpeed?: number;
    roamRadius?: number;
    pauseChance?: number;
    directionChangeChance?: number;
    worldLayer?: Phaser.Tilemaps.TilemapLayer | null;
}

export class Character {
    public scene: Scene;
    public id: string;
    public name: string;
    public sprite: Phaser.Physics.Arcade.Sprite;
    public nameLabel!: Phaser.GameObjects.Text;
    
    private spawnPoint: { x: number; y: number };
    private atlas: string;
    private defaultFrame: string;
    private defaultMessage?: string;
    private isRoaming: boolean;
    private moveSpeed: number;
    private movementTimer?: Phaser.Time.TimerEvent;
    private stuckCheckTimer?: Phaser.Time.TimerEvent;
    private currentDirection?: string | null;
    private roamRadius: number;
    private pauseChance: number;
    private directionChangeChance: number;

    constructor(scene: Scene, config: CharacterConfig) {
        this.scene = scene;
        this.id = config.id;
        this.name = config.name;
        this.spawnPoint = config.spawnPoint;
        this.atlas = config.atlas;
        this.defaultFrame = `${this.id}-${config.defaultDirection || 'front'}`;
        this.defaultMessage = config.defaultMessage;
        
        this.isRoaming = config.canRoam !== false;
        this.moveSpeed = config.moveSpeed || 20;
        this.roamRadius = config.roamRadius || 200;
        this.pauseChance = config.pauseChance || 0.2;
        this.directionChangeChance = config.directionChangeChance || 0.3;
        this.currentDirection = null;

        // Create sprite
        this.sprite = this.scene.physics.add
            .sprite(this.spawnPoint.x, this.spawnPoint.y, this.atlas, this.defaultFrame)
            .setSize(30, 40)
            .setOffset(0, 0) as Phaser.Physics.Arcade.Sprite;
        
        (this.sprite.body as Phaser.Physics.Arcade.Body).setImmovable(true);

        // Add collision with world layer
        if (config.worldLayer) {
            this.scene.physics.add.collider(this.sprite, config.worldLayer);
        }
        
        this.createAnimations();
        this.createNameLabel();
        
        if (this.isRoaming) {
            this.startRoaming();
        }
    }

    private createAnimations() {
        const anims = this.scene.anims;
        const directions = ['left', 'right', 'front', 'back'];
        
        directions.forEach(direction => {
            const animKey = `${this.id}-${direction}-walk`;
            
            if (!anims.exists(animKey)) {
                anims.create({
                    key: animKey,
                    frames: anims.generateFrameNames(this.atlas, {
                        prefix: `${this.id}-${direction}-walk-`,
                        end: 8,
                        zeroPad: 4,
                    }),
                    frameRate: 10,
                    repeat: -1,
                });
            }
        });
    }

    public facePlayer(player: Phaser.Physics.Arcade.Sprite) {
        const dx = player.x - this.sprite.x;
        const dy = player.y - this.sprite.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.sprite.setTexture(this.atlas, `${this.id}-${dx < 0 ? 'left' : 'right'}`);
        } else {
            this.sprite.setTexture(this.atlas, `${this.id}-${dy < 0 ? 'back' : 'front'}`);
        }
    }

    public distanceToPlayer(player: Phaser.Physics.Arcade.Sprite): number {
        return Phaser.Math.Distance.Between(
            player.x, player.y,
            this.sprite.x, this.sprite.y
        );
    }

    public isPlayerNearby(player: Phaser.Physics.Arcade.Sprite, distance = 55): boolean {
        return this.distanceToPlayer(player) < distance;
    }

    private startRoaming() {
        this.chooseNewDirection();
    }

    private chooseNewDirection() {
        if (this.movementTimer) {
            this.scene.time.removeEvent(this.movementTimer);
        }
        
        if (Math.random() < 0.4) {
            const directions = ['left', 'right', 'up', 'down'];
            this.currentDirection = directions[Math.floor(Math.random() * directions.length)];
            
            const animKey = `${this.id}-${this.getDirectionFromMovement()}-walk`;
            if (this.scene.anims.exists(animKey)) {
                this.sprite.anims.play(animKey);
            } else {
                this.sprite.setTexture(this.atlas, `${this.id}-${this.getDirectionFromMovement()}`);
            }
            
            const moveDuration = Phaser.Math.Between(500, 1000);
            this.movementTimer = this.scene.time.delayedCall(moveDuration, () => {
                (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0);
                this.chooseNewDirection();
            });
        } else {
            this.currentDirection = null;
            this.sprite.anims.stop();
            
            const direction = ['front', 'back', 'left', 'right'][Math.floor(Math.random() * 4)];
            this.sprite.setTexture(this.atlas, `${this.id}-${direction}`);
            
            const pauseDuration = Phaser.Math.Between(2000, 6000);
            this.movementTimer = this.scene.time.delayedCall(pauseDuration, () => {
                this.chooseNewDirection();
            });
        }
    }

    private getDirectionFromMovement(): string {
        switch(this.currentDirection) {
            case 'left': return 'left';
            case 'right': return 'right';
            case 'up': return 'back';
            case 'down': return 'front';
            default: return 'front';
        }
    }

    private moveInCurrentDirection() {
        if (!this.currentDirection) return;
        
        const previousPosition = { x: this.sprite.x, y: this.sprite.y };
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        body.setVelocity(0, 0);
        
        switch(this.currentDirection) {
            case 'left':
                body.setVelocityX(-this.moveSpeed);
                break;
            case 'right':
                body.setVelocityX(this.moveSpeed);
                break;
            case 'up':
                body.setVelocityY(-this.moveSpeed);
                break;
            case 'down':
                body.setVelocityY(this.moveSpeed);
                break;
        }
        
        if (!this.stuckCheckTimer) {
            this.stuckCheckTimer = this.scene.time.addEvent({
                delay: 500,
                callback: () => {
                    const distMoved = Phaser.Math.Distance.Between(
                        previousPosition.x, previousPosition.y,
                        this.sprite.x, this.sprite.y
                    );
                    if (distMoved < 5 && this.currentDirection) {
                        this.chooseNewDirection();
                    }
                },
                callbackScope: this,
                loop: false
            });
        }
        
        // Check if we're moving too far from spawn point
        const distanceFromSpawn = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.spawnPoint.x, this.spawnPoint.y
        );
        
        if (distanceFromSpawn > this.roamRadius) {
            body.setVelocity(0);
            
            const dx = this.spawnPoint.x - this.sprite.x;
            const dy = this.spawnPoint.y - this.sprite.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.currentDirection = dx > 0 ? 'right' : 'left';
            } else {
                this.currentDirection = dy > 0 ? 'down' : 'up';
            }
            
            const animKey = `${this.id}-${this.getDirectionFromMovement()}-walk`;
            if (this.scene.anims.exists(animKey)) {
                this.sprite.anims.play(animKey);
            } else {
                this.sprite.setTexture(this.atlas, `${this.id}-${this.getDirectionFromMovement()}`);
            }
            
            if (this.movementTimer) {
                this.scene.time.removeEvent(this.movementTimer);
            }
            
            this.movementTimer = this.scene.time.delayedCall(1500, () => {
                this.chooseNewDirection();
            });
        }
    }

    public update(player: Phaser.Physics.Arcade.Sprite, isInDialogue: boolean) {
        if (isInDialogue && this.isPlayerNearby(player)) {
            (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0);
            this.facePlayer(player);
            this.sprite.anims.stop();
            
            if (this.movementTimer) {
                this.scene.time.removeEvent(this.movementTimer);
                this.movementTimer = undefined;
            }
        } else if (this.isPlayerNearby(player)) {
            (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0);
            this.facePlayer(player);
            this.sprite.anims.stop();
            
            if (this.movementTimer) {
                this.scene.time.removeEvent(this.movementTimer);
                this.movementTimer = undefined;
            }
        } else if (this.isRoaming) {
            if (!this.movementTimer) {
                this.startRoaming();
            }
            
            this.moveInCurrentDirection();
        } else {
            (this.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0);
        }
        
        this.updateNameLabelPosition();
    }

    private createNameLabel() {
        this.nameLabel = this.scene.add.text(0, 0, this.name, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 },
        });
        this.nameLabel.setOrigin(0.5, 1);
        this.nameLabel.setDepth(20);
        this.updateNameLabelPosition();
    }

    private updateNameLabelPosition() {
        if (this.nameLabel && this.sprite) {
            this.nameLabel.setPosition(
                this.sprite.x,
                this.sprite.y - this.sprite.height/2 - 10
            );
        }
    }

    public get position() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    public destroy() {
        if (this.movementTimer) {
            this.scene.time.removeEvent(this.movementTimer);
        }
        if (this.stuckCheckTimer) {
            this.scene.time.removeEvent(this.stuckCheckTimer);
        }
        
        this.nameLabel.destroy();
        this.sprite.destroy();
    }
}