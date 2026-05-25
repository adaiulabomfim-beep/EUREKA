import React from 'react';
import { Edges } from '@react-three/drei';
import { HatchMaterial } from '../core/materials';

export const GroundPlane: React.FC<any> = ({ damHeight, damBaseWidth, channelWidth }) => {
    const groundLength = damHeight * 5 + damBaseWidth * 3;
    const groundWidth = channelWidth * 4;
    const groundThickness = Math.max(10, damHeight * 0.3); // Visible thickness

    return (
        <group>
            {/* Main Earth Block Foundation */}
            <mesh position={[0, -groundThickness / 2, 0]} receiveShadow>
                <boxGeometry args={[groundLength, groundThickness, groundWidth]} />
                <HatchMaterial type="ground" />
                <Edges color="#47301c" threshold={15} opacity={0.45} transparent />
            </mesh>
        </group>
    );
};
