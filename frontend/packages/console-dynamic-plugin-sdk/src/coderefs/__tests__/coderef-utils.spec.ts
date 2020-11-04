import { executeReferencedFunction } from '../coderef-utils';

describe('executeReferencedFunction', () => {
  it('executes the referenced function with given args and returns its result', async () => {
    const func = jest.fn(() => 'value');
    const args = ['foo', true, { bar: [1, 'qux'] }];
    const ref = jest.fn(() => Promise.resolve(func));

    const result = await executeReferencedFunction(ref, ...args);

    expect(ref).toHaveBeenCalledWith();
    expect(func).toHaveBeenCalledWith(...args);
    expect(result).toBe('value');
  });

  it('returns null when the referenced object is not a function', async () => {
    const args = ['foo', true, { bar: [1, 'qux'] }];
    const ref = jest.fn(() => Promise.resolve('value'));

    const result = await executeReferencedFunction(ref, ...args);

    expect(ref).toHaveBeenCalledWith();
    expect(result).toBe(null);
  });

  it('returns null when the referenced function throws an error', async () => {
    const func = jest.fn(() => {
      throw new Error('boom');
    });
    const args = ['foo', true, { bar: [1, 'qux'] }];
    const ref = jest.fn(() => Promise.resolve(func));

    const result = await executeReferencedFunction(ref, ...args);

    expect(ref).toHaveBeenCalledWith();
    expect(func).toHaveBeenCalledWith(...args);
    expect(result).toBe(null);
  });
});
