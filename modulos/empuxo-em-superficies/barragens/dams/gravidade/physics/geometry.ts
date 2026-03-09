export const buildGravityDam = (
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number,
  inclinationAngle: number
) => {
  const safeHeight = Math.max(0, damHeight);
  const safeBaseWidth = Math.max(0, damBaseWidth);
  const safeCrestWidth = Math.max(0, Math.min(damCrestWidth, safeBaseWidth));

  const upstreamBaseX = -safeBaseWidth / 2;
  const downstreamBaseX = safeBaseWidth / 2;

  const safeAngle = Math.max(1, Math.min(89.9, inclinationAngle));
  const angleRad = (safeAngle * Math.PI) / 180;

  // Caso especial: crista zero => topo colapsa em um único ponto
  if (safeCrestWidth === 0) {
    const maxRun = safeBaseWidth;
    const rawRun = safeHeight / Math.tan(angleRad);
    const run = Math.max(0, Math.min(rawRun, maxRun));

    // ponto único do topo
    const apexX = Math.min(upstreamBaseX + run, downstreamBaseX);

    const profile = [
      { x: upstreamBaseX, y: 0 },   // 0: base montante
      { x: downstreamBaseX, y: 0 }, // 1: base jusante
      { x: apexX, y: safeHeight },  // 2: crista jusante
      { x: apexX, y: safeHeight },  // 3: crista montante
    ];

    return {
      profile,
      isAngleClamped: rawRun > maxRun,
      minValidAngleDeg:
        maxRun > 0 ? (Math.atan(safeHeight / maxRun) * 180) / Math.PI : 90,
    };
  }

  // Caso normal: topo trapezoidal
  const maxRun = safeBaseWidth - safeCrestWidth;
  const rawRun = safeHeight / Math.tan(angleRad);
  const run = Math.max(0, Math.min(rawRun, maxRun));

  let upstreamCrestX = upstreamBaseX + run;
  let downstreamCrestX = upstreamCrestX + safeCrestWidth;

  // nunca deixar cruzar a crista de jusante
  upstreamCrestX = Math.min(upstreamCrestX, downstreamCrestX);

  const profile = [
    { x: upstreamBaseX, y: 0 },       // 0
    { x: downstreamBaseX, y: 0 },     // 1
    { x: downstreamCrestX, y: safeHeight }, // 2
    { x: upstreamCrestX, y: safeHeight },   // 3
  ];

  return {
    profile,
    isAngleClamped: rawRun > maxRun,
    minValidAngleDeg:
      maxRun > 0 ? (Math.atan(safeHeight / maxRun) * 180) / Math.PI : 90,
  };
};