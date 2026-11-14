import React, { useRef, useState } from 'react';
import { RenderizadorBarragensProps } from '../../dominio/tipos';
import { BarragemCanvas, Camera3DHandle } from '../../visual-3d/components/BarragemCanvas';
import { BarragemTerraScene } from '../../visual-3d/components/BarragemTerraScene';
import { Vista3DUI } from '../../visual-3d/components/Vista3DUI';

type EarthDam3DViewProps = RenderizadorBarragensProps & {
  is3D: boolean;
  setIs3D: React.Dispatch<React.SetStateAction<boolean>>;
  showVectors: boolean;
  setShowVectors: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Vista3D: React.FC<EarthDam3DViewProps> = (props) => {
  const {
    damHeight,
    damBaseWidth,
    damCrestWidth,
    inclinationAngle,
    downstreamAngle,
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
  const cameraControlRef = useRef<Camera3DHandle | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);

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
        onZoomIn={() => cameraControlRef.current?.zoomIn()}
        onZoomOut={() => cameraControlRef.current?.zoomOut()}
        onResetCamera={() => cameraControlRef.current?.reset()}
        zoomPercent={zoomPercent}
      />

      <div className="w-full h-full flex items-center justify-center">
        <BarragemCanvas
          targetY={damHeight / 3}
          controlRef={cameraControlRef}
          onZoomChange={setZoomPercent}
        >
          <BarragemTerraScene
            damHeight={damHeight}
            damBaseWidth={damBaseWidth}
            damCrestWidth={damCrestWidth}
            inclinationAngle={inclinationAngle}
            downstreamAngle={downstreamAngle}
            channelWidth={CHANNEL_WIDTH}
            upstreamLevel={upstreamLevel}
            downstreamLevel={downstreamLevel}
            hasMudLayer={props.hasMudLayer}
            mudHeight={props.mudHeight}
            mudDensity={props.mudDensity}
            unitSystem={props.unitSystem}
            gravity={props.gravity}
            force={props.force}
            forceH={props.forceH}
            forceV={props.forceV}
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

