import { createEquals, requirementFromString, requirementToString } from '../public/module/k8s/selector-requirement';

describe('k8sSelectorRequirement', () => {
  describe('#requirementFromString', () => {
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
    ].forEach(t => {
      it('...', () => expect(requirementFromString(t.string)).toEqual(t.requirement));
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
    ].forEach(s => {
      it(`returns falsy for unknown/malformed string: ${s}`, () => expect(requirementFromString(s)).toBeFalsy());
    });
  });

  describe('#requirementToString', () => {
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
    ].forEach(t => {
      it(`returns string for ${JSON.stringify(t.requirement)} requirement`, () => {
        expect(requirementToString(t.requirement)).toEqual(t.string);
      });
    });

    it('returns falsy for unknown requirement', () => {
      expect(requirementToString({key: 'key1', operator: 'Oops!', values: ['value1']})).toBeFalsy();
    });
  });

  describe('#createEquals', () => {
    it('returns "Equals" requirement object', () => {
      expect(createEquals('Key', 'Value')).toEqual({
        key:      'Key',
        operator: 'Equals',
        values:   ['Value']
      });
    });
  });
});
