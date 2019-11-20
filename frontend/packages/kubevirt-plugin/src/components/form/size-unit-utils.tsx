import { assureEndsWith } from '@console/shared/src';

export enum BinaryUnit {
  B = 'B',
  Ki = 'Ki',
  Mi = 'Mi',
  Gi = 'Gi',
  Ti = 'Ti',
}

export const toIECUnit = (unit: BinaryUnit | string) => assureEndsWith(unit, 'B');
