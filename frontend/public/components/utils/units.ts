import * as _ from 'lodash';

interface UnitType {
  units: string[];
  space: boolean;
  divisor: number;
}

const TYPES: { [name: string]: UnitType } = {
  numeric: {
    units: ['', 'k', 'm', 'b'],
    space: false,
    divisor: 1000,
  },
  decimalBytes: {
    units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'],
    space: true,
    divisor: 1000,
  },
  decimalBytesWithoutB: {
    units: ['', 'k', 'M', 'G', 'T', 'P', 'E'],
    space: true,
    divisor: 1000,
  },
  binaryBytes: {
    units: ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'],
    space: true,
    divisor: 1024,
  },
  binaryBytesWithoutB: {
    units: ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'],
    space: true,
    divisor: 1024,
  },
  SI: {
    units: ['', 'k', 'M', 'G', 'T', 'P', 'E'],
    space: false,
    divisor: 1000,
  },
  decimalBytesPerSec: {
    units: ['Bps', 'KBps', 'MBps', 'GBps', 'TBps', 'PBps', 'EBps'],
    space: true,
    divisor: 1000,
  },
  packetsPerSec: {
    units: ['pps', 'kpps'],
    space: true,
    divisor: 1000,
  },
  seconds: {
    units: ['ns', 'μs', 'ms', 's'],
    space: true,
    divisor: 1000,
  },
};

export const getType = (name: string): UnitType => {
  const type = TYPES[name];
  if (!_.isPlainObject(type)) {
    return {
      units: [],
      space: false,
      divisor: 1000,
    };
  }
  return type;
};

const convertBaseValueToUnits = (
  value: number,
  unitArray: string[],
  divisor: number,
  initialUnit?: string,
  preferredUnit?: string,
) => {
  const sliceIndex = initialUnit ? unitArray.indexOf(initialUnit) : 0;
  const remainingUnits = unitArray.slice(sliceIndex);

  if (preferredUnit || preferredUnit === '') {
    const unitIndex = remainingUnits.indexOf(preferredUnit);
    if (unitIndex !== -1) {
      return {
        value: value / divisor ** unitIndex,
        unit: preferredUnit,
      };
    }
  }

  let currentValue = value;
  let unit = remainingUnits.shift();
  while (currentValue >= divisor && remainingUnits.length > 0) {
    currentValue /= divisor;
    unit = remainingUnits.shift();
  }
  return { value: currentValue, unit };
};

const convertValueWithUnitsToBaseValue = (
  value: string | number,
  unitArray: string[],
  divisor: number,
) => {
  const defaultReturn = { value, unit: '' };
  if (typeof value !== 'string') {
    return defaultReturn;
  }

  let remainingUnits = unitArray.slice().reverse();

  // find which unit we're given
  let truncateStringAt = -1;
  const startingUnitIndex = _.findIndex(remainingUnits, (currentUnitValue) => {
    const index = value.indexOf(currentUnitValue);
    if (index > -1) {
      truncateStringAt = index;
      return true;
    }
    return false;
  });

  if (startingUnitIndex < 0) {
    // can't parse
    return defaultReturn;
  }

  // get the numeric value & prepare unit array for conversion
  remainingUnits = remainingUnits.slice(startingUnitIndex);
  let currentValue = _.toNumber(value.substring(0, truncateStringAt));

  let unit = remainingUnits.shift();
  while (remainingUnits.length > 0) {
    currentValue *= divisor;
    unit = remainingUnits.shift();
  }

  return { value: currentValue, unit };
};

const getDefaultFractionDigits = (value: number) => {
  if (value < 1) {
    return 3;
  }
  if (value < 100) {
    return 2;
  }
  return 1;
};

interface FormatValueOptions {
  locales?: string | string[];
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

const formatValue = (value: number, options?: FormatValueOptions) => {
  const fractionDigits = getDefaultFractionDigits(value);
  const { locales, ...rest } = _.defaults(options, {
    maximumFractionDigits: fractionDigits,
  });

  // 2nd check converts -0 to 0.
  let currentValue = value;
  if (!Number.isFinite(currentValue) || currentValue === 0) {
    currentValue = 0;
  }
  return Intl.NumberFormat(locales, rest).format(currentValue);
};

const round = (value: number, fractionDigits?: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const multiplier = 10 ** (fractionDigits || getDefaultFractionDigits(value));
  return Math.round(value * multiplier) / multiplier;
};

const humanize = (
  value: number | string,
  typeName: string,
  useRound = false,
  initialUnit = undefined,
  preferredUnit = undefined,
) => {
  const type = getType(typeName);

  // Numeric strings are coerced to numbers; non-finite values (including non-numeric strings)
  // are treated as 0.
  let currentValue: number = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(currentValue) || currentValue < 0) {
    currentValue = 0;
  }

  let converted = convertBaseValueToUnits(
    currentValue,
    type.units,
    type.divisor,
    initialUnit,
    preferredUnit,
  );

  if (useRound) {
    converted.value = round(converted.value);
    converted = convertBaseValueToUnits(
      converted.value,
      type.units,
      type.divisor,
      converted.unit,
      preferredUnit,
    );
  }

  const formattedValue = formatValue(converted.value);

  return {
    string: type.space ? `${formattedValue} ${converted.unit}` : formattedValue + converted.unit,
    unit: converted.unit,
    value: converted.value,
  };
};

const dehumanize = (value: string | number, typeName: string) => {
  const type = getType(typeName);
  return convertValueWithUnitsToBaseValue(value, type.units, type.divisor);
};

/**
 * Utilities for formatting and validating quantities with units, e.g. k8s compute resources.
 * Prefer the named `humanize*` helpers where possible.
 */
interface Units {
  round: (value: number, fractionDigits?: number) => number;
  humanize: typeof humanize;
  dehumanize: typeof dehumanize;
}

export const units: Units = {
  round,
  humanize,
  dehumanize,
};

const formatPercentage = (value: number, options?: FormatValueOptions) => {
  const { locales, ...rest } = _.defaults(
    { style: 'percent' as const }, // Don't allow perent style to be overridden.
    options,
    {
      maximumFractionDigits: 1,
    },
  );
  return Intl.NumberFormat(locales, rest).format(value);
};

export const humanizeBinaryBytesWithoutB = (
  v: number,
  initialUnit?: string,
  preferredUnit?: string,
) => humanize(v, 'binaryBytesWithoutB', true, initialUnit, preferredUnit);
export const humanizeBinaryBytes = (v: number, initialUnit?: string, preferredUnit?: string) =>
  humanize(v, 'binaryBytes', true, initialUnit, preferredUnit);
export const humanizeDecimalBytes = (v: number, initialUnit?: string, preferredUnit?: string) =>
  humanize(v, 'decimalBytes', true, initialUnit, preferredUnit);
export const humanizeDecimalBytesPerSec = (
  v: number,
  initialUnit?: string,
  preferredUnit?: string,
) => humanize(v, 'decimalBytesPerSec', true, initialUnit, preferredUnit);
export const humanizePacketsPerSec = (v: number, initialUnit?: string, preferredUnit?: string) =>
  humanize(v, 'packetsPerSec', true, initialUnit, preferredUnit);
export const humanizeNumber = (v: number, initialUnit?: string, preferredUnit?: string) =>
  humanize(v, 'numeric', true, initialUnit, preferredUnit);
export const humanizeNumberSI = (v: number, initialUnit?: string, preferredUnit?: string) =>
  humanize(v, 'SI', true, initialUnit, preferredUnit);
export const humanizeSeconds = (v: number, initialUnit?: string, preferredUnit?: string) =>
  humanize(v, 'seconds', true, initialUnit, preferredUnit);
export const humanizeCpuCores = (v: number) => {
  const value = v < 1 ? round(v * 1000) : v;
  const unit = v < 1 ? 'm' : '';
  return {
    string: `${formatValue(value)}${unit}`,
    unit,
    value,
  };
};
export const humanizePercentage = (value: number | string) => {
  // 2nd check converts -0 to 0.
  let currentValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(currentValue) || currentValue === 0) {
    currentValue = 0;
  }
  return {
    string: formatPercentage(currentValue / 100),
    unit: '%',
    value: round(currentValue, 1),
  };
};

const baseUnitedValidation = (value: string) => {
  if (value === null || value.length === 0) {
    return;
  }
  if (value.search(/\s/g) !== -1) {
    return 'white space is not allowed';
  }
};

const validateNumber = (float: number | string = '') => {
  if (Number(float) < 0) {
    return 'must be positive';
  }
  if (!Number.isFinite(Number(float))) {
    return 'must be a number';
  }
};
const validCPUUnits = new Set(['m', '']);
const validateCPUUnit = (value = '') => {
  if (validCPUUnits.has(value)) {
    return;
  }
  return `unrecongnized unit: ${value}`;
};

const validMemUnits = new Set(['E', 'P', 'T', 'G', 'M', 'k', 'Ei', 'Pi', 'Ti', 'Gi', 'Mi', 'Ki']);
const validateMemUnit = (value = '') => {
  if (validMemUnits.has(value)) {
    return;
  }
  return `unrecongnized unit: ${value}`;
};

const validTimeUnits = new Set(['s', 'm', 'h', 'd', 'M', 'y']);
const validateTimeUnit = (value = '') => {
  if (validTimeUnits.has(value)) {
    return;
  }
  return `unrecongnized unit: ${value}`;
};

interface Validate {
  split: (value: string) => [number, string | undefined];
  CPU: (value?: string) => string | undefined;
  time: (value?: string) => string | undefined;
  memory: (value?: string) => string | undefined;
}

export const validate: Validate = {
  split: (value: string) => {
    const index = value.search(/([a-zA-Z]+)/g);
    let number;
    let unit;
    if (index === -1) {
      number = value;
    } else {
      number = value.slice(0, index);
      unit = value.slice(index);
    }
    return [parseFloat(number), unit];
  },

  CPU: (value = '') => {
    if (!value) {
      return;
    }
    const error = baseUnitedValidation(value);
    if (error) {
      return error;
    }

    const [number, unit] = validate.split(value);

    if (!unit) {
      return validateNumber(number);
    }

    return validateNumber(number) || validateCPUUnit(unit);
  },

  time: (value = '') => {
    if (!value) {
      return;
    }
    const error = baseUnitedValidation(value);
    if (error) {
      return error;
    }

    const [number, unit] = validate.split(value);

    if (!unit) {
      return 'number and unit required';
    }

    return validateNumber(number) || validateTimeUnit(unit);
  },

  memory: (value = '') => {
    if (!value) {
      return;
    }
    const error = baseUnitedValidation(value);
    if (error) {
      return error;
    }

    const [number, unit] = validate.split(value);

    if (!unit) {
      return validateNumber(value);
    }

    return validateNumber(number) || validateMemUnit(unit);
  },
};

// Convert k8s compute resources values to a base value for comparison.
// If the value has no unit, it just returns the number, so this function
// can be used for any quota resource (resource counts). `units.dehumanize`
// is problematic for comparing quota resources because you need to know
// what unit you're dealing with already (e.g. decimal vs binary). Returns
// null if value isn't recognized as valid.
export const convertToBaseValue = (value: string | number): number | null => {
  if (!_.isString(value)) {
    return null;
  }

  const [number, unit] = validate.split(value);
  const validationError = validateNumber(number);
  if (validationError) {
    return null;
  }

  if (!unit) {
    return number;
  }

  // Handle CPU millicores specifically.
  if (unit === 'm') {
    return number / 1000;
  }

  if (TYPES.binaryBytesWithoutB.units.includes(unit)) {
    // The value was validated above, so dehumanize returns a number.
    return units.dehumanize(value, 'binaryBytesWithoutB').value as number;
  }

  if (TYPES.decimalBytesWithoutB.units.includes(unit)) {
    return units.dehumanize(value, 'decimalBytesWithoutB').value as number;
  }

  // Unrecognized unit.
  return null;
};

const formatToFractionalDigits = (value: number, digits: number) =>
  Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatBytesAsMiB = (bytes: number) => {
  const mib = bytes / 1024 / 1024;
  return formatToFractionalDigits(mib, 1);
};

export const formatBytesAsGiB = (bytes: number) => {
  const gib = bytes / 1024 / 1024 / 1024;
  return formatToFractionalDigits(gib, 2);
};

export const formatCores = (cores: number) => formatToFractionalDigits(cores, 3);
