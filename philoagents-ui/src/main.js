import * as Sentry from "@sentry/browser";
import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { PauseMenu } from './scenes/PauseMenu';

Sentry.init({
  dsn: "https://ce304bf5362327a9ce37de233076b3c5@o4508559102181376.ingest.us.sentry.io/4509459746652160",
  sendDefaultPii: true
});

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Preloader,
        MainMenu,
        Game,
        PauseMenu
    ],
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
        },
    },
};

export default new Phaser.Game(config);
