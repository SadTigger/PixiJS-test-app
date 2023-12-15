import { Component, ElementRef, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {
  Application,
  Assets,
  Text,
  Texture,
  HTMLText,
  Graphics,
} from 'pixi.js';
import { DrawService } from './services/draw.service';
import { TEXT_STYLE } from './constants/text-style.constants';
import { GameService } from './services/game.service';
import { FormsModule } from '@angular/forms';

const DEFAULT_SPEED = '1';
const DEFAULT_FPS = '60';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'pixijs-test-app';

  game: Application;
  selectedSpeed: string = DEFAULT_SPEED;
  selectedFPS: string = DEFAULT_FPS;
  margin: number;

  startButton: HTMLButtonElement;
  text: HTMLText;

  slotTextures: Texture[];

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private drawService: DrawService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.loadAssets();

    this.game = new Application({ background: '#1099bb', resizeTo: window });
    this.elementRef.nativeElement.appendChild(this.game.view);
    this.renderer.setStyle(this.game.view, 'position', 'absolute');
    this.gameService.register(this.game);
    this.drawService.initial(this.game);
  }

  loadAssets() {
    const assetUrls = [
      'https://pixijs.com/assets/eggHead.png',
      'https://pixijs.com/assets/flowerTop.png',
      'https://pixijs.com/assets/helmlok.png',
      'https://pixijs.com/assets/skully.png',
    ];

    Assets.load(assetUrls).then(() => this.onAssetsLoaded());
  }

  onAssetsLoaded() {
    const bottomMenu = this.drawService.getBottom();
    const playText = this.drawService.getPlayText(TEXT_STYLE, false);

    // Set the interactivity.
    this.gameService.setupUI();
    this.setInteractivity(bottomMenu, playText);
  }

  onStartGame() {
    const speed = parseFloat(this.selectedSpeed);
    const fps = parseFloat(this.selectedFPS);
    this.gameService.startGame(speed, fps);
  }

  setInteractivity(menu: Graphics, menuText: Text) {
    const margin = this.drawService.getMargin();
    this.startButton = this.renderer.createElement(
      'button'
    ) as HTMLButtonElement;
    this.renderer.appendChild(this.elementRef.nativeElement, this.startButton);
    this.renderer.appendChild(
      this.startButton,
      this.renderer.createText(menuText.text)
    );
    this.renderer.addClass(this.startButton, 'start-button');
    this.renderer.setStyle(
      this.startButton,
      'left',
      Math.round((menu.width - menuText.width) / 2) + 'px'
    );
    this.renderer.setStyle(
      this.startButton,
      'top',
      this.game.screen.height -
        margin +
        Math.round((margin - menuText.height) / 2) +
        'px'
    );
    this.renderer.listen(this.startButton, 'pointerdown', (event) => {
      this.onStartGame();
    });
  }

  ngOnDestroy() {
    if (this.startButton) {
      this.renderer.removeChild(
        this.elementRef.nativeElement,
        this.startButton
      );
    }
  }
}
