import React, { useMemo } from 'react';
import * as THREE from 'three';

export type MaterialType = 'concrete' | 'ground' | 'earthDam';

export function createHatchTexture(type: MaterialType) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.Texture();

  // White base — the SHADER handles the actual material color.
  // The texture only encodes the PATTERN via darkened areas.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);

  if (type === 'concrete') {
    // ═══════════════════════════════════════════════════════════
    // CONCRETE — Matches 2D SVG concretePattern exactly:
    //   - Gray base (#a3a3a3)
    //   - Scattered upward-pointing triangles (aggregate symbol)
    //   - Small dots between triangles (fine aggregate)
    //   - NO diagonal hatch lines (that's the earth convention)
    // ═══════════════════════════════════════════════════════════
    
    // Scale factor: SVG tile = 32x32, canvas = 512x512 → 16x repetition
    const tileSize = 32;

    for (let ty = 0; ty < 512; ty += tileSize) {
      for (let tx = 0; tx < 512; tx += tileSize) {
        // Triangles (aggregate symbols — engineering convention for concrete)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
        
        // Triangle 1 (top-left area)
        ctx.beginPath();
        ctx.moveTo(tx + 4, ty + 8);
        ctx.lineTo(tx + 6, ty + 6);
        ctx.lineTo(tx + 8, ty + 8);
        ctx.closePath();
        ctx.fill();
        
        // Triangle 2 (center-right area)
        ctx.beginPath();
        ctx.moveTo(tx + 18, ty + 22);
        ctx.lineTo(tx + 20, ty + 20);
        ctx.lineTo(tx + 22, ty + 22);
        ctx.closePath();
        ctx.fill();
        
        // Triangle 3 (right area)
        ctx.beginPath();
        ctx.moveTo(tx + 25, ty + 10);
        ctx.lineTo(tx + 26.5, ty + 8.5);
        ctx.lineTo(tx + 28, ty + 10);
        ctx.closePath();
        ctx.fill();

        // Fine aggregate dots (scattered grains)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
        ctx.beginPath(); ctx.arc(tx + 10, ty + 15, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 22, ty + 7, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 5, ty + 28, 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 28, ty + 25, 0.8, 0, Math.PI * 2); ctx.fill();
        
        // A few extra random-positioned grains for natural look
        ctx.beginPath(); ctx.arc(tx + 14, ty + 3, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 2, ty + 18, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(tx + 16, ty + 28, 0.7, 0, Math.PI * 2); ctx.fill();
      }
    }
    
  } else if (type === 'earthDam' || type === 'ground') {
    // ═══════════════════════════════════════════════════════════
    // EARTH / GROUND — Architectural Earth Hatch (EARTH pattern)
    //   - Alternating blocks of horizontal and vertical lines
    // ═══════════════════════════════════════════════════════════
    
    ctx.save();
    ctx.strokeStyle = type === 'earthDam' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.2;
    
    // Use 64px block size which perfectly divides 512
    const blockSize = 64; 
    const numLines = 4;
    const spacing = blockSize / numLines; // 16px between lines
    
    ctx.beginPath();
    for (let by = 0; by < 512; by += blockSize) {
      for (let bx = 0; bx < 512; bx += blockSize) {
        const isHorizontal = ((bx / blockSize) + (by / blockSize)) % 2 === 0;
        
        if (isHorizontal) {
          // Horizontal lines inside this block
          for (let i = 0; i < numLines; i++) {
            const y = by + i * spacing;
            ctx.moveTo(bx, y);
            ctx.lineTo(bx + blockSize, y);
          }
        } else {
          // Vertical lines inside this block
          for (let i = 0; i < numLines; i++) {
            const x = bx + i * spacing;
            ctx.moveTo(x, by);
            ctx.lineTo(x, by + blockSize);
          }
        }
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// Version key for cache invalidation on code changes
const TEX_VERSION = 'v7';
const texCache: Record<string, THREE.Texture> = {};

export function getHatchTexture(type: MaterialType) {
  const key = `${type}_${TEX_VERSION}`;
  if (!texCache[key]) texCache[key] = createHatchTexture(type);
  return texCache[key];
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

      // Triplanar projection header — shared across all material types
      const shaderHeader = `
        vec3 n = normalize(vWorldNormalHatch);

        // Use dominant axis only to prevent ghosting/interference of the woven pattern on slopes
        vec3 blend = vec3(0.0);
        vec3 absN = abs(n);
        if (absN.x >= absN.y && absN.x >= absN.z) {
            blend.x = 1.0;
        } else if (absN.y >= absN.z) {
            blend.y = 1.0;
        } else {
            blend.z = 1.0;
        }

        vec2 uvX = vWorldPosHatch.yz;
        vec2 uvY = vWorldPosHatch.xz;
        vec2 uvZ = vWorldPosHatch.xy;

        float topMask = smoothstep(0.80, 0.98, n.y);
      `;

      let fragmentMapReplace = '';

      if (type === 'concrete') {
        // Concrete: multiply pattern with base gray.
        // Texture has white base + dark triangles/dots.
        fragmentMapReplace = shaderHeader + `
          float texScale = 0.065;

          vec4 tx = texture2D(map, uvX * texScale);
          vec4 ty = texture2D(map, uvY * texScale);
          vec4 tz = texture2D(map, uvZ * texScale);

          vec3 pattern = tx.rgb * blend.x + ty.rgb * blend.y + tz.rgb * blend.z;

          // Base: #a3a3a3, slightly brighter on top faces
          vec3 cTop  = vec3(185.0, 185.0, 185.0) / 255.0;
          vec3 cMain = vec3(163.0, 163.0, 163.0) / 255.0;
          vec3 baseCol = mix(cMain, cTop, topMask * 0.8);

          diffuseColor.rgb = baseCol * pattern;
        `;
      } else if (type === 'earthDam') {
        // Earth: multiply grouped diagonal lines with amber base.
        fragmentMapReplace = shaderHeader + `
          float texScale = 0.12; // Increased scale to make the hatch much smaller

          vec4 tx = texture2D(map, uvX * texScale);
          vec4 ty = texture2D(map, uvY * texScale);
          vec4 tz = texture2D(map, uvZ * texScale);

          vec3 pattern = tx.rgb * blend.x + ty.rgb * blend.y + tz.rgb * blend.z;

          // Base: Darker rich earth color
          vec3 cTop  = vec3(156.0, 115.0, 80.0) / 255.0; // darker top
          vec3 cMain = vec3(135.0, 95.0, 60.0) / 255.0; // darker rich brown
          vec3 baseCol = mix(cMain, cTop, topMask * 0.76);

          diffuseColor.rgb = baseCol * pattern;
        `;
      } else if (type === 'ground') {
        // Ground: same diagonal lines over dark brown base.
        fragmentMapReplace = shaderHeader + `
          float texScale = 0.11; // Increased scale to make the hatch much smaller

          vec4 tx = texture2D(map, uvX * texScale);
          vec4 ty = texture2D(map, uvY * texScale);
          vec4 tz = texture2D(map, uvZ * texScale);

          vec3 pattern = tx.rgb * blend.x + ty.rgb * blend.y + tz.rgb * blend.z;

          // Base: #713f12 (dark brown), slightly brighter on top
          vec3 cTop  = vec3(125.0, 75.0, 25.0) / 255.0;
          vec3 cMain = vec3(113.0, 63.0, 18.0) / 255.0;
          vec3 baseCol = mix(cMain, cTop, topMask * 0.72);

          diffuseColor.rgb = baseCol * pattern;
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
      customProgramCacheKey={() => `${type}-${color ?? 'default'}-${TEX_VERSION}`}
    />
  );
};