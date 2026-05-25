import React from 'react';

export const Lights: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.7} />
      
      {/* Main sun light, casting soft shadows from upstream to downstream */}
      <directionalLight 
        position={[-80, 120, 60]} 
        intensity={1.0} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-bias={-0.0005}
      />
      
      {/* Fill light coming from downstream bottom */}
      <directionalLight position={[100, 20, 20]} intensity={0.4} />
      
      {/* Fill light coming from behind */}
      <directionalLight position={[0, 40, -100]} intensity={0.3} />
      
      {/* Subtle bounce light from below */}
      <directionalLight position={[0, -50, 0]} intensity={0.15} />
    </>
  );
};
