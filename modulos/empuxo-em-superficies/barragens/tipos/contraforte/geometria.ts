export const construirGeometria = (damHeight: number, damBaseWidth: number, damCrestWidth: number, inclinationAngle: number) => {
  const angleRad = (inclinationAngle * Math.PI) / 180;
  const dxUpstream = inclinationAngle === 90 ? 0 : damHeight / Math.tan(angleRad);
  const totalWidth = dxUpstream + damCrestWidth;
  const actualBaseWidth = Math.max(damBaseWidth, totalWidth);

  const wallProfile = [
    { x: 0, y: 0 },
    { x: dxUpstream, y: damHeight },
    { x: dxUpstream + damCrestWidth, y: damHeight },
    { x: damCrestWidth, y: 0 }
  ];

  const buttressProfile = [
    { x: damCrestWidth, y: 0 },
    { x: dxUpstream + damCrestWidth, y: damHeight },
    { x: actualBaseWidth, y: 0 }
  ];

  return { wallProfile, buttressProfile, actualBaseWidth };
};
