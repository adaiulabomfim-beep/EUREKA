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

export const AnimatedWaterMaterial: React.FC<{
    opacity?: number;
    colorPrimaria?: string;
    colorSecundaria?: string;
    colorSuperficie?: string;
    colorCrista?: string;
    minY?: number;
    maxY?: number;
}> = ({
    opacity = 0.66,
    colorPrimaria = '#3b82f6',
    colorSecundaria = '#2563eb',
    colorSuperficie = '#1d4ed8',
    colorCrista,
    minY = 0,
    maxY = 12,
}) => {
    const tex = useMemo(() => {
        const t = getWaterWaveTexture().clone();
        t.needsUpdate = true;
        t.repeat.set(1, 1);
        return t;
    }, []);

    const effectiveCrista =
        colorCrista ?? (colorPrimaria.toLowerCase() === '#3b82f6' ? '#60a5fa' : colorPrimaria);

    const onBeforeCompile = useMemo(() => {
        return (shader: any) => {
            shader.uniforms.time = { value: 0 };
            shader.uniforms.uMinY = { value: minY };
            shader.uniforms.uMaxY = { value: maxY };
            shader.uniforms.colorTopo = { value: new THREE.Color(colorPrimaria) };
            shader.uniforms.colorCorpo = { value: new THREE.Color(colorSecundaria) };
            shader.uniforms.colorSombra = { value: new THREE.Color(colorSuperficie) };
            shader.uniforms.colorCrista = { value: new THREE.Color(effectiveCrista) };
            shader.uniforms.waveColor = { value: new THREE.Color('#ffffff') };

            shader.vertexShader = `uniform float time;\n` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                '#include <uv_pars_vertex>',
                `#include <uv_pars_vertex>\n varying vec3 vWorldPosWater; varying vec3 vWorldNormalWater;`
            );
            shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>\n vWorldPosWater = (modelMatrix * vec4(position, 1.0)).xyz; vWorldNormalWater = normalize((modelMatrix * vec4(normal, 0.0)).xyz);`
            );

            shader.fragmentShader =
                `uniform float time;\nuniform float uMinY;\nuniform float uMaxY;\nuniform vec3 colorTopo;\nuniform vec3 colorCorpo;\nuniform vec3 colorSombra;\nuniform vec3 colorCrista;\nuniform vec3 waveColor;\n` +
                shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <uv_pars_fragment>',
                `#include <uv_pars_fragment>\n varying vec3 vWorldPosWater; varying vec3 vWorldNormalWater;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `#ifdef USE_MAP
                   float isTop = smoothstep(0.85, 0.99, vWorldNormalWater.y);

                   // Normalização real da profundidade entre uMinY e uMaxY (equivalente ao gradiente vertical 2D)
                   float spanY = max(0.05, uMaxY - uMinY);
                   float depthMix = clamp((vWorldPosWater.y - uMinY) / spanY, 0.0, 1.0);

                   // Gradiente 2D fiel: #1d4ed8 (fundo) -> #2563eb (corpo) -> #3b82f6 (topo próximo à superfície)
                   vec3 bodyCol = mix(colorSombra, colorCorpo, smoothstep(0.0, 0.65, depthMix));
                   vec3 sideColor = mix(bodyCol, colorTopo, smoothstep(0.55, 1.0, depthMix));
                   vec3 topSurfaceColor = mix(colorTopo, colorCrista, 0.25);

                   diffuseColor.rgb = mix(sideColor, topSurfaceColor, isTop);

                   // Controle equilibrado de transparência: superfície mais translúcida e base com profundidade sem ocultar objetos submersos
                   float alphaBody = mix(min(0.75, diffuseColor.a + 0.08), diffuseColor.a, depthMix);
                   diffuseColor.a = mix(alphaBody, max(0.54, diffuseColor.a - 0.06), isTop);

                   // Ondulações sutis na superfície livre (mesmo padrão visual do 2D)
                   if (isTop > 0.0) {
                       float scale = 0.1;
                       vec2 timeOffset = vec2(-time * 0.015, time * -0.02);
                       vec4 topPattern = texture2D(map, vWorldPosWater.zx * scale + timeOffset);
                       diffuseColor.rgb = mix(diffuseColor.rgb, waveColor, topPattern.a * 0.28 * isTop);
                   }
                  #endif`
            );

            // Preservar azul vivo e saturado do 2D evitando escurecimento 1/PI do PBR, sombras duras e dessaturação por IBL
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <opaque_fragment>',
                `
                   vec3 waterSunDir = normalize(vec3(-0.45, 0.85, 0.50));
                   float waterNdotL = clamp(dot(normalize(vWorldNormalWater), waterSunDir) * 0.5 + 0.5, 0.0, 1.0);
                   float waterFacetShade = mix(0.90, 1.03, waterNdotL);
                   float waterTopFlag = smoothstep(0.85, 0.99, vWorldNormalWater.y);
                   vec3 calibratedWater = diffuseColor.rgb * mix(waterFacetShade, 1.04, waterTopFlag);
                   outgoingLight = mix(calibratedWater, outgoingLight, 0.08);
                   #include <opaque_fragment>
                `
            );

            tex.userData.shader = shader;
        };
    }, [tex]);

    useFrame((state) => {
        const shader = tex.userData.shader;
        if (shader) {
            shader.uniforms.time.value = state.clock.elapsedTime;
            shader.uniforms.uMinY.value = minY;
            shader.uniforms.uMaxY.value = maxY;
            shader.uniforms.colorTopo.value.set(colorPrimaria);
            shader.uniforms.colorCorpo.value.set(colorSecundaria);
            shader.uniforms.colorSombra.value.set(colorSuperficie);
            shader.uniforms.colorCrista.value.set(effectiveCrista);
        }
    });

    return (
        <meshStandardMaterial
            color={colorSecundaria}
            map={tex}
            transparent={true}
            opacity={opacity}
            roughness={0.85}
            metalness={0.0}
            envMapIntensity={0}
            depthWrite={false}
            onBeforeCompile={onBeforeCompile}
            customProgramCacheKey={() => 'eureka-animated-water-v2'}
        />
    );
};
