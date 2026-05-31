import React from 'react';
import { Edges } from '@react-three/drei';
import { HatchMaterial } from '../core/materials';

export const GroundPlane: React.FC<any> = ({ damHeight, damBaseWidth, channelWidth, actualBaseWidth }) => {
    // If actualBaseWidth isn't provided (e.g. older scenes), fallback to an approximation
    const baseW = actualBaseWidth || damBaseWidth;
    
    // Exactly cover the dam base + 1.5*damHeight of water on each side
    const groundLength = baseW + damHeight * 3.0; 
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
