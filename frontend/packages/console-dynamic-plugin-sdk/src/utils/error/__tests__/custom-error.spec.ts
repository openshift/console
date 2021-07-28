import { CustomError } from '../custom-error';
import { checkProtoChain, checkProperties } from './test-utils';

describe(`CustomError`, () => {
  it('Should have original Error instance', () => checkProtoChain(CustomError, Error));

  it('Should have correct properties', () =>
    checkProperties(new CustomError('my message'), {
      name: 'CustomError',
      message: 'my message',
    }));

  it('Should have correct properties without message', () =>
    checkProperties(new CustomError(), {
      name: 'CustomError',
      message: '',
    }));

  it('Should have correct properties when extended', () => {
    class SubError extends CustomError {}
    checkProtoChain(SubError, CustomError, Error);
    checkProperties(new SubError('test message'), {
      name: 'SubError',
      message: 'test message',
    });
  });

  it('Should have correct properties when extended with name', () => {
    class RenamedError extends CustomError {
      constructor(name: string, message?: string) {
        super(message);
        Object.defineProperty(this, 'name', { value: name });
      }
    }
    checkProtoChain(RenamedError, CustomError, Error);
    checkProperties(new RenamedError('test', 'test message'), {
      name: 'test',
      message: 'test message',
    });
  });

  it('Should work correctly with native log behaviour', () =>
    expect(`${new CustomError('Hello')}`).toMatch('CustomError: Hello'));
});
