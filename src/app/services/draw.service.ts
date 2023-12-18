import { Injectable } from '@angular/core';
import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  Resource,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import * as Size from './../constants/size.constants';
import { Reel } from '../interfaces/reel';

@Injectable({
  providedIn: 'root',
})
export class DrawService {
  game: Application;
  margin: number;
  top: Graphics;
  left: Graphics;
  right: Graphics;
  bottom: Graphics;

  constructor() {}

  initial(app: Application) {
    this.game = app;
    this.margin = (this.game.screen.height - Size.SYMBOL_SIZE * 3) / 2;

    this.top = this.createTop();
    this.left = this.createLeft();
    this.right = this.createRight();
    this.bottom = this.createBottom();
  }

  getMargin() {
    return this.margin || 0;
  }

  getTop(): Graphics {
    return this.top;
  }

  getLeft(): Graphics {
    return this.left;
  }

  getRight(): Graphics {
    return this.right;
  }

  getBottom(): Graphics {
    return this.bottom;
  }

  private createTop(): Graphics {
    const top = new Graphics();
    top.beginFill(0, 1);
    top.drawRect(0, 0, this.game.screen.width, this.margin);
    return top;
  }

  private createLeft(): Graphics {
    const left = new Graphics();
    left.beginFill(0, 1);
    left.drawRect(0, 0, Size.SYMBOL_SIZE, this.game.screen.height);
    return left;
  }

  private createRight(): Graphics {
    const right = new Graphics();
    right.beginFill(0, 1);
    right.drawRect(
      this.game.screen.width - Size.SYMBOL_SIZE,
      0,
      Size.SYMBOL_SIZE,
      this.game.screen.height
    );
    return right;
  }

  private createBottom(): Graphics {
    const bottom = new Graphics();
    bottom.beginFill(0, 1);
    bottom.drawRect(
      0,
      Size.SYMBOL_SIZE * 3 + this.margin,
      this.game.screen.width,
      this.margin
    );
    return bottom;
  }

  drawReelsContainer(
    reels: Reel[],
    slotTextures: Texture<Resource>[],
    reelsCount: number,
    symbolsCount: number
  ) {
    const reelContainer = new Container();
    for (let i = 0; i < reelsCount; i++) {
      const rc = new Container();

      const reel: Reel = {
        container: rc,
        symbols: [],
        position: 0,
        previousPosition: 0,
        blur: new BlurFilter(),
      };

      rc.x = i * Size.REEL_WIDTH;
      reelContainer.addChild(rc);

      reel.blur.blurX = 0;
      reel.blur.blurY = 0;
      rc.filters = [reel.blur];

      // Build the symbols
      for (let j = 0; j < symbolsCount; j++) {
        const symbol = new Sprite(
          slotTextures[Math.floor(Math.random() * slotTextures.length)]
        );
        // Scale the symbol to fit symbol area.

        symbol.y = j * Size.SYMBOL_SIZE;
        const scale = Math.min(
          Size.SYMBOL_SIZE / symbol.width,
          Size.SYMBOL_SIZE / symbol.height
        );
        symbol.scale.set(scale, scale);
        symbol.x = Math.round((Size.SYMBOL_SIZE - symbol.width) / 2);
        reel.symbols.push(symbol);
        rc.addChild(symbol);
      }
      reels.push(reel);
    }

    reelContainer.y = this.margin;
    reelContainer.x = Math.round(this.game.screen.width - Size.REEL_WIDTH * 6);

    return reelContainer;
  }

  getHeaderText(style: TextStyle) {
    const headerText = new Text('PIXI MONSTER SLOTS!', style);
    headerText.x = Math.round((this.top.width - headerText.width) / 2);
    headerText.y = Math.round((this.margin - headerText.height) / 2);
    return headerText;
  }

  getPlayText(style: TextStyle, visibility: boolean = true) {
    const playText = new Text('Spin the wheels!', style);
    playText.x = Math.round((this.bottom.width - playText.width) / 2);
    playText.y =
      this.game.screen.height -
      this.margin +
      Math.round((this.margin - playText.height) / 2);
    playText.visible = visibility;
    return playText;
  }
}
