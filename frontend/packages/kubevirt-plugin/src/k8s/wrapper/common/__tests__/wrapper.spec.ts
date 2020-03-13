import { TestWrapper, TestData } from './mocks/test-wrapper';

describe('Wrapper methods', () => {
  let testData: TestData = null;

  beforeEach(() => {
    testData = {
      color: 'blue',
      interval: {
        from: 5,
        to: 9,
      },
    };
  });

  it('does not clone by default', () => {
    expect(new TestWrapper(testData).asResource()).toBe(testData);
  });

  it('clones from constructor', () => {
    expect(new TestWrapper(testData, true).asResource()).not.toBe(testData);
  });

  it('clones as resource', () => {
    expect(new TestWrapper(testData).asResource(true)).not.toBe(testData);
  });

  it('mergeWith', () => {
    const testWrapper = new TestWrapper(testData);
    const result = testWrapper.mergeWith(new TestWrapper({ color: 'red', location: 'forest' }));

    expect(result).toBe(testWrapper);

    const resultData = result.asResource();
    expect(resultData.color).toBe('red');
    expect(resultData.interval.from).toBe(5);
    expect(resultData.interval.to).toBe(9);
    expect(resultData.location).toBe('forest');
  });

  it('clearIfEmpty', () => {
    const uncheckedTestData = testData as any;
    uncheckedTestData.interval.emptyArray = [];
    uncheckedTestData.interval.emptyObject = {};
    uncheckedTestData.interval.emptyObject2 = {};
    uncheckedTestData.emptyArray2 = [];
    uncheckedTestData.emptyObject3 = {};

    const testWrapper = new TestWrapper(uncheckedTestData);
    (testWrapper as any)
      .clearIfEmpty('interval.emptyArray')
      .clearIfEmpty(['interval', 'emptyObject2'])
      .clearIfEmpty('emptyObject3');

    expect(testWrapper.asResource()).toEqual({
      color: 'blue',
      interval: {
        emptyObject: {},
        from: 5,
        to: 9,
      },
      emptyArray2: [],
    });
  });
});
