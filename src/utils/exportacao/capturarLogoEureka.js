export const capturarLogoEureka = async (isWhite = true) => {
  return new Promise((resolve, reject) => {
    try {
      const textColor = isWhite ? '#FFFFFF' : 'url(#grad)';
      const svgString = `
        <svg width="400" height="100" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3B82F6" />
              <stop offset="50%" stop-color="#38BDF8" />
              <stop offset="100%" stop-color="#67E8F9" />
            </linearGradient>
            <linearGradient id="gradDrop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38BDF8" />
              <stop offset="100%" stop-color="#67E8F9" />
            </linearGradient>
          </defs>
          <text x="5" y="70" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="78" fill="${textColor}" letter-spacing="-2">EUREKA</text>
          
          <g transform="translate(325, 12)">
            <!-- Barra reta azul -->
            <rect x="0" y="0" width="12" height="40" rx="2" fill="#3B82F6" />
            <!-- Gota ciana (losango arredondado) -->
            <g transform="translate(6, 54) rotate(45)">
              <!-- Desenha o formato de gota: um quarto de quadrado e 3 quartos de círculo -->
              <path d="M 0 -6.5 A 6.5 6.5 0 1 1 -6.5 0 L -6.5 -6.5 Z" fill="url(#gradDrop)" />
            </g>
          </g>
        </svg>
      `;

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Falha ao carregar logo SVG na imagem"));
      };
      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
};
