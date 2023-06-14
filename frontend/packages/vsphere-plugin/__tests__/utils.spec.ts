/* eslint-disable @typescript-eslint/no-var-requires */
import { ConnectionFormContextValues } from '../src/components/types';
import { mergeCloudProviderConfig } from '../src/components/utils';

const config: ConnectionFormContextValues = {
  username: 'my-username',
  password: 'my-password',
  vcenter: 'https://1.2.3.4/something',
  datacenter: 'my-datacenter',
  defaultDatastore: 'my-default-ds',
  folder: '/my/folder',
  vCenterCluster: 'foo-cluster',
};

describe('mergeCloudProviderConfig', () => {
  it('handles empty input', () => {
    const result = mergeCloudProviderConfig('', config);
    expect(result).toMatchSnapshot();
  });

  it('deletes old Virtual Center', () => {
    const result = mergeCloudProviderConfig(
      '[Global]\n[Workspace]\nfoo=bar\nfoofoo=barbar\n[VirtualCenter "https://will/be/replaced"]',
      config,
    );
    expect(result).toMatchSnapshot(result);
  });
});
