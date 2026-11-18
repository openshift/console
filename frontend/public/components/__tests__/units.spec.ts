import * as _ from 'lodash';
import {
  units,
  validate,
  convertToBaseValue,
  humanizePercentage,
  humanizeBinaryBytes,
} from '../utils/units';

describe('units', () => {
  describe('round', () => {
    const testRound = (n, expected) => {
      it(`${n} into ${expected}`, () => {
        expect(units.round(n)).toEqual(expected);
      });
    };

    testRound(NaN, 0);
    testRound(0.10101, 0.101);
    testRound(0, 0);
    testRound(0.727272, 0.727);
    testRound(1, 1);
    testRound(1.727272, 1.73);
    testRound(9.991234, 9.99);
    testRound(9.999999, 10);
    testRound(10.72727, 10.73);
    testRound(99.99123, 99.99);
    testRound(100, 100);
    testRound(100.10101, 100.1);
    testRound(111.119, 111.1);
    testRound(999.999, 1000);
    testRound(1023.12345, 1023.1);
  });

  describe('should humanize numeric values', () => {
    const testValue = (value, expectedValue, expectedString) => {
      it(`${value} into ${expectedValue}/${expectedString}`, () => {
        const humanized = units.humanize(value, 'numeric', false);
        expect(humanized.value).toEqual(expectedValue);
        expect(humanized.string).toEqual(expectedString); // string is always rounded
      });
    };

    testValue('banana', 0, '0');
    testValue(-1, 0, '0');
    testValue(-0, -0, '0');
    testValue(1 / 0, 0, '0');
    testValue(-1 / 0, 0, '0');
    testValue('100$', 0, '0');
    testValue('1000', 1, '1k');
    testValue(Number.MIN_VALUE, Number.MIN_VALUE, '0');
    testValue(0, 0, '0');
    testValue(0.1234, 0.1234, '0.123');
    testValue(NaN, 0, '0');
    testValue(1, 1, '1');
    testValue(12, 12, '12');
    testValue(123, 123, '123');
    testValue(123.123, 123.123, '123.1');
    testValue(999.999, 999.999, '1,000');
    testValue(1000, 1, '1k');
    testValue(1001, 1.001, '1k');
    testValue(1011, 1.011, '1.01k');
    testValue(5123, 5.123, '5.12k');
    testValue(10000, 10, '10k');
    testValue(10234, 10.234, '10.23k');
    testValue(100000, 100, '100k');
    testValue(1000000, 1, '1m');
    testValue(10000000, 10, '10m');
    testValue(100000000, 100, '100m');
    testValue(1000000000, 1, '1b');
    testValue(10000000000, 10, '10b');
    testValue(100000000000, 100, '100b');
    testValue(1000000000000, 1000, '1,000b');
    testValue(1000000000001, 1000.000000001, '1,000b');
  });

  describe('should humanize percentage values', () => {
    const testValue = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(humanizePercentage(value).string).toEqual(expected);
      });
    };

    testValue('banana', '0%');
    testValue(-1, '-1%');
    testValue(-0, '0%');
    testValue(1 / 0, '0%');
    testValue(-1 / 0, '0%');
    testValue('100$', '0%');
    testValue(Number.MIN_VALUE, '0%');
    testValue(0, '0%');
    testValue(0.1234, '0.1%');
    testValue(NaN, '0%');
    testValue(1, '1%');
    testValue('100', '100%');
    testValue(12, '12%');
    testValue(123, '123%');
    testValue(123.123, '123.1%');
    testValue(999.999, '1,000%');
    testValue(1.0, '1%');
    testValue(1.001, '1%');
    testValue(1.011, '1%');
    testValue(5.123, '5.1%');
    testValue(10.0, '10%');
    testValue(10.234, '10.2%');
    testValue(100, '100%');
    testValue(1000, '1,000%');
    testValue(10000, '10,000%');
    testValue(100000, '100,000%');
    testValue(1000000, '1,000,000%');
    testValue(10000000, '10,000,000%');
    testValue(100000000, '100,000,000%');
    testValue(1000000000, '1,000,000,000%');
    testValue(1000000001, '1,000,000,001%');
  });

  describe('should humanize decimalBytes values', () => {
    const testValue = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'decimalBytes', true).string).toEqual(expected);
      });
    };

    testValue('banana', '0 B');
    testValue(-1, '0 B');
    testValue(-0, '0 B');
    testValue(1 / 0, '0 B');
    testValue(-1 / 0, '0 B');
    testValue('100$', '0 B');
    testValue(Number.MIN_VALUE, '0 B');
    testValue(0, '0 B');
    testValue(NaN, '0 B');
    testValue(1, '1 B');
    testValue(12, '12 B');
    testValue(123, '123 B');
    testValue(123.123, '123.1 B');
    testValue(999.999, '1 KB');
    testValue(1000, '1 KB');
    testValue(1001, '1 KB');
    testValue(1011, '1.01 KB');
    testValue(5123, '5.12 KB');
    testValue(10000, '10 KB');
    testValue(10234, '10.23 KB');
    testValue(100000, '100 KB');
    testValue(1000000, '1 MB');
    testValue(10000000, '10 MB');
    testValue(100000000, '100 MB');
    testValue(1000000000, '1 GB');
    testValue(1000000000000, '1 TB');
    testValue(1000000000000000, '1 PB');
    testValue(1000000000000000000, '1 EB');
    testValue(1000000000000000000000, '1,000 EB');
  });

  describe('should humanize binaryBytes values', () => {
    const testValue = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'binaryBytes', true).string).toEqual(expected);
      });
    };

    testValue('banana', '0 B');
    testValue(-1, '0 B');
    testValue(-0, '0 B');
    testValue(1 / 0, '0 B');
    testValue(-1 / 0, '0 B');
    testValue('100$', '0 B');
    testValue(Number.MIN_VALUE, '0 B');
    testValue(0, '0 B');
    testValue(NaN, '0 B');
    testValue(1, '1 B');
    testValue(12, '12 B');
    testValue(123, '123 B');
    testValue(123.123, '123.1 B');
    testValue(999.999, '1,000 B');
    testValue(1023, '1,023 B');
    testValue(1023.999, '1 KiB');
    testValue(1024, '1 KiB');
    testValue(1025, '1 KiB');
    testValue(1035, '1.01 KiB');
    testValue(5242.88, '5.12 KiB');
    testValue(10240, '10 KiB');
    testValue(10475.52, '10.23 KiB');
    testValue(102400, '100 KiB');
    testValue('1048576', '1 MiB');
    testValue(1048576, '1 MiB');
    testValue(10485760, '10 MiB');
    testValue(104857600, '100 MiB');
    testValue(1073741824, '1 GiB');
    testValue(1099511627776, '1 TiB');
    testValue(1125899906842624, '1 PiB');
    testValue(1152921504606846976, '1 EiB');
  });

  describe('should humanize binaryBytesWithoutB values', () => {
    const testValue = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'binaryBytesWithoutB', true).string).toEqual(expected);
      });
    };

    testValue('banana', '0 i');
    testValue(-1, '0 i');
    testValue(-0, '0 i');
    testValue(1 / 0, '0 i');
    testValue(-1 / 0, '0 i');
    testValue('100$', '0 i');
    testValue(Number.MIN_VALUE, '0 i');
    testValue(0, '0 i');
    testValue(NaN, '0 i');
    testValue(1, '1 i');
    testValue(12, '12 i');
    testValue(123, '123 i');
    testValue(123.123, '123.1 i');
    testValue(999.999, '1,000 i');
    testValue(1023, '1,023 i');
    testValue(1023.999, '1 Ki');
    testValue(1024, '1 Ki');
    testValue(1025, '1 Ki');
    testValue(1035, '1.01 Ki');
    testValue(5242.88, '5.12 Ki');
    testValue(10240, '10 Ki');
    testValue(10475.52, '10.23 Ki');
    testValue(102400, '100 Ki');
    testValue(1048576, '1 Mi');
    testValue(10485760, '10 Mi');
    testValue(104857600, '100 Mi');
    testValue(1073741824, '1 Gi');
    testValue(1099511627776, '1 Ti');
    testValue(1125899906842624, '1 Pi');
    testValue(1152921504606846976, '1 Ei');
  });

  describe('should de-humanize binaryBytesWithoutB values', () => {
    const testValue = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.dehumanize(value, 'binaryBytesWithoutB').value).toEqual(expected);
      });
    };

    testValue('banana', 'banana');
    testValue(-1, -1);
    testValue(-0, -0);
    testValue(0, 0);
    testValue(1 / 0, 1 / 0);
    testValue(-1 / 0, -1 / 0);
    testValue('100$', '100$');
    testValue(Number.MIN_VALUE, Number.MIN_VALUE);
    testValue('0i', 0);
    testValue(NaN, NaN);
    testValue('1i', 1);
    testValue('12i', 12);
    testValue('123i', 123);
    testValue('123.12i', 123.12);
    testValue('999.99i', 999.99);
    testValue('100Ki', 102400);
    testValue('3857916Ki', 3950505984);
    testValue('101Ki', 103424);
    testValue('1.01Ki', 1034.24);
    testValue('5.12Ki', 5242.88);
    testValue('10Ki', 10240);
    testValue('10.23Ki', 10475.52);
    testValue('100Ki', 102400);
    testValue('1Mi', 1048576);
    testValue('10Mi', 10485760);
    testValue('100Mi', 104857600);
    testValue('1Gi', 1073741824);
    testValue('1Ti', 1099511627776);
    testValue('1Pi', 1125899906842624);
    testValue('1Ei', 1152921504606846976);
    testValue('100 i', 100);
    testValue('100 Ki', 102400);
  });

  describe('should de-humanize SI values', () => {
    const testValue = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.dehumanize(value, 'SI').value).toEqual(expected);
      });
    };

    testValue(-1, -1);
    testValue(-0, -0);
    testValue(0, 0);
    testValue(1 / 0, 1 / 0);
    testValue(-1 / 0, -1 / 0);
    testValue(Number.MIN_VALUE, Number.MIN_VALUE);
    testValue('0', 0);
    testValue(NaN, NaN);
    testValue('100k', 100000);
    testValue('1M', 1000000);
  });
});

describe('validate', () => {
  it('memory', () => {
    ['32', '32M', '32Mi', '1Ei'].forEach((v) => {
      expect(validate.memory(v)).toEqual(undefined);
    });

    ['32m', '32 Mi', ' 32Mi', '32Mii', '32e6', '32m4', 'a32m4'].forEach((v) => {
      expect(_.isString(validate.memory(v))).toEqual(true);
    });
  });

  it('cpu', () => {
    ['32', '32m'].forEach((v) => {
      expect(validate.CPU(v)).toEqual(undefined);
    });

    ['-1', '32mi', '32 m', ' 32m', '32mm', '32e6', '32m4', '32M', '32Mi'].forEach((v) => {
      expect(_.isString(validate.CPU(v))).toEqual(true);
    });
  });
  it('time', () => {
    ['32h', '32s', '32m', '1h'].forEach((v) => {
      expect(validate.time(v)).toEqual(undefined);
    });

    ['-1', '32mi', '32 m', ' 32m', '32mm', '32e6', '32m4'].forEach((v) => {
      expect(_.isString(validate.time(v))).toEqual(true);
    });
  });
});

describe('convert to base value', () => {
  const testValue = (value, expected) => {
    it(`${value} into ${expected}`, () => {
      expect(convertToBaseValue(value)).toEqual(expected);
    });
  };

  // invalid values
  testValue(null, null);
  testValue(undefined, null);
  testValue(100, null);
  testValue('', null);
  testValue('banana', null);
  testValue(NaN, null);
  testValue('100mm', null);
  testValue('100MiB', null);
  testValue('100MB', null);
  testValue('invalid100Mi', null);
  testValue('10Mi10Mi', null);

  // unit-less values
  testValue('0', 0);
  testValue('93', 93);
  testValue('10485', 10485);

  // CPU units (millicores)
  testValue('1m', 0.001);
  testValue('10m', 0.01);
  testValue('100m', 0.1);
  testValue('1321m', 1.321);

  // binary memory units
  testValue('3857916Ki', 3950505984);
  testValue('101Ki', 103424);
  testValue('1.01Ki', 1034.24);
  testValue('5.12Ki', 5242.88);
  testValue('10Ki', 10240);
  testValue('10.23Ki', 10475.52);
  testValue('100Ki', 102400);
  testValue('1Mi', 1048576);
  testValue('10Mi', 10485760);
  testValue('100Mi', 104857600);
  testValue('1Gi', 1073741824);
  testValue('1Ti', 1099511627776);
  testValue('1Pi', 1125899906842624);
  testValue('1Ei', 1152921504606846976);

  // decimal memory units
  testValue('1k', 1000);
  testValue('1.01k', 1010);
  testValue('5.12k', 5120);
  testValue('1M', 1000000);
  testValue('10M', 10000000);
  testValue('100M', 100000000);
  testValue('1G', 1000000000);
  testValue('1T', 1000000000000);
  testValue('1P', 1000000000000000);
});

describe('PVC capacity round-trip: convertToBaseValue → humanizeBinaryBytes', () => {
  const testValue = (input, expectedString) => {
    it(`${input} → ${expectedString}`, () => {
      const base = convertToBaseValue(input);
      expect(base).not.toBeNull();
      expect(humanizeBinaryBytes(base).string).toEqual(expectedString);
    });
  };

  // Binary units (K8s standard for storage)
  testValue('1Ki', '1 KiB');
  testValue('100Ki', '100 KiB');
  testValue('1Mi', '1 MiB');
  testValue('512Mi', '512 MiB');
  testValue('1Gi', '1 GiB');
  testValue('3Gi', '3 GiB');
  testValue('100Gi', '100 GiB');
  testValue('1Ti', '1 TiB');
  testValue('3Ti', '3 TiB');
  testValue('10Ti', '10 TiB');
  testValue('1Pi', '1 PiB');
  testValue('1Ei', '1 EiB');

  // Multi-unit equivalences
  testValue('1024Ki', '1 MiB');
  testValue('1024Mi', '1 GiB');
  testValue('1024Gi', '1 TiB');
  testValue('3072Gi', '3 TiB');

  // Decimal units (some CSI drivers may use these)
  testValue('1k', '1,000 B');
  testValue('1M', '976.6 KiB');
  testValue('1G', '953.7 MiB');
  testValue('1T', '931.3 GiB');
});
