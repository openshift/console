describe('k8s.k8sSelector', function() {
  'use strict';

  var k8sSelector;

  beforeEach(module('k8s'));
  beforeEach(inject(function(_k8sSelector_) {
    k8sSelector = _k8sSelector_;
  }));

  describe('#stringifyMatchLabels', function() {
    it('works for one key', function () {
      expect(k8sSelector.stringifyMatchLabels({key: 'value'})).toEqual('key=value');
    });

    it('works for multiple keys', function () {
      expect(k8sSelector.stringifyMatchLabels({key1: 'value1', key2: 'value2'})).toEqual('key1=value1,key2=value2');
    });
  });

  describe('#stringifyMatchExpressions', function() {
    it('works for "Exists" operator', function () {
      expect(k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'Exists'}])).toEqual('key');
    });

    it('works for "DoesNotExist" operator', function () {
      expect(k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'DoesNotExist'}])).toEqual('!key');
    });

    it('works for "In" operator and string value', function () {
      expect(k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'In', values: 'value'}])).toEqual('key in (value)');
    });

    it('works for "In" operator and array value', function () {
      expect(k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'In', values: ['value1', 'value2']}])).toEqual('key in (value1,value2)');
    });

    it('works for "NotIn" operator and string value', function () {
      expect(k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'NotIn', values: 'value'}])).toEqual('key notin (value)');
    });

    it('works for "NotIn" operator and array value', function () {
      expect(k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'NotIn', values: ['value1', 'value2']}])).toEqual('key notin (value1,value2)');
    });

    it('fails for unknown operator', function () {
      expect(function () {
        k8sSelector.stringifyMatchExpressions([{key: 'key', operator: 'UnknownOperator'}]);
      }).toThrowError('unknown operator: UnknownOperator');
    })
  });

  describe('#stringify', function () {
    it('works when both "matchLabels" and "matchExpressions" are given', function () {
      expect(k8sSelector.stringify({
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
      expect(k8sSelector.stringify({
        key1: 'value1',
        key2: 'value2'
      })).toEqual('key1=value1,key2=value2');
    })
  });
});
