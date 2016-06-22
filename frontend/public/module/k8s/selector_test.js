describe('k8s.k8sSelector', function() {
  'use strict';

  var k8sSelector;

  beforeEach(module('k8s'));
  beforeEach(inject(function(_k8sSelector_) {
    k8sSelector = _k8sSelector_;
  }));

  describe('#fromString', function () {
    it('works for nullable', function () {
      expect(k8sSelector.fromString(null)).toEqual({
        matchLabels:      {},
        matchExpressions: []
      });
    });

    it('works for complex expression', function () {
      expect(k8sSelector.fromString('key1=value1,key2=value2,key3,!key4,key5 in (value5),key6 in (value6.1,value6.2),key7 notin (value7),key8 notin (value8.1,value8.2)')).toEqual({
        matchLabels: {
          key1: 'value1',
          key2: 'value2'
        },

        matchExpressions: [
          {
            key:      'key3',
            operator: 'Exists',
            values:   []
          },

          {
            key:      'key4',
            operator: 'DoesNotExist',
            values:   []
          },

          {
            key:      'key5',
            operator: 'In',
            values:   ['value5']
          },

          {
            key:      'key6',
            operator: 'In',
            values:   ['value6.1', 'value6.2']
          },

          {
            key:      'key7',
            operator: 'NotIn',
            values:   ['value7']
          },

          {
            key:      'key8',
            operator: 'NotIn',
            values:   ['value8.1', 'value8.2']
          }
        ]
      });
    });
  });

  describe('#toRequirements', function () {
    it('returns empty list given selector as undefined value', function () {
      expect(k8sSelector.toRequirements(undefined)).toEqual([]);
    });
  });

  describe('#fromRequirements', function () {
    it('returns undefined given no requirements and undefinedWhenEmpty option', function () {
      expect(k8sSelector.fromRequirements([], {undefinedWhenEmpty: true})).toBeUndefined();
    });
  });

  describe('#toString', function () {
    it('works when both "matchLabels" and "matchExpressions" are given', function () {
      expect(k8sSelector.toString({
        matchLabels: {
          key1: 'value1',
          key2: 'value2'
        },

        matchExpressions: [
          {
            key:      'key3',
            operator: 'Exists'
          },

          {
            key:      'key4',
            operator: 'DoesNotExist'
          },

          {
            key:      'key5',
            operator: 'In',
            values:   'value5'
          },

          {
            key:      'key6',
            operator: 'In',
            values:   ['value6.1', 'value6.2']
          },

          {
            key:      'key7',
            operator: 'NotIn',
            values:   'value7'
          },

          {
            key:      'key8',
            operator: 'NotIn',
            values:   ['value8.1', 'value8.2']
          }
        ]
      })).toEqual('key1=value1,key2=value2,key3,!key4,key5 in (value5),key6 in (value6.1,value6.2),key7 notin (value7),key8 notin (value8.1,value8.2)')
    });

    it('works when V1 selector is given', function () {
      expect(k8sSelector.toString({
        key1: 'value1',
        key2: 'value2'
      })).toEqual('key1=value1,key2=value2');
    })
  });
});
