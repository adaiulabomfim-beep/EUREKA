import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function createWaterWaveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120; // Needs to tile perfectly on Y, pattern height was 40 so 3x40=120
    const ctx = canvas.getContext('2d');
    
    if(!ctx) return new THREE.Texture();
    
    ctx.clearRect(0, 0, 120, 120);
    
    for (let y = 0; y <= 120; y += 40) {
        // Line 1: opacity 0.4, width 1
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        // M0,20 Q30,10 60,20 T120,20
        ctx.moveTo(0, 20 + y);
        ctx.quadraticCurveTo(30, 10 + y, 60, 20 + y);
        ctx.quadraticCurveTo(90, 30 + y, 120, 20 + y);
        ctx.stroke();

        // Line 2: opacity 0.2, width 0.5 (shifted)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        // M-60,0 Q-30,-10 0,0 T60,0 -> we shift X by +60 for local canvas: M0,0 Q30,-10 60,0 T120,0
        // And also wrap to left to be safe
        ctx.moveTo(0, 0 + y);
        ctx.quadraticCurveTo(30, -10 + y, 60, 0 + y);
        ctx.quadraticCurveTo(90, 10 + y, 120, 0 + y);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
}

let waterTexCache: THREE.Texture | null = null;
function getWaterWaveTexture() {
    if (!waterTexCache) waterTexCache = createWaterWaveTexture();
    return waterTexCache;
}

export const AnimatedWaterMaterial: React.FC<{ opacity?: number }> = ({ opacity = 0.88 }) => {
    const tex = useMemo(() => {
        const t = getWaterWaveTexture().clone();
        t.needsUpdate = true;
        t.repeat.set(1, 1);
        return t;
    }, []);

    const onBeforeCompile = useMemo(() => {
        return (shader: any) => {
            shader.uniforms.time = { value: 0 };
            shader.vertexShader = `uniform float time;\n` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_pars_vertex>',
                `#include <uv_pars_vertex>\n varying vec3 vWorldPosWater; varying vec3 vWorldNormalWater;`
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>\n vWorldPosWater = (modelMatrix * vec4(position, 1.0)).xyz; vWorldNormalWater = normalize((modelMatrix * vec4(normal, 0.0)).xyz);`
            );
            
            shader.uniforms.colorTopo = { value: new THREE.Color('#8FB7FF') }; // Topo claro
            shader.uniforms.colorCorpo = { value: new THREE.Color('#4A86F7') }; // Azul principal
            shader.uniforms.colorSombra = { value: new THREE.Color('#2F6EEB') }; // Azul profundo
            shader.uniforms.waveColor = { value: new THREE.Color('#ffffff') };

            shader.fragmentShader = `uniform float time;\nuniform vec3 colorTopo;\nuniform vec3 colorCorpo;\nuniform vec3 colorSombra;\nuniform vec3 waveColor;\n` + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <uv_pars_fragment>',
                `#include <uv_pars_fragment>\n varying vec3 vWorldPosWater; varying vec3 vWorldNormalWater;`
            );
            
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `#ifdef USE_MAP
                   // Apply waves ONLY on the top surface (where normal Y is close to 1)
                   float isTop = smoothstep(0.8, 0.99, vWorldNormalWater.y);
                   
                   float depthMix = clamp((vWorldPosWater.y + 15.0) / 30.0, 0.0, 1.0);
                   vec3 sideColor = mix(colorSombra, colorCorpo, depthMix);
                   
                   // Base color depends on normal mapping (top vs side)
                   diffuseColor.rgb = mix(sideColor, colorTopo, isTop);
                   
                   if (isTop > 0.0) {
                       float scale = 0.025; // Adjusted scale for larger, elegant curves
                       
                       // vWorldPosWater.z -> Canvas X (width, parallel to dam)
                       // vWorldPosWater.x -> Canvas Y (length, flow direction)
                       // Slow, gentle animation flow
                       vec2 timeOffset = vec2(-time * 0.015, time * -0.04); 
                       
                       vec4 topPattern = texture2D(map, vWorldPosWater.zx * scale + timeOffset);
                       
                       // Mix waves with base water color using pattern alpha
                       diffuseColor.rgb = mix(diffuseColor.rgb, waveColor, topPattern.a * 0.45 * isTop);
                   }
                 #endif`
        );
        tex.userData.shader = shader;
    };
}, [tex]);

useFrame((state) => {
    if (tex.userData.shader) {
        tex.userData.shader.uniforms.time.value = state.clock.elapsedTime;
    }
});

return (
    <meshStandardMaterial 
        color="#327ce6"
        map={tex} 
        transparent={true} 
        opacity={opacity} 
        roughness={0.15}
        metalness={0.4} 
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
    />
);
};
