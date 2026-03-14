import React from 'react';
import { ResultsPanel, ResultsCard } from '../../../../interface/PainelResultados';
import { Calculator } from 'lucide-react';

export const PainelResultados = ({ children, footerButton }: any) => {
  return (
    <ResultsPanel footerButton={footerButton}>
      {children}
    </ResultsPanel>
  );
};

