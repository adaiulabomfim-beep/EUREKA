import React, { useState } from 'react';
import { DamRendererProps } from '../../core/interfaces/DamRendererProps';
import { damTypeRegistry } from '../../registry/damTypeRegistry';

export const DamRenderer: React.FC<DamRendererProps> = (props) => {
  const { damType } = props;
  const [is3D, setIs3D] = useState(false);
  const [showVectors, setShowVectors] = useState(true);

  const registryEntry = damTypeRegistry[damType];
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