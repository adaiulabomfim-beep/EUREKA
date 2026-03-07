export const buildArchDam = (
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number
) => {
  // Simplified profile calculation for arch dam
  const profile = [
    { x: -damBaseWidth / 2, y: 0 },
    { x: damBaseWidth / 2, y: 0 },
    { x: damCrestWidth / 2, y: damHeight },
    { x: -damCrestWidth / 2, y: damHeight },
  ];
  
  return { profile };
};
