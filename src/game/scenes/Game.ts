import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameModel } from '../model/GameModel';
import { Unit } from '../model/units/UnitTypes';

export class Game extends Scene {
    // Phaser components
    private camera: Phaser.Cameras.Scene2D.Camera;
    private background: Phaser.GameObjects.Image;
    
    // Game model - our "M" in MVC
    private gameModel: GameModel;
    
    // Unit rendering
    private unitSprites: Map<number, Phaser.GameObjects.Sprite> = new Map();
    
    // UI elements
    private selectionBox: Phaser.GameObjects.Rectangle | null = null;
    private unitInfoText: Phaser.GameObjects.Text | null = null;
    private pauseButton: Phaser.GameObjects.Container | null = null;
    private isPaused: boolean = false;
    
    // Mouse tracking for selection
    private pointer: Phaser.Input.Pointer | null = null;
    private startPoint: { x: number, y: number } | null = null;

    constructor() {
        super('Game');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x333333);

        // Prevent context menu on right click
        if (this.input.mouse) {
            this.input.mouse.disableContextMenu();
        }
        
        // Set background for battlefield
        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.7);
        
        // Initialize the game model
        this.initGameModel();
        
        // Setup input handlers
        this.setupInput();
        
        // Create UI elements
        this.createUI();
        
        // Setup event handlers
        this.setupEventHandlers();

        // Let React know the scene is ready
        EventBus.emit('current-scene-ready', this);
    }
    
    /**
     * Initialize the game model
     */
    private initGameModel(): void {
        // Create new game model with world config
        this.gameModel = new GameModel({
            width: this.scale.width,
            height: this.scale.height,
            terrainType: 'plains'
        });
        
        // Initialize the game
        this.gameModel.initialize();
        
        // Initial rendering of all units
        this.renderAllUnits();
    }
    
    /**
     * Render all units from the model
     */
    private renderAllUnits(): void {
        // Clear existing sprites
        this.unitSprites.forEach(sprite => sprite.destroy());
        this.unitSprites.clear();
        
        // Get all units from the model
        const units = this.gameModel.getUnits();
        
        // Create sprites for each unit
        units.forEach(unit => this.createUnitSprite(unit));
    }
    
    /**
     * Create a sprite for a unit
     */
    private createUnitSprite(unit: Unit): void {
        const sprite = this.add.sprite(unit.position.x, unit.position.y, unit.type)
            .setInteractive()
            .setScale(0.1) // Scale down the sprites
            .setOrigin(0.5, 0.5);
            
        // Color based on faction
        if (unit.faction === 'enemy') {
            sprite.setTint(0xff0000); // Red tint for enemies
        }
        
        // Add selection indicator if unit is selected
        if (unit.selected) {
            sprite.setTint(0x00ff00); // Green tint for selection
        }
        
        // Add event listeners for this unit
        sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.gameModel.selectUnits([unit.id]);
                this.updateUnitSelectionVisuals();
                this.updateUnitInfoText();
            }
        });
        
        // Store the sprite in our map
        this.unitSprites.set(unit.id, sprite);
        
        // Add health bar
        this.createHealthBar(unit);
    }
    
    /**
     * Create a health bar for a unit
     */
    private createHealthBar(unit: Unit): void {
        const width = 40;
        const height = 5;
        const x = unit.position.x - width / 2;
        const y = unit.position.y - 25;
        
        // Background
        const background = this.add.rectangle(x, y, width, height, 0x000000)
            .setOrigin(0, 0)
            .setAlpha(0.7);
            
        // Health bar
        const healthPercent = unit.health / unit.maxHealth;
        const healthBar = this.add.rectangle(
            x, 
            y, 
            width * healthPercent, 
            height, 
            unit.faction === 'player' ? 0x00ff00 : 0xff0000
        ).setOrigin(0, 0);
        
        // Add them as children of the sprite for easier management
        const sprite = this.unitSprites.get(unit.id);
        if (sprite) {
            sprite.setData('healthBar', healthBar);
            sprite.setData('healthBarBg', background);
        }
    }
    
    /**
     * Update a unit's health bar
     */
    private updateHealthBar(unit: Unit): void {
        const sprite = this.unitSprites.get(unit.id);
        if (!sprite) return;
        
        const healthBar = sprite.getData('healthBar') as Phaser.GameObjects.Rectangle;
        if (healthBar) {
            const width = 40;
            const healthPercent = unit.health / unit.maxHealth;
            healthBar.width = width * healthPercent;
        }
    }
    
    /**
     * Setup input handlers
     */
    private setupInput(): void {
        // Get pointer for input
        this.pointer = this.input.activePointer;
        
        // Setup selection box functionality
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                this.startPoint = { x: pointer.x, y: pointer.y };
                
                // Create selection box if it doesn't exist
                if (!this.selectionBox) {
                    this.selectionBox = this.add.rectangle(0, 0, 1, 1, 0xffffff, 0.3)
                        .setOrigin(0, 0)
                        .setStrokeStyle(1, 0xffffff);
                }
                
                this.selectionBox.setPosition(this.startPoint.x, this.startPoint.y);
                this.selectionBox.width = 1;
                this.selectionBox.height = 1;
                this.selectionBox.setVisible(true);
            }
            
            // Move selected units when right-clicking
            if (pointer.rightButtonDown()) {
                this.moveSelectedUnitsTo(pointer.x, pointer.y);
            }
        });
        
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.startPoint && this.selectionBox && pointer.leftButtonDown()) {
                // Update selection box size
                const width = pointer.x - this.startPoint.x;
                const height = pointer.y - this.startPoint.y;
                
                if (width < 0) {
                    this.selectionBox.setPosition(pointer.x, this.selectionBox.y);
                    this.selectionBox.width = Math.abs(width);
                } else {
                    this.selectionBox.width = width;
                }
                
                if (height < 0) {
                    this.selectionBox.setPosition(this.selectionBox.x, pointer.y);
                    this.selectionBox.height = Math.abs(height);
                } else {
                    this.selectionBox.height = height;
                }
            }
        });
        
        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.startPoint && this.selectionBox) {
                // Check which units are inside the selection box
                if (this.selectionBox.width > 5 || this.selectionBox.height > 5) {
                    this.selectUnitsInBox(this.selectionBox);
                }
                
                // Hide selection box
                this.selectionBox.setVisible(false);
                this.startPoint = null;
            }
        });
    }
    
    /**
     * Setup event handlers for model events
     */
    private setupEventHandlers(): void {
        // Remove any existing event listeners to prevent duplicates
        EventBus.removeListener('unit-moved');
        EventBus.removeListener('unit-selected');
        EventBus.removeListener('units-deselected');
        EventBus.removeListener('unit-damaged');
        EventBus.removeListener('unit-removed');
        EventBus.removeListener('game-over');
        EventBus.removeListener('game-paused');
        EventBus.removeListener('game-resumed');
        
        // Handle unit movement
        EventBus.on('unit-moved', (data: { unit: Unit, oldPosition: any, newPosition: any }) => {
            // The unit reference in the event might be stale, so get a fresh one from the model
            const freshUnit = this.gameModel.getUnits().find(u => u.id === data.unit.id);
            if (freshUnit) {
                this.updateUnitPosition(freshUnit);
            }
        });
        
        // Handle unit selection
        EventBus.on('unit-selected', (unit: Unit) => {
            this.updateUnitSelectionVisuals();
            this.updateUnitInfoText();
        });
        
        // Handle unit deselection
        EventBus.on('units-deselected', () => {
            this.updateUnitSelectionVisuals();
            this.updateUnitInfoText();
        });
        
        // Handle unit damage
        EventBus.on('unit-damaged', (data: { unit: Unit, amount: number }) => {
            const freshUnit = this.gameModel.getUnits().find(u => u.id === data.unit.id);
            if (freshUnit) {
                this.updateHealthBar(freshUnit);
                this.showDamageText(freshUnit, data.amount);
            }
        });
        
        // Handle unit removal
        EventBus.on('unit-removed', (unit: Unit) => {
            const sprite = this.unitSprites.get(unit.id);
            if (sprite) {
                const healthBar = sprite.getData('healthBar');
                const healthBarBg = sprite.getData('healthBarBg');
                
                if (healthBar) healthBar.destroy();
                if (healthBarBg) healthBarBg.destroy();
                
                sprite.destroy();
                this.unitSprites.delete(unit.id);
            }
        });
        
        // Handle game over
        EventBus.on('game-over', (data: { winner: string }) => {
            this.showGameOverScreen(data.winner);
        });
        
        // Handle game pause/resume
        EventBus.on('game-paused', () => {
            this.isPaused = true;
        });
        
        EventBus.on('game-resumed', () => {
            this.isPaused = false;
        });
    }
    
    /**
     * Create UI elements
     */
    private createUI(): void {
        // Unit info text (shown when units are selected)
        this.unitInfoText = this.add.text(10, 10, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Pause/Resume button
        const buttonBg = this.add.rectangle(0, 0, 120, 40, 0x666666)
            .setStrokeStyle(2, 0xffffff);
            
        const buttonText = this.add.text(0, 0, 'Pause', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        this.pauseButton = this.add.container(this.scale.width - 80, this.scale.height - 30, [buttonBg, buttonText])
            .setSize(120, 40)
            .setInteractive()
            .on('pointerdown', () => {
                this.togglePause();
                buttonText.setText(this.isPaused ? 'Resume' : 'Pause');
            })
            .on('pointerover', () => {
                buttonBg.setFillStyle(0x888888);
            })
            .on('pointerout', () => {
                buttonBg.setFillStyle(0x666666);
            });
            
        // Main Menu button
        const menuBg = this.add.rectangle(0, 0, 120, 40, 0x666666)
            .setStrokeStyle(2, 0xffffff);
            
        const menuText = this.add.text(0, 0, 'Main Menu', {
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        const menuButton = this.add.container(this.scale.width - 80, this.scale.height - 80, [menuBg, menuText])
            .setSize(120, 40)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Show confirmation dialog
                this.showMenuConfirmation();
            })
            .on('pointerover', () => {
                menuBg.setFillStyle(0x888888);
            })
            .on('pointerout', () => {
                menuBg.setFillStyle(0x666666);
            });
    }
    
    /**
     * Show confirmation dialog before returning to main menu
     */
    private showMenuConfirmation(): void {
        // Pause the game while showing the dialog
        if (!this.isPaused) {
            this.togglePause();
        }
        
        // Create a semi-transparent overlay
        const overlay = this.add.rectangle(
            0, 0, 
            this.scale.width, this.scale.height, 
            0x000000, 0.5
        ).setOrigin(0).setDepth(1000);
        
        // Confirmation dialog background
        const dialogBg = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            400, 200,
            0x333333
        ).setStrokeStyle(2, 0xffffff).setDepth(1001);
        
        // Confirmation text
        const confirmText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2 - 40,
            'Return to Main Menu?',
            {
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(1001);
        
        const warningText = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            'Current game progress will be lost',
            {
                fontSize: '16px',
                color: '#ff9999',
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(1001);
        
        // Yes button
        const yesBg = this.add.rectangle(0, 0, 120, 40, 0x006600)
            .setStrokeStyle(2, 0xffffff);
            
        const yesText = this.add.text(0, 0, 'Yes', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        const yesButton = this.add.container(
            this.scale.width / 2 - 70,
            this.scale.height / 2 + 50,
            [yesBg, yesText]
        ).setSize(120, 40).setDepth(1001)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
              // Return to main menu
              this.scene.start('MainMenu');
          })
          .on('pointerover', () => {
              yesBg.setFillStyle(0x008800);
          })
          .on('pointerout', () => {
              yesBg.setFillStyle(0x006600);
          });
          
        // No button
        const noBg = this.add.rectangle(0, 0, 120, 40, 0x660000)
            .setStrokeStyle(2, 0xffffff);
            
        const noText = this.add.text(0, 0, 'No', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        
        const noButton = this.add.container(
            this.scale.width / 2 + 70,
            this.scale.height / 2 + 50,
            [noBg, noText]
        ).setSize(120, 40).setDepth(1001)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
              // Close dialog and resume game
              overlay.destroy();
              dialogBg.destroy();
              confirmText.destroy();
              warningText.destroy();
              yesButton.destroy();
              noButton.destroy();
              
              // Resume the game if it was paused by this dialog
              if (this.isPaused) {
                  this.togglePause();
              }
          })
          .on('pointerover', () => {
              noBg.setFillStyle(0x880000);
          })
          .on('pointerout', () => {
              noBg.setFillStyle(0x660000);
          });
    }
    
    /**
     * Toggle game pause state
     */
    private togglePause(): void {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.gameModel.pause();
        } else {
            this.gameModel.resume();
        }
    }
    
    /**
     * Update the position of a unit sprite
     */
    private updateUnitPosition(unit: Unit): void {
        const sprite = this.unitSprites.get(unit.id);
        if (sprite) {
            // The sprite should reflect the model position
            this.tweens.add({
                targets: sprite,
                x: unit.position.x,
                y: unit.position.y,
                duration: 1000 / unit.speed, // Faster units move quicker
                ease: 'Linear',
                onUpdate: () => {
                    // Update health bar position
                    const healthBar = sprite.getData('healthBar') as Phaser.GameObjects.Rectangle;
                    const healthBarBg = sprite.getData('healthBarBg') as Phaser.GameObjects.Rectangle;
                    
                    if (healthBar && healthBarBg) {
                        const width = 40;
                        const x = sprite.x - width / 2;
                        const y = sprite.y - 25;
                        
                        healthBarBg.setPosition(x, y);
                        healthBar.setPosition(x, y);
                    }
                }
            });
        }
    }
    
    /**
     * Update the visuals of unit selection
     */
    private updateUnitSelectionVisuals(): void {
        // Reset all unit tints
        this.unitSprites.forEach((sprite, unitId) => {
            const unit = this.gameModel.getUnits().find(u => u.id === unitId);
            if (unit) {
                if (unit.faction === 'enemy') {
                    sprite.setTint(0xff0000); // Red for enemies
                } else {
                    sprite.clearTint(); // Clear tint for player units
                }
            }
        });
        
        // Add selection tint to selected units
        const selectedUnits = this.gameModel.getSelectedUnits();
        selectedUnits.forEach(unit => {
            const sprite = this.unitSprites.get(unit.id);
            if (sprite) {
                sprite.setTint(0x00ff00); // Green for selection
            }
        });
    }
    
    /**
     * Update the unit info text
     */
    private updateUnitInfoText(): void {
        if (!this.unitInfoText) return;
        
        const selectedUnits = this.gameModel.getSelectedUnits();
        
        if (selectedUnits.length === 0) {
            this.unitInfoText.setText('');
            return;
        }
        
        if (selectedUnits.length === 1) {
            // Single unit info
            const unit = selectedUnits[0];
            this.unitInfoText.setText(
                `Unit: ${unit.type}\n` +
                `HP: ${unit.health}/${unit.maxHealth}\n` +
                `ATK: ${unit.attack}\n` +
                `DEF: ${unit.defense}\n` +
                `SPD: ${unit.speed}\n` +
                `RNG: ${unit.range}`
            );
        } else {
            // Multiple units selected
            this.unitInfoText.setText(`Selected units: ${selectedUnits.length}`);
        }
    }
    
    /**
     * Select units inside a selection box
     */
    private selectUnitsInBox(box: Phaser.GameObjects.Rectangle): void {
        const boxBounds = box.getBounds();
        const selectedUnitIds: number[] = [];
        
        // Get all units from our model
        const allUnits = this.gameModel.getUnits();
        
        // Filter to find player units inside the box
        allUnits.forEach(unit => {
            if (unit.faction !== 'player') return; // Only select player units
            
            const sprite = this.unitSprites.get(unit.id);
            if (sprite) {
                const spriteBounds = sprite.getBounds();
                if (Phaser.Geom.Rectangle.Overlaps(boxBounds, spriteBounds)) {
                    selectedUnitIds.push(unit.id);
                }
            }
        });
        
        // Select the units in our model
        if (selectedUnitIds.length > 0) {
            this.gameModel.selectUnits(selectedUnitIds);
        } else {
            this.gameModel.deselectAllUnits();
        }
    }
    
    /**
     * Move selected units to a position
     */
    private moveSelectedUnitsTo(x: number, y: number): void {
        const selectedUnits = this.gameModel.getSelectedUnits();
        
        if (selectedUnits.length === 0) return;
        
        // For simplicity, use a simple formation
        const spacing = 30; // Space between units
        const unitsPerRow = Math.ceil(Math.sqrt(selectedUnits.length));
        
        selectedUnits.forEach((unit, index) => {
            const row = Math.floor(index / unitsPerRow);
            const col = index % unitsPerRow;
            
            const offsetX = (col - Math.floor(unitsPerRow / 2)) * spacing;
            const offsetY = (row - Math.floor(selectedUnits.length / unitsPerRow / 2)) * spacing;
            
            const targetPos = {
                x: x + offsetX,
                y: y + offsetY
            };
            
            // Move the unit via the model - this will trigger the 'unit-moved' event
            // which will update the sprite position via updateUnitPosition
            this.gameModel.moveUnit(unit.id, targetPos);
        });
    }
    
    /**
     * Show damage text above a unit
     */
    private showDamageText(unit: Unit, amount: number): void {
        const sprite = this.unitSprites.get(unit.id);
        if (!sprite) return;
        
        // Create the damage text
        const damageText = this.add.text(sprite.x, sprite.y - 30, `-${amount}`, {
            fontSize: '16px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(200);
        
        // Animate the damage text
        this.tweens.add({
            targets: damageText,
            y: sprite.y - 60,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    
    /**
     * Show game over screen
     */
    private showGameOverScreen(winner: string): void {
        // Create a semi-transparent overlay
        const overlay = this.add.rectangle(
            0, 0, 
            this.scale.width, this.scale.height, 
            0x000000, 0.7
        ).setOrigin(0).setDepth(1000);
        
        // Game over text
        const gameOverText = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2 - 50,
            'GAME OVER', 
            {
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(1001);
        
        // Winner text
        const winnerText = this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2 + 20,
            `${winner.toUpperCase()} WINS!`, 
            {
                fontSize: '32px',
                color: winner === 'player' ? '#00ff00' : '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(1001);
        
        // Main Menu button background
        const menuBg = this.add.rectangle(
            0, 0, 
            200, 60, 
            0x666666
        ).setStrokeStyle(3, 0xffffff);
        
        // Main Menu button text
        const menuText = this.add.text(
            0, 0,
            'MAIN MENU', 
            {
                fontSize: '24px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // Create container with button components
        const menuButton = this.add.container(
            this.scale.width / 2, 
            this.scale.height / 2 + 100,
            [menuBg, menuText]
        ).setSize(200, 60).setDepth(1001);
        
        // Make the container interactive
        menuButton.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Clean up the overlay elements
                overlay.destroy();
                gameOverText.destroy();
                winnerText.destroy();
                menuButton.destroy();
                
                // Return to main menu
                this.scene.start('MainMenu');
            })
            .on('pointerover', () => {
                menuBg.setFillStyle(0x888888);
            })
            .on('pointerout', () => {
                menuBg.setFillStyle(0x666666);
            });
    }

    /**
     * Change to the game over scene
     */
    changeScene() {
        this.scene.start('GameOver');
    }
    
    /**
     * Update function called each frame
     */
    update(time: number, delta: number): void {
        // Update game model in real-time
        this.gameModel.update(time, delta);
    }
}
