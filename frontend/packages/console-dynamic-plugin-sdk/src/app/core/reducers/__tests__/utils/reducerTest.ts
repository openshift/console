const deepFreeze = <T extends object>(obj: T): Readonly<T> => {
  Object.freeze(obj);
  Object.keys(obj).forEach((prop) => {
    if (
      obj[prop] !== null &&
      (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
};

const reducerTest = (reducer: Function, state: object, action: { type: string; payload?: any }) => {
  deepFreeze(state);
  return {
    expectVal(expectedValue) {
      const result = reducer(state, action);

      if (typeof expectedValue === 'function') {
        expectedValue(result, state);
      } else {
        expect(result).toEqual(expectedValue);
      }
    },
  };
};

export default reducerTest;
