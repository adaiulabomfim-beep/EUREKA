import React from 'react';
import { Edges } from '@react-three/drei';
import { HatchMaterial } from '../core/materials';
import { getHorizontalExtension3D } from '../utils/geometryUtils';

export const GroundPlane: React.FC<any> = ({ damHeight, damBaseWidth, channelWidth, actualBaseWidth }) => {
    // If actualBaseWidth isn't provided (e.g. older scenes), fallback to an approximation
    const baseW = actualBaseWidth || damBaseWidth;
    
    // Prolongar o terreno horizontalmente além dos limites visíveis da cena 3D
    const farExtension = getHorizontalExtension3D(damHeight, baseW);
    const groundLength = baseW + farExtension * 2;
    const groundWidth = channelWidth; // Exactly match the channel width
    const groundThickness = Math.max(8, damHeight * 0.25); // Visible thickness

    // The user requested to remove the embedded effect
    const embedDepth = 0; 

    return (
        <group>
            {/* Main Earth Block Foundation — dark brown matching 2D (#713f12) */}
            <mesh position={[0, -groundThickness / 2 + embedDepth, 0]} receiveShadow>
                <boxGeometry args={[groundLength, groundThickness, groundWidth]} />
                <HatchMaterial type="ground" />
                <Edges color="#4a2a0e" threshold={15} opacity={0.45} transparent />
            </mesh>
        </group>
    );
};
