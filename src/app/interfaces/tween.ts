export interface Tween {
  object: {
    [x: string]: any;
  };
  property: string | number;
  propertyBeginValue: any;
  target: any;
  easing: any;
  time: any;
  change: any;
  complete: any;
  start: number;
}
