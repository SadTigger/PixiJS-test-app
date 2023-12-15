import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {
  Application,
  Assets,
  Container,
  Graphics,
  BlurFilter,
  Sprite,
  Text,
  Texture,
  TextStyle,
  DisplayObject,
  HTMLText,
} from 'pixi.js';
import { BehaviorSubject } from 'rxjs';

export interface Reel {
  container: Container<DisplayObject>;
  symbols: any[];
  position: number;
  previousPosition: number;
  blur: any;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'pixijs-test-app';

  game: Application;
  REEL_WIDTH = 160;
  SYMBOL_SIZE = 150;

  running$: BehaviorSubject<Boolean>;
  reels$: BehaviorSubject<Reel[]>;

  // Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
  tweening: any[] = [];

  constructor(private elementRef: ElementRef) {
    this.reels$ = new BehaviorSubject<any[]>([]);
    this.running$ = new BehaviorSubject<Boolean>(false);
  }

  ngOnInit(): void {}

  ngAfterViewInit() {
    Assets.load([
      'https://pixijs.com/assets/eggHead.png',
      'https://pixijs.com/assets/flowerTop.png',
      'https://pixijs.com/assets/helmlok.png',
      'https://pixijs.com/assets/skully.png',
    ]).then(this.onAssetsLoaded.bind(this));

    this.game = new Application({ background: '#1099bb', resizeTo: window });
    this.elementRef.nativeElement.appendChild(this.game.view);
  }

  onStartGame() {
    this.startPlay();
    this.animateUpdate();
  }

  onAssetsLoaded() {
    // Create different slot symbols.
    const slotTextures = [
      Texture.from('https://pixijs.com/assets/eggHead.png'),
      Texture.from('https://pixijs.com/assets/flowerTop.png'),
      Texture.from('https://pixijs.com/assets/helmlok.png'),
      Texture.from('https://pixijs.com/assets/skully.png'),
    ];

    // Build the reels
    const reels: Reel[] = [];
    this.reels$.next(reels);

    const reelContainer = new Container();

    for (let i = 0; i < 5; i++) {
      const rc = new Container();

      rc.x = i * this.REEL_WIDTH;

      reelContainer.addChild(rc);

      const reel: Reel = {
        container: rc,
        symbols: [],
        position: 0,
        previousPosition: 0,
        blur: new BlurFilter(),
      };

      reel.blur.blurX = 0;
      reel.blur.blurY = 0;
      rc.filters = [reel.blur];

      // Build the symbols
      for (let j = 0; j < 4; j++) {
        const symbol = new Sprite(
          slotTextures[Math.floor(Math.random() * slotTextures.length)]
        );
        // Scale the symbol to fit symbol area.

        symbol.y = j * this.SYMBOL_SIZE;
        symbol.scale.x = symbol.scale.y = Math.min(
          this.SYMBOL_SIZE / symbol.width,
          this.SYMBOL_SIZE / symbol.height
        );
        symbol.x = Math.round((this.SYMBOL_SIZE - symbol.width) / 2);
        reel.symbols.push(symbol);
        rc.addChild(symbol);
      }
      reels.push(reel);
      this.reels$.next([...reels]);
    }
    this.game.stage.addChild(reelContainer);

    // Build top & bottom covers and position reelContainer
    const margin = (this.game.screen.height - this.SYMBOL_SIZE * 3) / 2;

    reelContainer.y = margin;
    reelContainer.x = Math.round(this.game.screen.width - this.REEL_WIDTH * 5);
    const top = new Graphics();

    top.beginFill(0, 1);
    top.drawRect(0, 0, this.game.screen.width, margin);
    const bottom = new Graphics();

    bottom.beginFill(0, 1);
    bottom.drawRect(
      0,
      this.SYMBOL_SIZE * 3 + margin,
      this.game.screen.width,
      margin
    );

    // Add play text
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 36,
      fontStyle: 'italic',
      fontWeight: 'bold',
      fill: ['#ffffff', '#00ff99'], // gradient
      stroke: '#4a1850',
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
      wordWrap: true,
      wordWrapWidth: 440,
    });

    const playText = new Text('Spin the wheels!', style);

    playText.x = Math.round((bottom.width - playText.width) / 2);
    playText.y =
      this.game.screen.height -
      margin +
      Math.round((margin - playText.height) / 2);
    bottom.addChild(playText);

    // Add header text
    const headerText = new Text('PIXI MONSTER SLOTS!', style);

    headerText.x = Math.round((top.width - headerText.width) / 2);
    headerText.y = Math.round((margin - headerText.height) / 2);
    top.addChild(headerText);

    this.game.stage.addChild(top);
    this.game.stage.addChild(bottom);

    // Set the interactivity.
    bottom.eventMode = 'static';
    bottom.cursor = 'pointer';
    bottom.addListener('pointerdown', () => {
      this.startPlay();
      this.animateUpdate();
    });

    this.running$.next(false);

    // Listen for animate update.
    this.game.ticker.add((delta) => {
      // Update the slots.
      for (let i = 0; i < this.reels$.value.length; i++) {
        const r = this.reels$.value[i];
        // Update blur filter y amount based on speed.
        // This would be better if calculated with time in mind also. Now blur depends on frame rate.

        r.blur.blurY = (r.position - r.previousPosition) * 8;
        r.previousPosition = r.position;

        // Update symbol positions on reel.
        for (let j = 0; j < r.symbols.length; j++) {
          const s = r.symbols[j];
          const prevy = s.y;

          s.y =
            ((r.position + j) % r.symbols.length) * this.SYMBOL_SIZE -
            this.SYMBOL_SIZE;
          if (s.y < 0 && prevy > this.SYMBOL_SIZE) {
            // Detect going over and swap a texture.
            // This should in proper product be determined from some logical reel.
            s.texture =
              slotTextures[Math.floor(Math.random() * slotTextures.length)];
            s.scale.x = s.scale.y = Math.min(
              this.SYMBOL_SIZE / s.texture.width,
              this.SYMBOL_SIZE / s.texture.height
            );
            s.x = Math.round((this.SYMBOL_SIZE - s.width) / 2);
          }
        }
      }
    });
  }

  animateUpdate() {
    // Listen for animate update.
    this.game.ticker.add((delta) => {
      const now = Date.now();
      const remove = [];

      for (let i = 0; i < this.tweening.length; i++) {
        const t = this.tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);

        t.object[t.property] = this.lerp(
          t.propertyBeginValue,
          t.target,
          t.easing(phase)
        );
        if (t.change) t.change(t);
        if (phase === 1) {
          t.object[t.property] = t.target;
          if (t.complete) t.complete(t);
          remove.push(t);
        }
      }
      for (let i = 0; i < remove.length; i++) {
        this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
      }
    });
  }

  tweenTo(
    object: { [x: string]: any },
    property: string | number,
    target: any,
    time: any,
    easing: any,
    onchange: any,
    oncomplete: any
  ) {
    const tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      easing,
      time,
      change: onchange,
      complete: oncomplete,
      start: Date.now(),
    };

    this.tweening.push(tween);

    return tween;
  }

  // Function to start playing.
  startPlay() {
    if (this.running$.value) return;
    this.running$.next(true);

    for (let i = 0; i < this.reels$.value.length; i++) {
      const r = this.reels$.value[i];
      const extra = Math.floor(Math.random() * 3);
      const target = r.position + 10 + i * 5 + extra;
      const time = 2500 + i * 600 + extra * 600;

      this.tweenTo(
        r,
        'position',
        target,
        time,
        this.backout(0.5),
        null,
        i === this.reels$.value.length - 1 ? this.reelsComplete() : null
      );
    }
  }

  // Reels done handler.
  reelsComplete() {
    this.running$.next(false);
  }

  lerp(a1: number, a2: number, t: number) {
    return a1 * (1 - t) + a2 * t;
  }

  backout(amount: number) {
    return (t: number) => --t * t * ((amount + 1) * t + amount) + 1;
  }
}
