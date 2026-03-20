export const construirGeometria = (damHeight: number, damBaseWidth: number, damCrestWidth: number, inclinationAngle: number, buttressAngle: number = 45) => {
  const angleRad = (inclinationAngle * Math.PI) / 180;
  const dxUpstream = inclinationAngle === 90 ? 0 : damHeight / Math.tan(angleRad);
  
  const wallBaseWidth = dxUpstream + damCrestWidth;
  
  const buttressAngleRad = (buttressAngle * Math.PI) / 180;
  const dxButtress = buttressAngle === 90 ? 0 : damHeight / Math.tan(buttressAngleRad);
  
  const actualBaseWidth = wallBaseWidth + dxButtress;

  const wallProfile = [
    { x: 0, y: 0 },
    { x: dxUpstream, y: damHeight },
    { x: wallBaseWidth, y: damHeight },
    { x: wallBaseWidth, y: 0 }
  ];

  const buttressProfile2D = [
    { x: wallBaseWidth, y: 0 },
    { x: wallBaseWidth, y: damHeight },
    { x: actualBaseWidth, y: 0 }
  ];

  const buttressProfile3D = [
    { x: wallBaseWidth, y: 0 },
    { x: wallBaseWidth, y: damHeight },
    { x: actualBaseWidth, y: 0 }
  ];

  return { wallProfile, buttressProfile2D, buttressProfile3D, actualBaseWidth };
};
