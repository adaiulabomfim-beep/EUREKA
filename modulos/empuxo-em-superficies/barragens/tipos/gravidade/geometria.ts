export const construirGeometria = (damHeight: number, damBaseWidth: number, damCrestWidth: number, inclinationAngle: number) => {
  const angleRad = (inclinationAngle * Math.PI) / 180;
  const dxUpstream = inclinationAngle === 90 ? 0 : damHeight / Math.tan(angleRad);
  const totalWidth = dxUpstream + damCrestWidth;
  const actualBaseWidth = Math.max(damBaseWidth, totalWidth);

  const profile = [
    { x: 0, y: 0 },
    { x: dxUpstream, y: damHeight },
    { x: dxUpstream + damCrestWidth, y: damHeight },
    { x: actualBaseWidth, y: 0 }
  ];

  return { profile, actualBaseWidth };
};
