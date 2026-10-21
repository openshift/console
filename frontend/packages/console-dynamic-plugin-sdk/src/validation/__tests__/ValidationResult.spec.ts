import { ValidationResult } from '../ValidationResult';

const consoleError = jest.spyOn(console, 'error');

beforeEach(() => {
  consoleError.mockReset();
});

describe('ValidationResult', () => {
  describe('addError', () => {
    it('adds the given message to errors', () => {
      const result = new ValidationResult('test');
      expect(result.hasErrors()).toBe(false);
      expect(result.getErrors().length).toBe(0);

      result.addError('foo');
      expect(result.hasErrors()).toBe(true);
      expect(result.getErrors().length).toBe(1);
      expect(result.getErrors()[0]).toBe('foo');
    });
  });

  describe('assertThat', () => {
    it('adds the given message to errors only if the condition is falsy', () => {
      const result = new ValidationResult('test');

      result.assertThat(false, 'foo');
      result.assertThat(!!0, 'bar');
      result.assertThat(true, 'qux');
      result.assertThat(!0, 'mux');

      expect(result.hasErrors()).toBe(true);
      expect(result.getErrors().length).toBe(2);
      expect(result.getErrors()[0]).toBe('foo');
      expect(result.getErrors()[1]).toBe('bar');
    });
  });

  describe('report', () => {
    it('logs formatted errors to console and optionally throws an error', () => {
      const result = new ValidationResult('test');

      result.addError('foo');

      expect(() => {
        result.report(true);
      }).toThrow();

      expect(consoleError).toHaveBeenLastCalledWith(result.formatErrors());

      expect(() => {
        result.report(false);
      }).not.toThrow();

      expect(consoleError).toHaveBeenLastCalledWith(result.formatErrors());
    });

    it('does nothing if the error list is empty', () => {
      const result = new ValidationResult('test');

      expect(() => {
        result.report(true);
        result.report(false);
      }).not.toThrow();

      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});
