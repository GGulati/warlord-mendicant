import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    title: GameObjects.Text;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.background = this.add.image(512, 384, 'background');

        this.title = this.add.text(512, 384, 'Warlord Mendicant', {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        // Add a "Play" button
        const playButton = this.add.text(512, 484, 'Play Game', {
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
