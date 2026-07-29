import * as _ from 'lodash';

export const units = {};
export const validate = {};

const TYPES = {
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

export const getType = (name) => {
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

const convertBaseValueToUnits = (value, unitArray, divisor, initialUnit, preferredUnit) => {
  const sliceIndex = initialUnit ? unitArray.indexOf(initialUnit) : 0;
  const units_ = unitArray.slice(sliceIndex);

  if (preferredUnit || preferredUnit === '') {
    const unitIndex = units_.indexOf(preferredUnit);
    if (unitIndex !== -1) {
      return {
        value: value / divisor ** unitIndex,
        unit: preferredUnit,
      };
    }
  }

  let currentValue = value;
  let unit = units_.shift();
  while (currentValue >= divisor && units_.length > 0) {
    currentValue /= divisor;
    unit = units_.shift();
  }
  return { value: currentValue, unit };
};

const convertValueWithUnitsToBaseValue = (value, unitArray, divisor) => {
  const defaultReturn = { value, unit: '' };
  if (typeof value !== 'string') {
    return defaultReturn;
  }

  let units_ = unitArray.slice().reverse();

  // find which unit we're given
  let truncateStringAt = -1;
  const startingUnitIndex = _.findIndex(units_, function (currentUnitValue) {
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
  units_ = units_.slice(startingUnitIndex);
  let currentValue = _.toNumber(value.substring(0, truncateStringAt));

  let unit = units_.shift();
  while (units_.length > 0) {
    currentValue *= divisor;
    unit = units_.shift();
  }

  return { value: currentValue, unit };
};

const getDefaultFractionDigits = (value) => {
  if (value < 1) {
    return 3;
  }
  if (value < 100) {
    return 2;
  }
  return 1;
};

const formatValue = (value, options) => {
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

const round = (value, fractionDigits) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const multiplier = 10 ** (fractionDigits || getDefaultFractionDigits(value));
  return Math.round(value * multiplier) / multiplier;
};
units.round = round;

const humanize = (value, typeName, useRound = false, initialUnit, preferredUnit) => {
  const type = getType(typeName);

  let currentValue = value;
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
units.humanize = humanize;

const formatPercentage = (value, options) => {
  const { locales, ...rest } = _.defaults(
    { style: 'percent' }, // Don't allow perent style to be overridden.
    options,
    {
      maximumFractionDigits: 1,
    },
  );
  return Intl.NumberFormat(locales, rest).format(value);
};

export const humanizeBinaryBytesWithoutB = (v, initialUnit, preferredUnit) =>
  humanize(v, 'binaryBytesWithoutB', true, initialUnit, preferredUnit);
export const humanizeBinaryBytes = (v, initialUnit, preferredUnit) =>
  humanize(v, 'binaryBytes', true, initialUnit, preferredUnit);
export const humanizeDecimalBytes = (v, initialUnit, preferredUnit) =>
  humanize(v, 'decimalBytes', true, initialUnit, preferredUnit);
export const humanizeDecimalBytesPerSec = (v, initialUnit, preferredUnit) =>
  humanize(v, 'decimalBytesPerSec', true, initialUnit, preferredUnit);
export const humanizePacketsPerSec = (v, initialUnit, preferredUnit) =>
  humanize(v, 'packetsPerSec', true, initialUnit, preferredUnit);
export const humanizeNumber = (v, initialUnit, preferredUnit) =>
  humanize(v, 'numeric', true, initialUnit, preferredUnit);
export const humanizeNumberSI = (v, initialUnit, preferredUnit) =>
  humanize(v, 'SI', true, initialUnit, preferredUnit);
export const humanizeSeconds = (v, initialUnit, preferredUnit) =>
  humanize(v, 'seconds', true, initialUnit, preferredUnit);
export const humanizeCpuCores = (v) => {
  const value = v < 1 ? round(v * 1000) : v;
  const unit = v < 1 ? 'm' : '';
  return {
    string: `${formatValue(value)}${unit}`,
    unit,
    value,
  };
};
export const humanizePercentage = (value) => {
  // 2nd check converts -0 to 0.
  let currentValue = value;
  if (!Number.isFinite(currentValue) || currentValue === 0) {
    currentValue = 0;
  }
  return {
    string: formatPercentage(currentValue / 100),
    unit: '%',
    value: round(currentValue, 1),
  };
};

units.dehumanize = (value, typeName) => {
  const type = getType(typeName);
  return convertValueWithUnitsToBaseValue(value, type.units, type.divisor);
};

validate.split = (value) => {
  const index = value.search(/([a-zA-Z]+)/g);
  let number;
  let unit;
  if (index === -1) {
    number = value;
  } else {
    number = value.slice(0, index);
    unit = value.slice(index);
  }
  return [parseFloat(number, 10), unit];
};

const baseUnitedValidation = (value) => {
  if (value === null || value.length === 0) {
    return;
  }
  if (value.search(/\s/g) !== -1) {
    return 'white space is not allowed';
  }
};

const validateNumber = (float = '') => {
  if (float < 0) {
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

validate.CPU = (value = '') => {
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

validate.time = (value = '') => {
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
};

validate.memory = (value = '') => {
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
};

// Convert k8s compute resources values to a base value for comparison.
// If the value has no unit, it just returns the number, so this function
// can be used for any quota resource (resource counts). `units.dehumanize`
// is problematic for comparing quota resources because you need to know
// what unit you're dealing with already (e.g. decimal vs binary). Returns
// null if value isn't recognized as valid.
export const convertToBaseValue = (value) => {
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
    return units.dehumanize(value, 'binaryBytesWithoutB').value;
  }

  if (TYPES.decimalBytesWithoutB.units.includes(unit)) {
    return units.dehumanize(value, 'decimalBytesWithoutB').value;
  }

  // Unrecognized unit.
  return null;
};

const formatToFractionalDigits = (value, digits) =>
  Intl.NumberFormat(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatBytesAsMiB = (bytes) => {
  const mib = bytes / 1024 / 1024;
  return formatToFractionalDigits(mib, 1);
};

export const formatBytesAsGiB = (bytes) => {
  const gib = bytes / 1024 / 1024 / 1024;
  return formatToFractionalDigits(gib, 2);
};

export const formatCores = (cores) => formatToFractionalDigits(cores, 3);
