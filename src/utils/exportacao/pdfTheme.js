export const PDF_THEME = {
  colors: {
    primary: '#2563EB',    // Blue 600
    cyan: '#06B6D4',       // Cyan 500
    secondary: '#475569',  // Slate 600
    textMain: '#1E293B',   // Slate 800
    textLight: '#64748B',  // Slate 500
    border: '#E2E8F0',     // Slate 200
    bgLight: '#F8FAFC',    // Slate 50
    white: '#FFFFFF',
    // Status colors
    red: '#EF4444',
    green: '#10B981',
    blue: '#3B82F6',
    purple: '#8B5CF6'
  },
  fonts: {
    main: 'helvetica',
    bold: 'helvetica' // jsPDF will handle boldness internally if we set 'bold'
  },
  layout: {
    pageWidth: 210, // A4 width in mm
    pageHeight: 297, // A4 height in mm
    margin: 15,
    headerHeight: 35,
    footerHeight: 15
  }
};
