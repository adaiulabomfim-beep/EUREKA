import React from 'react';
import { renderToString } from 'react-dom/server';
import { 
  Waves, 
  Calendar, 
  FileText, 
  User, 
  Box, 
  List, 
  Zap, 
  BarChart, 
  ShieldCheck 
} from "lucide-react";

export const pdfIcons = {};

const convertSvgToPng = (IconComponent, color) => {
  return new Promise((resolve) => {
    try {
      let svgString = renderToString(React.createElement(IconComponent, { size: 64, color: color, strokeWidth: 2 }));
      
      // Garante a presença do namespace xmlns
      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      }
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch (err) {
      console.warn("Erro ao converter ícone:", err);
      resolve(null);
    }
  });
};

export const loadPdfIcons = async () => {
  // Cor azul do sistema EUREKA e cor branca para o cabeçalho
  const colorBlue = '#2563EB'; // text-blue-600
  const colorWhite = '#FFFFFF';
  
  const iconMap = {
    waves: Waves,
    calendar: Calendar,
    fileText: FileText,
    user: User,
    box: Box,
    list: List,
    zap: Zap,
    barChart: BarChart,
    shieldCheck: ShieldCheck
  };

  const promises = Object.entries(iconMap).map(async ([key, Component]) => {
    // Para ícones do cabeçalho, gerar a versão branca também
    if (['waves', 'calendar', 'fileText'].includes(key)) {
      pdfIcons[`${key}White`] = await convertSvgToPng(Component, colorWhite);
    }
    pdfIcons[key] = await convertSvgToPng(Component, colorBlue);
  });

  await Promise.all(promises);
};
