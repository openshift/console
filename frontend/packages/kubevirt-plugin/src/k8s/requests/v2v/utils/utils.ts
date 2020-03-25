import { alignWithDNS1123 } from '@console/shared/src';

/**
 * Based on V2V Provider Pod manifest.yaml
 */

const MAX_LEN = 30;

export const getDefaultSecretName = ({ username, url }) => {
  if (!url) {
    throw new Error('VMware URL can not be empty.');
  }
  let resultUrl = url;
  let resultUsername = username;

  if (!resultUrl.startsWith('https://') && !resultUrl.startsWith('http://')) {
    resultUrl = `https://${resultUrl}`;
  }
  const u = new URL(resultUrl);
  resultUsername = resultUsername || 'nousername';

  let user = resultUsername.split('@')[0].substring(0, 15);
  let host = (u.host || 'nohost').substring(0, MAX_LEN - user.length - 1);

  user = alignWithDNS1123(user);
  host = alignWithDNS1123(host);

  user = user || 'nouser';

  return `${user}-${host}`;
};
