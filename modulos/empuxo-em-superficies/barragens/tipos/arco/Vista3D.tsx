import React from 'react';
import { RenderizadorBarragensProps } from '../../dominio/tipos';
import { BarragemCanvas } from '../../visual-3d/components/BarragemCanvas';
import { BarragemArcoScene } from '../../visual-3d/components/BarragemArcoScene';
import { Vista3DUI } from '../../visual-3d/components/Vista3DUI';

type ArchDam3DViewProps = RenderizadorBarragensProps & {
  is3D: boolean;
  setIs3D: React.Dispatch<React.SetStateAction<boolean>>;
  showVectors: boolean;
  setShowVectors: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Vista3D: React.FC<ArchDam3DViewProps> = (props) => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    archRadius,
    upstreamLevel,
    downstreamLevel = 0,
    isAnalyzed,
    onCalculate,
    onReset,
    is3D,
    setIs3D,
    showVectors,
    setShowVectors,
  } = props;

  const CHANNEL_WIDTH = 40;

  return (
    <div className="w-full h-full relative" style={{ minHeight: 600 }}>
      <Vista3DUI
        is3D={is3D}
        setIs3D={setIs3D}
        showVectors={showVectors}
        setShowVectors={setShowVectors}
        isAnalyzed={isAnalyzed}
        onCalculate={onCalculate}
        onReset={onReset}
      />
      
      <div className="w-full h-full flex items-center justify-center">
        <BarragemCanvas targetY={damHeight / 3}>
          <BarragemArcoScene
            damHeight={damHeight}
            damBaseWidth={damBaseWidth}
            damCrestWidth={damCrestWidth}
            inclinationAngle={props.inclinationAngle}
            archRadius={archRadius}
            channelWidth={CHANNEL_WIDTH}
            upstreamLevel={upstreamLevel}
            downstreamLevel={downstreamLevel}
            force={props.force}
            s_cp={props.s_cp}
            y_cp={props.y_cp}
            up={props.up}
            down={props.down}
            isAnalyzed={isAnalyzed}
            showVectors={showVectors}
          />
        </BarragemCanvas>
      </div>
    </div>
  );
};
