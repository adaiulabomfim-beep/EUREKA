export const construirGeometria = (damHeight: number, damBaseWidth: number, damCrestWidth: number, inclinationAngle: number) => {
  const exactTriAngle = damBaseWidth > 0 ? (Math.atan2(damHeight, damBaseWidth) * 180) / Math.PI : inclinationAngle;
  const isExactRightTriangle = damCrestWidth === 0 && damBaseWidth > 0 && Math.abs(inclinationAngle - exactTriAngle) < 0.05;
  const angleRad = ((isExactRightTriangle ? exactTriAngle : inclinationAngle) * Math.PI) / 180;
  const dxUpstream =
    inclinationAngle === 90
      ? 0
      : isExactRightTriangle
      ? damBaseWidth
      : damHeight / Math.tan(angleRad);
  const totalWidth = dxUpstream + damCrestWidth;
  const actualBaseWidth = isExactRightTriangle ? damBaseWidth : Math.max(damBaseWidth, totalWidth);

  const profile = [
    { x: 0, y: 0 },
    { x: dxUpstream, y: damHeight },
    { x: dxUpstream + damCrestWidth, y: damHeight },
    { x: actualBaseWidth, y: 0 }
  ];

  return { profile, actualBaseWidth };
};
