import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function createWaterWaveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    if(!ctx) return new THREE.Texture();
    
    ctx.clearRect(0, 0, 120, 120);
    
    // Simple wave lines matching the 2D SVG ripple pattern
    for (let y = 0; y <= 120; y += 40) {
        // Primary wave
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, 20 + y);
        ctx.quadraticCurveTo(30, 10 + y, 60, 20 + y);
        ctx.quadraticCurveTo(90, 30 + y, 120, 20 + y);
        ctx.stroke();

        // Secondary wave (finer)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
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

export const AnimatedWaterMaterial: React.FC<{ opacity?: number }> = ({ opacity = 0.6 }) => {
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
            
            // Match 2D palette: #3b82f6 (top) → #2563eb (body) → #1d4ed8 (deep)
            shader.uniforms.colorTopo = { value: new THREE.Color('#3b82f6') };
            shader.uniforms.colorCorpo = { value: new THREE.Color('#2563eb') };
            shader.uniforms.colorSombra = { value: new THREE.Color('#1d4ed8') };
            shader.uniforms.waveColor = { value: new THREE.Color('#ffffff') };

            shader.fragmentShader = `uniform float time;\nuniform vec3 colorTopo;\nuniform vec3 colorCorpo;\nuniform vec3 colorSombra;\nuniform vec3 waveColor;\n` + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <uv_pars_fragment>',
                `#include <uv_pars_fragment>\n varying vec3 vWorldPosWater; varying vec3 vWorldNormalWater;`
            );
            
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `#ifdef USE_MAP
                   float isTop = smoothstep(0.85, 0.99, vWorldNormalWater.y);
                   
                   // Depth-dependent blue, matching the 2D gradient
                   float depthMix = clamp((vWorldPosWater.y + 15.0) / 30.0, 0.0, 1.0);
                   vec3 sideColor = mix(colorSombra, colorCorpo, depthMix);
                   
                   // No specular/fresnel — flat matte water like the 2D reference
                   diffuseColor.rgb = mix(sideColor, colorTopo, isTop);
                   
                   // Subtle wave lines on top surface only
                   if (isTop > 0.0) {
                       float scale = 0.1;
                       vec2 timeOffset = vec2(-time * 0.015, time * -0.02); 
                       vec4 topPattern = texture2D(map, vWorldPosWater.zx * scale + timeOffset);
                       diffuseColor.rgb = mix(diffuseColor.rgb, waveColor, topPattern.a * 0.2 * isTop);
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
        color="#2563eb"
        map={tex} 
        transparent={true} 
        opacity={opacity} 
        roughness={0.95}
        metalness={0.0} 
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
    />
);
};
