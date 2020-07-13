import { JSONSchema6 } from 'json-schema';
import { hasNoFields, prune } from './utils';
import { SchemaType } from './types';

const OBJECT: JSONSchema6 = {
  type: SchemaType.object,
  properties: {
    test: { type: SchemaType.string },
  },
};

const ARRAY: JSONSchema6 = {
  type: SchemaType.array,
  items: {
    type: SchemaType.string,
  },
};

const ADDITIONAL_PROPERTIES_OBJECT: JSONSchema6 = {
  type: SchemaType.object,
  additionalProperties: { type: SchemaType.string },
};

const NESTED: JSONSchema6 = {
  type: SchemaType.object,
  properties: {
    emptyArray: {
      type: SchemaType.array,
      items: {
        type: SchemaType.object,
        properties: {
          empty: { type: SchemaType.object },
        },
      },
    },
    emptyObject: { type: SchemaType.object },
  },
};

const PRUNE_DATA = {
  abc: {
    '123': {},
  },
  test1: {
    num: NaN,
    str: '',
    bool: null,
  },
  test2: {
    num: NaN,
    str: '',
    bool: null,
  },
  test3: {
    child: {
      grandchild: {},
    },
  },
  test4: {
    arr1: [NaN, '', undefined, null, {}],
    arr2: [],
  },
};

const PRUNE_SAMPLE = {
  test2: {},
  test3: {
    child: {},
  },
  test4: {
    arr1: [],
  },
};

describe('hasNoFields', () => {
  it('Returns true if schema is empty', () => {
    expect(hasNoFields({})).toBeTruthy();
  });

  it('Returns true if schema type is null', () => {
    expect(hasNoFields({ type: 'null' })).toBeTruthy();
  });

  it('Returns true if schema has unsupported properties', () => {
    expect(hasNoFields({ anyOf: [] })).toBeTruthy();
    expect(hasNoFields({ allOf: [] })).toBeTruthy();
    expect(hasNoFields({ oneOf: [] })).toBeTruthy();
  });

  it('Returns true when only additionalItems are provided for object schema type', () => {
    expect(hasNoFields(ADDITIONAL_PROPERTIES_OBJECT)).toBeTruthy();
  });

  it('Returns true when all descendants in nested structure return true', () => {
    expect(hasNoFields(NESTED)).toBeTruthy();
  });

  it('Returns false when a field is defined in the ui schema', () => {
    expect(hasNoFields(ADDITIONAL_PROPERTIES_OBJECT, { 'ui:field': 'Field' })).toBeFalsy();
    expect(hasNoFields(NESTED, { emptyObject: { 'ui:field': 'Field' } })).toBeFalsy();
  });

  it('Returns false when a widget is defined in the ui schema', () => {
    expect(hasNoFields(ADDITIONAL_PROPERTIES_OBJECT, { 'ui:widget': 'Widget' })).toBeFalsy();
    expect(hasNoFields(NESTED, { emptyObject: { 'ui:widget': 'Widget' } })).toBeFalsy();
  });

  it('Returns false for primitive schema type', () => {
    expect(hasNoFields({ type: SchemaType.string })).toBeFalsy();
  });

  it('Returns false for object schema type with properly defined properties', () => {
    expect(hasNoFields(OBJECT)).toBeFalsy();
  });

  it('Returns false for array schema type with properly defined items', () => {
    expect(hasNoFields(ARRAY)).toBeFalsy();
  });
});

describe('prune', () => {
  it('Prunes all empty data when no sample is provided', () => {
    const result = prune(PRUNE_DATA);
    expect(result.abc).toBeUndefined();
    expect(result.test1).toBeUndefined();
    expect(result.test2).toBeUndefined();
    expect(result.test3).toBeUndefined();
    expect(result.test4).toBeUndefined();
  });

  it('Only prunes empty data without explicit empty samples', () => {
    const result = prune(PRUNE_DATA, PRUNE_SAMPLE);
    expect(result.abc).toBeUndefined();
    expect(result.test1).toBeUndefined();
    expect(result.test2).toEqual({});
    expect(result.test3.child).toEqual({});
    expect(result.test4.arr1).toEqual([]);
    expect(result.test4.arr2).toBeUndefined();
  });
});
