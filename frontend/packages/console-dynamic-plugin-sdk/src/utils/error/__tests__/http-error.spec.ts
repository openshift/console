import { CustomError } from '../custom-error';
import { HttpError } from '../http-error';
import { checkProtoChain, checkProperties } from './test-utils';

describe('HttpError', () => {
  it('Should have correct instance and properties for HttpError', () => {
    checkProtoChain(HttpError, CustomError, Error);
    checkProperties(
      new HttpError('test message', 404, null, { statusText: 'some status message' }),
      {
        name: 'HttpError',
        code: 404,
        message: 'test message',
        json: { statusText: 'some status message' },
      },
    );
  });
});
