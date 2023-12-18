import { Container, DisplayObject } from 'pixi.js';

export interface Reel {
  container: Container<DisplayObject>;
  symbols: any[];
  position: number;
  previousPosition: number;
  blur: any;
}
