import { DamType } from '../core/types/DamType';

import { useGravityDamSimulation } from '../dams/gravidade/hooks/useGravityDamSimulation';
import { useEarthRockfillDamSimulation } from '../dams/terra_enrocamento/hooks/useEarthRockfillDamSimulation';
import { useArchDamSimulation } from '../dams/arco/hooks/useArchDamSimulation';
import { useButtressDamSimulation } from '../dams/contraforte/hooks/useButtressDamSimulation';

import { GravityDam2DView } from '../dams/gravidade/components/GravityDam2DView';
import { GravityDam3DView } from '../dams/gravidade/components/GravityDam3DView';

import { EarthRockfillDam2DView } from '../dams/terra_enrocamento/components/EarthRockfillDam2DView';
import { EarthRockfillDam3DView } from '../dams/terra_enrocamento/components/EarthRockfillDam3DView';

import { ArchDam2DView } from '../dams/arco/components/ArchDam2DView';
import { ArchDam3DView } from '../dams/arco/components/ArchDam3DView';

import { ButtressDam2DView } from '../dams/contraforte/components/ButtressDam2DView';
import { ButtressDam3DView } from '../dams/contraforte/components/ButtressDam3DView';

const round = (v: number) => Math.round(v * 10) / 10;

export const damTypeRegistry = {
  [DamType.GRAVITY]: {
    label: 'Gravidade',
    useSimulation: useGravityDamSimulation,
    component2D: GravityDam2DView,
    component3D: GravityDam3DView,
    getDefaults: (h: number) => ({
      inclinationAngle: 90,
      damBaseWidth: round(h * 0.8),
      damCrestWidth: round(h * 0.2),
    }),
  },

  [DamType.EMBANKMENT]: {
    label: 'Terra / Enrocamento',
    useSimulation: useEarthRockfillDamSimulation,
    component2D: EarthRockfillDam2DView,
    component3D: EarthRockfillDam3DView,
    getDefaults: (h: number) => ({
      inclinationAngle: 25,
      damBaseWidth: round(h * 3),
      damCrestWidth: round(h * 0.4),
    }),
  },

  [DamType.ARCH]: {
    label: 'Arco',
    useSimulation: useArchDamSimulation,
    component2D: ArchDam2DView,
    component3D: ArchDam3DView,
    getDefaults: (h: number) => ({
      inclinationAngle: 90,
      damBaseWidth: round(h * 0.25),
      damCrestWidth: round(h * 0.1),
    }),
  },

  [DamType.BUTTRESS]: {
    label: 'Contraforte',
    useSimulation: useButtressDamSimulation,
    component2D: ButtressDam2DView,
    component3D: ButtressDam3DView,
    getDefaults: (h: number) => ({
      inclinationAngle: 55,
      damBaseWidth: round(h * 0.8),
      damCrestWidth: round(h * 0.1),
    }),
  },
};