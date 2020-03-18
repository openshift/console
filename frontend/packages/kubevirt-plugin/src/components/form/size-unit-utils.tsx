import { assureEndsWith } from '@console/shared/src';
import { getStringEnumValues } from '../../utils/types';
import { convertToBaseValue, validate } from '@console/internal/components/utils';

export enum BinaryUnit {
  B = 'B',
  Ki = 'Ki',
  Mi = 'Mi',
  Gi = 'Gi',
  Ti = 'Ti',
}

export const getReasonableUnits = (originalUnit: BinaryUnit) => {
  const result = [BinaryUnit.Mi, BinaryUnit.Gi, BinaryUnit.Ti];
  if (originalUnit === BinaryUnit.B) {
    result.unshift(BinaryUnit.B, BinaryUnit.Ki);
  } else if (originalUnit === BinaryUnit.Ki) {
    result.unshift(BinaryUnit.Ki);
  }
  return result;
};

type Result = {
  value: number;
  unit: BinaryUnit;
  str: string;
};

export const convertToHighestUnit = (value: number, unit: BinaryUnit): Result => {
  const units = getStringEnumValues<BinaryUnit>(BinaryUnit);
  const sliceIndex = units.indexOf(unit);
  const slicedUnits = sliceIndex === -1 ? units : units.slice(sliceIndex);

  let nextValue = value;
  let nextUnit = slicedUnits.shift();
  while (nextValue !== 0 && nextValue % 1024 === 0 && slicedUnits.length > 0) {
    nextValue /= 1024;
    nextUnit = slicedUnits.shift();
  }
  return { value: nextValue, unit: nextUnit, str: `${nextValue}${nextUnit}` };
};

export const convertToBytes = (value: string): number => {
  if (!value || BinaryUnit[value]) {
    return null;
  }

  const result = convertToBaseValue(value);

  if (!result && value.match(/^[0-9.]+B$/)) {
    const [v] = validate.split(value);
    return v;
  }

  return result;
};

export const convertToHighestUnitFromUnknown = (value: string): Result => {
  const result = convertToBytes(value);
  return result && convertToHighestUnit(result, BinaryUnit.B);
};

export const toIECUnit = (unit: BinaryUnit | string) => assureEndsWith(unit, 'B');
