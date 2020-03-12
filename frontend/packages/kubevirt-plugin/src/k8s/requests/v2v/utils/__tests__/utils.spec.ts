import { getDefaultSecretName } from '../utils';

describe('getDefaultSecretName', () => {
  it(`generates provider's secret name correctly`, () => {
    const url = 'https://my.host.com';
    const urlNoProtocol = 'my.host.com';
    const urlSingleDomain = 'my-host';
    const urlLong = 'my-host.with-very-long-url-exceeding-all-reasonable-limits.com';

    const username = 'myuser';
    const usernameNone = undefined;
    const usernameEmpty = '';
    const usernameDomain = 'mydomainuser@domain.com';
    const usernameLong =
      'verylongusernameexceedinglimits@very-long-domain-which-makes-no-sense.com';
    const usernameNonalphanum = '.nonalpha@.-';
    const usernameNonalphanum2 = '.@.-';

    expect(getDefaultSecretName({ username, url })).toEqual('myuser-my-host-com');
    expect(getDefaultSecretName({ username, url: urlNoProtocol })).toEqual('myuser-my-host-com');
    expect(getDefaultSecretName({ username, url: urlSingleDomain })).toEqual('myuser-my-host');
    expect(getDefaultSecretName({ username, url: urlLong })).toEqual(
      'myuser-my-host-with-very-long',
    );

    expect(getDefaultSecretName({ username: usernameNonalphanum, url })).toEqual(
      'nonalpha-my-host-com',
    );
    expect(getDefaultSecretName({ username: usernameNonalphanum2, url })).toEqual(
      'nouser-my-host-com',
    );
    expect(getDefaultSecretName({ username: usernameNone, url })).toEqual('nousername-my-host-com');
    expect(getDefaultSecretName({ username: usernameEmpty, url })).toEqual(
      'nousername-my-host-com',
    );
    expect(getDefaultSecretName({ username: usernameDomain, url })).toEqual(
      'mydomainuser-my-host-com',
    );
    expect(getDefaultSecretName({ username: usernameLong, url })).toEqual(
      'verylongusernam-my-host-com',
    );

    expect(() => getDefaultSecretName({ username, url: undefined })).toThrow();
  });
});
