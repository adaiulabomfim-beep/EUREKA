export const buildButtressDam = (
  damHeight: number,
  damBaseWidth: number,
  damCrestWidth: number
) => {
  // Perfil da parede da barragem: face montante vertical em x=0, face jusante inclinada
  const wallProfile = [
    { x: 0, y: 0 }, // Montante bottom
    { x: damBaseWidth, y: 0 }, // Jusante bottom
    { x: damCrestWidth, y: damHeight }, // Jusante top
    { x: 0, y: damHeight }, // Montante top
  ];
  
  // Perfil do contraforte: triangular, na face jusante, estendendo-se para fora
  const buttressProfile = [
    { x: damBaseWidth, y: 0 }, // Jusante bottom
    { x: damCrestWidth, y: damHeight }, // Jusante top
    { x: damBaseWidth + (damBaseWidth - damCrestWidth), y: 0 }, // Base estendida para fora
  ];
  
  return { wallProfile, buttressProfile };
};
