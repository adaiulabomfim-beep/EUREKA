export enum ObjectShape {
  CUBE = 'CUBE',
  SPHERE = 'SPHERE',
  CYLINDER = 'CYLINDER',
}

export interface Material {
  name: string;
  density: number;
  color: string;
}

export interface Fluid {
  name: string;
  density: number;
  color: string;
}
