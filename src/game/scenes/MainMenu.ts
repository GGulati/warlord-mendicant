import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    title: GameObjects.Text;
    logo: GameObjects.Image;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        // Add the game logo
        this.logo = this.add.image(512, 300, 'logo')
            .setOrigin(0.5)
            .setScale(0.5) // Scale down if needed
            .setDepth(100);

        // Add a "Play" button - adjust position to account for logo
        const playButton = this.add.text(512, 620, 'Play Game', {
            fontFamily: 'Arial Black', fontSize: 32, color: '#ffffff',
            stroke: '#000000', strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(100)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.changeScene());

        // Add a simple hover effect
        playButton.on('pointerover', () => playButton.setStyle({ color: '#ff0' }));
        playButton.on('pointerout', () => playButton.setStyle({ color: '#ffffff' }));

        EventBus.emit('current-scene-ready', this);
    }
    
    changeScene ()
    {
        this.scene.start('Game');
    }
}
