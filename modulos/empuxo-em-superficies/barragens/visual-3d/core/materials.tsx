import React, { useMemo } from 'react';
import * as THREE from 'three';

export type MaterialType = 'concrete' | 'ground' | 'earthDam';

function drawSpeckles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
  color: string,
  minSize: number,
  maxSize: number
) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = minSize + Math.random() * (maxSize - minSize);
    ctx.fillRect(x, y, size, size);
  }
}

export function createHatchTexture(type: MaterialType) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Texture();

  ctx.clearRect(0, 0, 1024, 1024);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1024, 1024);

  if (type === 'concrete') {
    // Concreto: padrão idêntico ao SVG com triângulos e grânulos
    ctx.fillStyle = '#a3a3a3';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Diagonal lines for technical hatch
    ctx.save();
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -1024; i < 2048; i += 16) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 1024, 1024);
    }
    ctx.stroke();
    ctx.restore();

    for(let y=0; y<1024; y+=32) {
      for(let x=0; x<1024; x+=32) {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.45)';
        ctx.beginPath(); ctx.moveTo(x+4, y+8); ctx.lineTo(x+6, y+6); ctx.lineTo(x+8, y+8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x+18, y+22); ctx.lineTo(x+20, y+20); ctx.lineTo(x+22, y+22); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x+25, y+10); ctx.lineTo(x+26.5, y+8.5); ctx.lineTo(x+28, y+10); ctx.fill();

        ctx.fillStyle = 'rgba(50, 50, 50, 0.35)';
        ctx.beginPath(); ctx.arc(x+10, y+15, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+22, y+7, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+5, y+28, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+28, y+25, 1.2, 0, Math.PI*2); ctx.fill();
      }
    }
  } else if (type === 'earthDam') {
    ctx.fillStyle = '#8f6848';
    ctx.fillRect(0, 0, 1024, 1024);
    drawSpeckles(ctx, 1024, 1024, 12000, 'rgba(50, 30, 15, 0.3)', 1.0, 3.0);
    drawSpeckles(ctx, 1024, 1024, 4000, 'rgba(40, 20, 10, 0.5)', 2.0, 6.0);
    drawSpeckles(ctx, 1024, 1024, 1000, 'rgba(30, 15, 5, 0.6)', 3.0, 8.0);
  } else if (type === 'ground') {
    ctx.fillStyle = '#b08358';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.save();
    ctx.strokeStyle = 'rgba(50, 30, 20, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = -1024; i < 2048; i += 40) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 1024, 1024);
      // Cross hatch for earth
      ctx.moveTo(i, 1024);
      ctx.lineTo(i + 1024, 0);
    }
    ctx.stroke();
    ctx.restore();

    drawSpeckles(ctx, 1024, 1024, 8000, 'rgba(50, 30, 10, 0.3)', 1.0, 3.0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const texCache: Record<string, THREE.Texture> = {};

export function getHatchTexture(type: MaterialType) {
  if (!texCache[type]) texCache[type] = createHatchTexture(type);
  return texCache[type];
}

export const HatchMaterial: React.FC<{
  type: MaterialType;
  color?: string;
}> = ({ type, color }) => {
  const tex = getHatchTexture(type);

  const onBeforeCompile = useMemo(() => {
    return (shader: any) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <uv_pars_vertex>',
        `
        #include <uv_pars_vertex>
        varying vec3 vWorldPosHatch;
        varying vec3 vWorldNormalHatch;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPosHatch = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormalHatch = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_pars_fragment>',
        `
        #include <map_pars_fragment>
        varying vec3 vWorldPosHatch;
        varying vec3 vWorldNormalHatch;
        `
      );

      const shaderHeader = `
        vec3 n = normalize(vWorldNormalHatch);

        vec3 blend = abs(n);
        blend = max(blend, vec3(0.00001));
        blend /= (blend.x + blend.y + blend.z);

        vec2 uvX = vWorldPosHatch.yz;
        vec2 uvY = vWorldPosHatch.xz;
        vec2 uvZ = vWorldPosHatch.xy;

        float topMask = smoothstep(0.80, 0.98, n.y);
      `;

      let fragmentMapReplace = '';

      if (type === 'concrete') {
        fragmentMapReplace = shaderHeader + `
          float texScale = 0.050;
          float patternStrength = 0.34;

          vec4 tx = texture2D(map, uvX * texScale);
          vec4 ty = texture2D(map, uvY * texScale);
          vec4 tz = texture2D(map, uvZ * texScale);

          vec3 pattern = tx.rgb * blend.x + ty.rgb * blend.y + tz.rgb * blend.z;

          // Concreto mais escuro e presente
          vec3 cTop    = vec3(184.0, 187.0, 190.0) / 255.0; // #B8BBBE
          vec3 cMain   = vec3(163.0, 167.0, 171.0) / 255.0; // #A3A7AB

          vec3 finalColor = mix(cMain, cTop, topMask * 0.78);

          vec3 patternMix = mix(vec3(1.0), pattern, patternStrength);
          diffuseColor.rgb = finalColor * patternMix;
        `;
      } else if (type === 'earthDam') {
        fragmentMapReplace = shaderHeader + `
          float texScale = 0.032;
          float patternStrength = 0.24;

          vec4 tx = texture2D(map, uvX * texScale);
          vec4 ty = texture2D(map, uvY * texScale);
          vec4 tz = texture2D(map, uvZ * texScale);

          vec3 pattern = tx.rgb * blend.x + ty.rgb * blend.y + tz.rgb * blend.z;

          vec3 cTop    = vec3(166.0, 116.0, 58.0) / 255.0;  // #A6743A
          vec3 cMain   = vec3(145.0, 98.0, 47.0) / 255.0;   // #91622F

          vec3 finalColor = mix(cMain, cTop, topMask * 0.76);

          vec3 patternMix = mix(vec3(1.0), pattern, patternStrength);
          diffuseColor.rgb = finalColor * patternMix;
        `;
      } else if (type === 'ground') {
        fragmentMapReplace = shaderHeader + `
          float texScale = 0.030;
          float patternStrength = 0.12;

          vec4 tx = texture2D(map, uvX * texScale);
          vec4 ty = texture2D(map, uvY * texScale);
          vec4 tz = texture2D(map, uvZ * texScale);

          vec3 pattern = tx.rgb * blend.x + ty.rgb * blend.y + tz.rgb * blend.z;

          // Base redefinida p/ marrom forte
          vec3 cTop    = vec3(158.0, 98.0, 9.0) / 255.0;    // #9E6209
          vec3 cMain   = vec3(141.0, 87.0, 11.0) / 255.0;   // #8D570B

          vec3 finalColor = mix(cMain, cTop, topMask * 0.72);

          vec3 patternMix = mix(vec3(1.0), pattern, patternStrength);
          diffuseColor.rgb = finalColor * patternMix;
        `;
      }

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          ${fragmentMapReplace}
        #endif`
      );
    };
  }, [type]);

  const baseColor = color || '#ffffff';

  return (
    <meshStandardMaterial
      map={tex}
      color={baseColor}
      toneMapped={true}
      roughness={type === 'concrete' ? 0.7 : 0.9}
      metalness={0.05}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => `${type}-${color ?? 'default'}`}
    />
  );
};