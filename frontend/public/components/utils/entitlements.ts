import { pluralize } from './details-page';

export const entitlementTitles = {
  nodes: {
    uppercase: 'Node',
    lowercase: 'node',
    inPairs: false,
  },
  vCPUs: {
    uppercase: 'vCPU',
    lowercase: 'vCPU',
    inPairs: true,
  },
  sockets: {
    uppercase: 'Socket',
    lowercase: 'socket',
    inPairs: true,
  },
};

export const entitlementTitle = (name, count) => {
  const entitlement = entitlementTitles[name];
  if (!entitlement) {
    return 'Tectonic';
  }

  let title = entitlement.uppercase;
  if (entitlement.inPairs) {
    title = `${title} Pair`;
    count = Math.floor(count / 2);
  }

  return pluralize(count, title);
};
