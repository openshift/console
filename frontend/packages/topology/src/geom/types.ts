export interface Translatable {
  translate(dx: number, dy: number): Translatable;
  scale(s: number): Translatable;
}

export type Padding =
  | number
  | [number]
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];
