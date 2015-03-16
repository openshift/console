describe('core.pkg', function() {
  'use strict';
  var pkg;

  // Load the module.
  beforeEach(module('core.pkg'));

  // Initialize the controller and a mock scope
  beforeEach(inject(function(_pkg_) {
    pkg = _pkg_;
  }));

  describe('isEmpty()', function() {
    it('returns true for empty values', function() {
      var tests = ['', {}, [], NaN, null, undefined];

      tests.forEach(function(t) {
        expect(pkg.isEmpty(t)).toBe(true);
      });
    });

    it('returns false for non-empty values', function() {
      var tests = [' ', 'a', {foo: null}, [''], -1, 0, 1];

      tests.forEach(function(t) {
        expect(pkg.isEmpty(t)).toBe(false);
      });
    });
  });

  describe('allEmpty()', function() {
    it('returns true for objects with all values empty', function() {
      var tests = [{}, {foo: ''}, {foo: null}, {foo: NaN}, {foo: undefined}, {foo: null, bar: undefined}];

      tests.forEach(function(t) {
        expect(pkg.allEmpty(t)).toBe(true);
      });
    });

    it('returns false for objects with any non-empty value', function() {
      var tests = [{foo: ' '}, {foo: 'null'}, {foo: 0}, {foo: -1}, {foo: null, bar: 1}];

      tests.forEach(function(t) {
        expect(pkg.allEmpty(t)).toBe(false);
      });
    });
  });

  describe('propExists()', function() {
    it('returns true if the object contains all nested properties', function() {
      var tests = [
        {
          selector: 'foo',
          obj: { foo: 1 },
        },
        {
          selector: 'foo.bar',
          obj: { foo: { bar: 1 } },
        },
        {
          selector: 'foo.bar.biz',
          obj: { foo: { bar: { biz: null } } },
        },
      ];

      tests.forEach(function(t) {
        expect(pkg.propExists(t.selector, t.obj)).toBe(true);
      });
    });

    it('returns false if the object doesnt contains all nested properties', function() {
      var tests = [
        {
          selector: 'foo',
          obj: null,
        },
        {
          selector: 'foo',
          obj: {},
        },
        {
          selector: '',
          obj: {},
        },
        {
          selector: 'foo',
          obj: { bar: 1 },
        },
        {
          selector: 'foo.bar',
          obj: { foo: {} },
        },
        {
          selector: 'foo.bar',
          obj: { foo: null },
        },
        {
          selector: 'foo.bar',
          obj: { foo: { nope: 1 } },
        },
      ];

      tests.forEach(function(t) {
        expect(pkg.propExists(t.selector, t.obj)).toBe(false);
      });
    });
  });


  describe('join()', function() {
    it('concats strings together', function() {
      var tests = [
        {
          input: ['foo'],
          sep: ', ',
          want: 'foo',
        },
        {
          input: ['foo', 'bar', 'bang'],
          sep: ', ',
          want: 'foo, bar, bang',
        },
      ];

      tests.forEach(function(t) {
        expect(pkg.join(t.input, t.sep)).toBe(t.want);
      });
    });

    it('uses an array of objects predicate function to generate labels', function() {
      var tests = [
        {
          input: [{a: 'a', b: 'b'}],
          fn: function(v) { return v.a + ':' + v.b; },
          sep: ', ',
          want: 'a:b',
        },
        {
          input: [{a: 'a', b: 'b'}, {a: 'c', b: 'd'}],
          fn: function(v) { return v.a + ':' + v.b; },
          sep: ', ',
          want: 'a:b, c:d',
        },
      ];

      tests.forEach(function(t) {
        expect(pkg.join(t.input, t.sep, t.fn)).toBe(t.want);
      });
    });

    it('uses an object predicate function to generate labels', function() {
      function key(v, k) { return k; }
      function val(v, k) { return v; }
      function both(v, k) { return k + ':' + v; }

      var sep = ', ';
      var tests = [
        // simple value return.
        {
          input: { key1: 'val1', key2: 'val2' },
          fn: val,
          sep: sep,
          want: 'val1, val2',
        },
        // simple key return.
        {
          input: { key1: 'val1', key2: 'val2' },
          fn: key,
          sep: sep,
          want: 'key1, key2',
        },
        // combination.
        {
          input: { key1: 'val1', key2: 'val2' },
          fn: both,
          sep: sep,
          want: 'key1:val1, key2:val2',
        },
        // combination, single value
        {
          input: { key1: 'val1' },
          fn: both,
          sep: sep,
          want: 'key1:val1',
        },
      ];

      tests.forEach(function(t) {
        expect(pkg.join(t.input, t.sep, t.fn)).toBe(t.want);
      });
    });

  });

});
