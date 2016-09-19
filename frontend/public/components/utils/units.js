const TYPES = {
  numeric: {
    units: ['', 'k', 'm', 'b'],
    space: false,
    divisor: 1000
  },
  percentage: {
    units: ['%'],
    space: false,
    divisor: 1000
  },
  decimalBytes: {
    units: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'],
    space: true,
    divisor: 1000
  },
  binaryBytes: {
    units: ['iB', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'],
    space: true,
    divisor: 1024
  },
  binaryBytesWithoutB: {
    units: ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei'],
    space: true,
    divisor: 1024
  }
};

const getType = (name) => {
  const type = TYPES[name];
  if (!_.isPlainObject(type)) {
    return {
      units: [],
      space: false,
      divisor: 1000
    }
  }
  return type;
}

const convertBaseValueToUnits = (value, unitArray, divisor, initialUnit) => {
  let sliceIndex = initialUnit ? unitArray.indexOf(initialUnit) : 0;
  let units = unitArray.slice(sliceIndex);
  let unit = units.shift();
  while (value >= divisor && units.length > 0) {
    value = value / divisor;
    unit = units.shift();
  }
  return { value, unit }
}

const convertValueWithUnitsToBaseValue = (value, unitArray, divisor) => {
  const defaultReturn = { value, unit: '' };
  if (typeof value !== 'string') {
    return defaultReturn;
  }

  let units = unitArray.slice().reverse();

  // find which unit we're given
  let truncateStringAt = -1;
  let startingUnitIndex = _.findIndex(units, function(currentUnitValue) {
    const index = value.indexOf(currentUnitValue);
    if (index > -1) {
      truncateStringAt = index;
      return true;
    }
    return false;
  });
  if (startingUnitIndex <= 0) {
    // can't parse
    return defaultReturn;
  }

  // get the numeric value & prepare unit array for conversion
  units = units.slice(startingUnitIndex);
  value = value.substring(0, truncateStringAt);
  value = _.toNumber(value);

  let unit = units.shift();
  while (units.length > 0) {
    value = value * divisor;
    unit = units.shift();
  };

  return { value, unit };
}

const round = (value) => {
  if (!isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
}

const humanize = (value, typeName, useRound = false) => {
  const type = getType(typeName);

  if (!isFinite(value)) {
    value = 0;
  }

  let converted = convertBaseValueToUnits(value, type.units, type.divisor);

  if (useRound) {
    converted.value = round(converted.value);
    converted = convertBaseValueToUnits(converted.value, type.units, type.divisor, converted.unit);
  }

  if (type.space && converted.unit.length > 0) {
    converted.unit = ' ' + converted.unit;
  }

  return {
    string: converted.value + converted.unit,
    value: converted.value,
    unit: converted.unit
  };
}

const dehumanize = (value, typeName) => {
  const type = getType(typeName);

  return convertValueWithUnitsToBaseValue(value, type.units, type.divisor);
}

const units = {
  round,
  humanize,
  dehumanize
};

export default units;

// This is temporary! See notes in public/components/_test.js
window.tectonicTesting && (window.tectonicTesting.units = units);
