import { createEquals, fromString, toString } from '../public/module/k8s/selector-requirement';

describe('k8sSelectorRequirement', function() {
  describe('#fromString', function() {
    [
      {
        requirement: {key: 'key1', operator: 'Equals', values: ['value1']},
        string:      'key1=value1'
      },

      {
        requirement: {key: 'key1', operator: 'NotEquals', values: ['value1']},
        string:      'key1!=value1'
      },

      {
        requirement: {key: 'key1', operator: 'Exists', values: []},
        string:      'key1'
      },

      {
        requirement: {key: 'key1', operator: 'DoesNotExist', values: []},
        string:      '!key1'
      },

      {
        requirement: {key: 'key1', operator: 'In', values: ['value1', 'value2']},
        string:      'key1 in (value1,value2)'
      },

      {
        requirement: {key: 'key1', operator: 'NotIn', values: ['value1', 'value2']},
        string:      'key1 notin (value1,value2)'
      },

      {
        requirement: {key: 'key1', operator: 'GreaterThan', values: ['666.999']},
        string:      'key1 > 666.999'
      },

      {
        requirement: {key: 'key1', operator: 'LessThan', values: ['666.999']},
        string:      'key1 < 666.999'
      }
    ].forEach(function (t) {
      it('...', function () {
        expect(fromString(t.string)).toEqual(t.requirement);
      });
    });

    [
      '=',
      'key1=',
      '=value1',
      '!',
      '',
      'key1 in',
      'key1 in (',
      'key1 in (value1',
      'key1 in (value1,',
      'key1 in ,value1',
      'key1 in ,value1)',
      'key1 in [value1,value2]',
      'key1 notin',
      'key1 notin (value1',
      'key1 notin (value1,',
      'key1 notin ,value1',
      'key1 notin ,value1)',
      'key1 between (value1,value2)',
      'key1>',
      'key1>=',
      'key1>one_two_three',
      'key1<',
      'key1<=',
      'key1<one_two_three'
    ].forEach(function (s) {
      it(`returns falsy for unknown/malformed string: ${s}`, function () {
        expect(fromString(s)).toBeFalsy();
      });
    });
  });

  describe('#toString', function() {
    [
      {
        requirement: {key: 'key1', operator: 'Equals', values: ['value1', 'value2']},
        string:      'key1=value1'
      },

      {
        requirement: {key: 'key1', operator: 'NotEquals', values: ['value1', 'value2']},
        string:      'key1!=value1'
      },

      {
        requirement: {key: 'key1', operator: 'Exists', values: ['value1']},
        string:      'key1'
      },

      {
        requirement: {key: 'key1', operator: 'DoesNotExist', values: ['value1']},
        string:      '!key1'
      },

      {
        requirement: {key: 'key1', operator: 'In', values: ['value1', 'value2']},
        string:      'key1 in (value1,value2)'
      },

      {
        requirement: {key: 'key1', operator: 'NotIn', values: ['value1', 'value2']},
        string:      'key1 notin (value1,value2)'
      },

      {
        requirement: {key: 'key1', operator: 'GreaterThan', values: ['666.999']},
        string:      'key1 > 666.999'
      },

      {
        requirement: {key: 'key1', operator: 'LessThan', values: ['666.999']},
        string:      'key1 < 666.999'
      }
    ].forEach(function (t) {
      it(`returns string for ${JSON.stringify(t.requirement)} requirement`, function () {
        expect(toString(t.requirement)).toEqual(t.string);
      });
    });

    it('returns falsy for unknown requirement', function () {
      expect(toString({key: 'key1', operator: 'Oops!', values: ['value1']})).toBeFalsy();
    });
  });

  describe('#createEquals', function() {
    it('returns "Equals" requirement object', function () {
      expect(createEquals('Key', 'Value')).toEqual({
        key:      'Key',
        operator: 'Equals',
        values:   ['Value']
      });
    });
  });
});
