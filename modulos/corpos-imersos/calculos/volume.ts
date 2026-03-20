import { ObjectShape } from '../dominio/tipos';

export function calculateVolume(shape: ObjectShape, dim1_m: number, dim2_m: number): number {
  if (shape === ObjectShape.CUBE) {
    return Math.pow(dim1_m, 3);
  } else if (shape === ObjectShape.SPHERE) {
    return (4 / 3) * Math.PI * Math.pow(dim1_m, 3);
  } else if (shape === ObjectShape.CYLINDER) {
    return Math.PI * Math.pow(dim1_m, 2) * dim2_m;
  }
  return 0;
}

export function calculateBaseArea(shape: ObjectShape, dim1_m: number): number {
  if (shape === ObjectShape.CUBE) {
    return Math.pow(dim1_m, 2);
  } else if (shape === ObjectShape.SPHERE) {
    return Math.PI * Math.pow(dim1_m, 2);
  } else if (shape === ObjectShape.CYLINDER) {
    return Math.PI * Math.pow(dim1_m, 2);
  }
  return 0;
}

export function calculateHeight(shape: ObjectShape, dim1_m: number, dim2_m?: number): number {
  if (shape === ObjectShape.CUBE) {
    return dim1_m;
  } else if (shape === ObjectShape.SPHERE) {
    return dim1_m * 2;
  } else if (shape === ObjectShape.CYLINDER && dim2_m !== undefined) {
    return dim2_m;
  }
  return 0;
}

export function calculateCenterOfBuoyancy(shape: ObjectShape, dim1_m: number, h_sub_m: number, dim2_m?: number): number {
  if (h_sub_m <= 0) return 0;
  
  const H_m = calculateHeight(shape, dim1_m, dim2_m);
  const effective_h = Math.min(h_sub_m, H_m);

  if (shape === ObjectShape.CUBE || shape === ObjectShape.CYLINDER) {
    return effective_h / 2;
  } else if (shape === ObjectShape.SPHERE) {
    const R = dim1_m;
    if (effective_h >= 2 * R) return R;
    return (effective_h * (8 * R - 3 * effective_h)) / (4 * (3 * R - effective_h));
  }
  return 0;
}
export function calculateVolumeFromBottom(shape: ObjectShape, dim1_m: number, h_sub_m: number, dim2_m?: number): number {
  if (h_sub_m <= 0) return 0;
  
  const H_m = calculateHeight(shape, dim1_m, dim2_m);
  if (h_sub_m >= H_m) return calculateVolume(shape, dim1_m, dim2_m || 0);

  if (shape === ObjectShape.CUBE) {
    return calculateBaseArea(shape, dim1_m) * h_sub_m;
  } else if (shape === ObjectShape.SPHERE) {
    const R = dim1_m;
    return Math.PI * Math.pow(h_sub_m, 2) * (R - h_sub_m / 3);
  } else if (shape === ObjectShape.CYLINDER) {
    return calculateBaseArea(shape, dim1_m) * h_sub_m;
  }
  return 0;
}
