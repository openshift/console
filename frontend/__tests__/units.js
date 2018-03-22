import * as _ from 'lodash-es';

import { units, validate } from '../public/components/utils/units';

describe('units', () => {
  describe('round', () => {
    const testRound = (n, expected) => {
      it(`${n} into ${expected}`, () => {
        expect(units.round(n)).toEqual(expected);
      });
    };

    testRound(NaN, 0);
    testRound(.101010, .101);
    testRound(0, 0);
    testRound(0.727272, .727);
    testRound(1, 1);
    testRound(1.727272, 1.73);
    testRound(9.991234, 9.99);
    testRound(9.999999, 10);
    testRound(10.72727, 10.73);
    testRound(99.99123, 99.99);
    testRound(100, 100);
    testRound(100.101010, 100.10);
    testRound(111.119, 111.1);
    testRound(999.999, 1000);
    testRound(1023.12345, 1023.1);
  });

  describe('should humanize numeric values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'numeric', false).string).toEqual(expected);
      });
    };

    test_('banana', '0');
    test_(-1, '-1');
    test_(-0, '0');
    test_(1/0, '0');
    test_(-1/0, '0');
    test_('100$', '0');
    test_(Number.MIN_VALUE, '5e-324');
    test_(0, '0');
    test_(0.1234, '0.1234');
    test_(NaN, '0');
    test_(1, '1');
    test_(12, '12');
    test_(123, '123');
    test_(123.123, '123.123');
    test_(999.999, '999.999');
    test_(1000, '1k');
    test_(1001, '1.001k');
    test_(1011, '1.011k');
    test_(5123, '5.123k');
    test_(10000, '10k');
    test_(10234, '10.234k');
    test_(100000, '100k');
    test_(1000000, '1m');
    test_(10000000, '10m');
    test_(100000000, '100m');
    test_(1000000000, '1b');
    test_(10000000000, '10b');
    test_(100000000000, '100b');
    test_(1000000000000, '1000b');
    test_(1000000000001, '1000.000000001b');
  });

  describe('should humanize percentage values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'percentage', false).string).toEqual(expected);
      });
    };

    test_('banana', '0%');
    test_(-1, '-1%');
    test_(-0, '0%');
    test_(1/0, '0%');
    test_(-1/0, '0%');
    test_('100$', '0%');
    test_(Number.MIN_VALUE, '5e-324%');
    test_(0, '0%');
    test_(0.1234, '0.1234%');
    test_(NaN, '0%');
    test_(1, '1%');
    test_(12, '12%');
    test_(123, '123%');
    test_(123.123, '123.123%');
    test_(999.999, '999.999%');
    test_(1.000, '1%');
    test_(1.001, '1.001%');
    test_(1.011, '1.011%');
    test_(5.123, '5.123%');
    test_(10.000, '10%');
    test_(10.234, '10.234%');
    test_(100, '100%');
    test_(1000, '1000%');
    test_(10000, '10000%');
    test_(100000, '100000%');
    test_(1000000, '1000000%');
    test_(10000000, '10000000%');
    test_(100000000, '100000000%');
    test_(1000000000, '1000000000%');
    test_(1000000001, '1000000001%');
  });

  describe('should humanize decimalBytes values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'decimalBytes', true).string).toEqual(expected);
      });
    };

    test_('banana', '0 B');
    test_(-1, '-1 B');
    test_(-0, '0 B');
    test_(1/0, '0 B');
    test_(-1/0, '0 B');
    test_('100$', '0 B');
    test_(Number.MIN_VALUE, '0 B');
    test_(0, '0 B');
    test_(NaN, '0 B');
    test_(1, '1 B');
    test_(12, '12 B');
    test_(123, '123 B');
    test_(123.123, '123.1 B');
    test_(999.999, '1 KB');
    test_(1000, '1 KB');
    test_(1001, '1 KB');
    test_(1011, '1.01 KB');
    test_(5123, '5.12 KB');
    test_(10000, '10 KB');
    test_(10234, '10.23 KB');
    test_(100000, '100 KB');
    test_(1000000, '1 MB');
    test_(10000000, '10 MB');
    test_(100000000, '100 MB');
    test_(1000000000, '1 GB');
    test_(1000000000000, '1 TB');
    test_(1000000000000000, '1 PB');
    test_(1000000000000000000, '1 EB');
    test_(1000000000000000000000, '1000 EB');
  });

  describe('should humanize binaryBytes values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'binaryBytes', true).string).toEqual(expected);
      });
    };

    test_('banana', '0 B');
    test_(-1, '-1 B');
    test_(-0, '0 B');
    test_(1/0, '0 B');
    test_(-1/0, '0 B');
    test_('100$', '0 B');
    test_(Number.MIN_VALUE, '0 B');
    test_(0, '0 B');
    test_(NaN, '0 B');
    test_(1, '1 B');
    test_(12, '12 B');
    test_(123, '123 B');
    test_(123.123, '123.1 B');
    test_(999.999, '1000 B');
    test_(1023, '1023 B');
    test_(1023.999, '1 KiB');
    test_(1024, '1 KiB');
    test_(1025, '1 KiB');
    test_(1035, '1.01 KiB');
    test_(5242.88, '5.12 KiB');
    test_(10240, '10 KiB');
    test_(10475.52, '10.23 KiB');
    test_(102400, '100 KiB');
    test_(1048576, '1 MiB');
    test_(10485760, '10 MiB');
    test_(104857600, '100 MiB');
    test_(1073741824, '1 GiB');
    test_(1099511627776, '1 TiB');
    test_(1125899906842624, '1 PiB');
  });

  describe('should humanize binaryBytesWithoutB values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.humanize(value, 'binaryBytesWithoutB', true).string).toEqual(expected);
      });
    };

    test_('banana', '0 i');
    test_(-1, '-1 i');
    test_(-0, '0 i');
    test_(1/0, '0 i');
    test_(-1/0, '0 i');
    test_('100$', '0 i');
    test_(Number.MIN_VALUE, '0 i');
    test_(0, '0 i');
    test_(NaN, '0 i');
    test_(1, '1 i');
    test_(12, '12 i');
    test_(123, '123 i');
    test_(123.123, '123.1 i');
    test_(999.999, '1000 i');
    test_(1023, '1023 i');
    test_(1023.999, '1 Ki');
    test_(1024, '1 Ki');
    test_(1025, '1 Ki');
    test_(1035, '1.01 Ki');
    test_(5242.88, '5.12 Ki');
    test_(10240, '10 Ki');
    test_(10475.52, '10.23 Ki');
    test_(102400, '100 Ki');
    test_(1048576, '1 Mi');
    test_(10485760, '10 Mi');
    test_(104857600, '100 Mi');
    test_(1073741824, '1 Gi');
    test_(1099511627776, '1 Ti');
    test_(1125899906842624, '1 Pi');
  });

  describe('should de-humanize binaryBytesWithoutB values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.dehumanize(value, 'binaryBytesWithoutB').value).toEqual(expected);
      });
    };

    test_('banana', 'banana');
    test_(-1, -1);
    test_(-0, -0);
    test_(0, 0);
    test_(1/0, 1/0);
    test_(-1/0, -1/0);
    test_('100$', '100$');
    test_(Number.MIN_VALUE, Number.MIN_VALUE);
    test_('0i', 0);
    test_(NaN, NaN);
    test_('1i', 1);
    test_('12i', 12);
    test_('123i', 123);
    test_('123.12i', 123.12);
    test_('999.99i', 999.99);
    test_('100Ki', 102400);
    test_('3857916Ki', 3950505984);
    test_('101Ki', 103424);
    test_('1.01Ki', 1034.24);
    test_('5.12Ki', 5242.88);
    test_('10Ki', 10240);
    test_('10.23Ki', 10475.52);
    test_('100Ki', 102400);
    test_('1Mi', 1048576);
    test_('10Mi', 10485760);
    test_('100Mi', 104857600);
    test_('1Gi', 1073741824);
    test_('1Ti', 1099511627776);
    test_('1Pi', 1125899906842624);
    test_('100 i', 100);
    test_('100 Ki', 102400);
  });

  describe('should de-humanize SI values', () => {
    const test_ = (value, expected) => {
      it(`${value} into ${expected}`, () => {
        expect(units.dehumanize(value, 'SI').value).toEqual(expected);
      });
    };

    test_(-1, -1);
    test_(-0, -0);
    test_(0, 0);
    test_(1/0, 1/0);
    test_(-1/0, -1/0);
    test_(Number.MIN_VALUE, Number.MIN_VALUE);
    test_('0', 0);
    test_(NaN, NaN);
    test_('100K', 100000);
    test_('1M', 1000000);
  });
});

describe('validate', () => {
  it('memory', () => {
    ['32', '32M', '32Mi'].forEach(v => {
      expect(validate.memory(v)).toEqual(undefined);
    });

    ['32m','32 Mi', ' 32Mi', '32Mii', '32e6', '32m4', 'a32m4'].forEach(v => {
      expect(_.isString(validate.memory(v))).toEqual(true);
    });
  });

  it('cpu', () => {
    ['32', '32m', '32K'].forEach(v => {
      expect(validate.CPU(v)).toEqual(undefined);
    });

    ['-1', '32mi','32 m', ' 32m', '32mm', '32e6', '32m4'].forEach(v => {
      expect(_.isString(validate.CPU(v))).toEqual(true);
    });
  });
  it('time', () => {
    ['32h', '32s', '32m', '1h'].forEach(v => {
      expect(validate.time(v)).toEqual(undefined);
    });

    ['-1', '32mi','32 m', ' 32m', '32mm', '32e6', '32m4'].forEach(v => {
      expect(_.isString(validate.time(v))).toEqual(true);
    });
  });
});

