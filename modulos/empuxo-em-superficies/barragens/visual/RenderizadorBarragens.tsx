import React, { useState } from 'react';
import { RenderizadorBarragensProps } from '../dominio/tipos';
import { registroTiposBarragem } from '../dominio/registroTipos';

export const RenderizadorBarragens: React.FC<RenderizadorBarragensProps> = (props) => {
  const { damType } = props;
  const [is3D, setIs3D] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  const registryEntry = registroTiposBarragem[damType];
  if (!registryEntry) {
    return <div className="p-4 text-red-500">Tipo de barragem não encontrado.</div>;
  }

  const Component = is3D ? registryEntry.component3D : registryEntry.component2D;

  if (!Component) {
    return <div className="p-4 text-red-500">Componente de visualização não encontrado.</div>;
  }

  return (
    <Component
      {...props}
      is3D={is3D}
      setIs3D={setIs3D}
      showVectors={showVectors}
      setShowVectors={setShowVectors}
    />
  );
};