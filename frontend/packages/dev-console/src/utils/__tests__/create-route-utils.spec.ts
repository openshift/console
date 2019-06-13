import {
  hostNameErrorMessages,
  pathErrorMessages,
  validateHostName,
  validatePath,
} from '../create-route-utils';

describe('create-route-utils', () => {
  it('should validate the hostname', () => {
    let hostname = 'host_name';
    let errorMsg = validateHostName(hostname);
    expect(errorMsg).toBe(hostNameErrorMessages.pattern);
    hostname = 'host-name';
    errorMsg = validateHostName(hostname);
    expect(errorMsg).toBe('');
  });

  it('should validate the path', () => {
    let path = 'path';
    let errorMsg = validatePath(path);
    expect(errorMsg).toBe(pathErrorMessages.pattern);
    path = '/path';
    errorMsg = validatePath(path);
    expect(errorMsg).toBe('');
  });
});
