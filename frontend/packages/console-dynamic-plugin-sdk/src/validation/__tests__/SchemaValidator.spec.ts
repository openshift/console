import * as Ajv from 'ajv';
import { SchemaValidator } from '../SchemaValidator';

const getAjvMocks = (): [Ajv.Ajv, jest.Mock<any>] => {
  const validate = jest.fn();

  const ajv = {} as Ajv.Ajv;
  ajv.validate = validate;

  return [ajv, validate];
};

describe('SchemaValidator', () => {
  describe('validate', () => {
    it('does nothing if ajv.validate returns truthy value', () => {
      const [ajv, ajvValidate] = getAjvMocks();
      ajvValidate.mockImplementation(() => true);

      const schema = { description: 'dummy schema' };
      const data = { foo: true, bar: [1, 'qux'] };

      const result = new SchemaValidator('test', ajv).validate(schema, data, 'foo');

      expect(result.hasErrors()).toBe(false);
      expect(ajvValidate).toHaveBeenCalledWith(schema, data);
    });

    it('adds ajv.errors to validation result if ajv.validate returns falsy value', () => {
      const [ajv, ajvValidate] = getAjvMocks();
      ajvValidate.mockImplementation(() => {
        ajv.errors = [
          { dataPath: '.x', message: 'test message for path x' },
          { dataPath: '.y', message: 'test message for path y' },
        ] as Ajv.ErrorObject[];
        return false;
      });

      const schema = { description: 'dummy schema' };
      const data = { foo: true, bar: [1, 'qux'] };

      const result = new SchemaValidator('test', ajv).validate(schema, data, 'foo');

      expect(result.hasErrors()).toBe(true);
      expect(result.getErrors().length).toBe(2);
      expect(result.getErrors()[0]).toBe('foo.x test message for path x');
      expect(result.getErrors()[1]).toBe('foo.y test message for path y');
      expect(ajvValidate).toHaveBeenCalledWith(schema, data);
    });
  });
});
