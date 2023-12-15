import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import * as Size from './../constants/size.constants';
import { Application, Texture } from 'pixi.js';
import { Reel } from '../interfaces/reel';
import { DrawService } from './draw.service';
import { TEXT_STYLE } from '../constants/text-style.constants';

gsap.registerPlugin(ScrollTrigger);

const BASE_TIME = 2500;
const EXTRA_FACTOR = 600;
const BLUR_MULTIPLIER = 8;

@Injectable({
  providedIn: 'root',
})
export class GameService {
  running$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  reels$: BehaviorSubject<Reel[]>;
  stopRequested: boolean = false;

  private scrollTriggers: any[] = [];
  slotTextures: Texture[];
  game: Application;

  constructor(private draw: DrawService) {
    this.reels$ = new BehaviorSubject<Reel[]>([]);
  }

  register(app: Application) {
    this.game = app;
  }

  createScrollTriggers() {
    if (this.reels$.value.length > 0) {
      this.reels$.value.forEach((r, i) => {
        const extra = Math.floor(Math.random() * 3);
        const target = r.position + 10 + i * 5 + extra;
        const time = BASE_TIME + i * EXTRA_FACTOR + extra * EXTRA_FACTOR;

        const onCompleteFunction =
          i === this.reels$.value.length - 1
            ? this.stopGame.bind(this)
            : undefined;

        const scrollTrigger = ScrollTrigger.create({
          trigger: 'canvas',
          start: 'top center',
          end: 'bottom center',
          markers: true,
          onEnter: () => {
            gsap.to(r, {
              duration: time / 1000,
              position: target,
              ease: this.backout(0.5),
              onComplete: onCompleteFunction,
            });
          },
        });

        this.scrollTriggers.push(scrollTrigger);
      });
    }
  }

  killScrollTriggers() {
    this.scrollTriggers.forEach((trigger) => {
      trigger.kill();
    });

    this.scrollTriggers = [];
  }

  startGame(speed: number, fps: number) {
    if (this.game) {
      this.running$.next(true);
      gsap.ticker.add(() => this.tick(speed, fps));

      this.createScrollTriggers();
    }
  }

  stopGame() {
    this.running$.next(false);
    this.killScrollTriggers();
  }

  tick = (wheelSpeed: number, fps: number) => {
    const delta = gsap.ticker.deltaRatio(fps * wheelSpeed);

    this.animationTicker(delta);
  };

  animationTicker(delta: number) {
    {
      for (let i = 0; i < this.reels$.value.length; i++) {
        const r = this.reels$.value[i];

        r.blur.blurY =
          (r.position - r.previousPosition) * BLUR_MULTIPLIER * delta;
        r.previousPosition = r.position;

        // Update symbol positions on reel.
        for (let j = 0; j < r.symbols.length; j++) {
          const s = r.symbols[j];
          const prevy = s.y;

          s.y =
            ((r.position + j) % r.symbols.length) * Size.SYMBOL_SIZE -
            Size.SYMBOL_SIZE;
          if (s.y < 0 && prevy > Size.SYMBOL_SIZE) {
            // Detect going over and swap a texture.
            // This should in proper product be determined from some logical reel.
            s.texture =
              this.slotTextures[
                Math.floor(Math.random() * this.slotTextures.length)
              ];
            s.scale.x = s.scale.y = Math.min(
              Size.SYMBOL_SIZE / s.texture.width,
              Size.SYMBOL_SIZE / s.texture.height
            );
            s.x = Math.round((Size.SYMBOL_SIZE - s.width) / 2);
          }
        }
      }
    }
  }

  lerp(a1: number, a2: number, t: number) {
    return a1 * (1 - t) + a2 * t;
  }

  backout(amount: number) {
    return (t: number) => --t * t * ((amount + 1) * t + amount) + 1;
  }

  texturesInit() {
    // Create different slot symbols.
    this.slotTextures = [
      Texture.from('https://pixijs.com/assets/eggHead.png'),
      Texture.from('https://pixijs.com/assets/flowerTop.png'),
      Texture.from('https://pixijs.com/assets/helmlok.png'),
      Texture.from('https://pixijs.com/assets/skully.png'),
    ];
  }

  setupUI() {
    this.stopGame();
    this.texturesInit();
    this.createReelsContainer();

    const top = this.draw.getTop();
    const bottom = this.draw.getBottom();

    // Add header text
    const headerText = this.draw.getHeaderText(TEXT_STYLE);
    top.addChild(headerText);

    // Add invisible playtext
    const playText = this.draw.getPlayText(TEXT_STYLE, false);
    bottom.addChild(playText);

    this.game.stage.addChild(top);
    this.game.stage.addChild(bottom);
  }

  createReelsContainer() {
    const reels: Reel[] = [];
    this.reels$.next(reels);

    const reelContainer = this.draw.drawReelsContainer(
      reels,
      this.slotTextures,
      Size.REELS_COUNT,
      Size.SYMBOLS_COUNT
    );

    this.game.stage.addChild(reelContainer);
  }
}
