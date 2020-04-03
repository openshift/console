import { humanizeBinaryBytes } from '@console/internal/components/utils';

export const breakdownData = {
  top5: [
    {
      x: 1,
      y: 10 * 1000, // 10 MiB
      label: 'First Data',
      metric: { namespace: 'default' },
    },
    {
      x: 2,
      y: 20 * 1000, // 20 MiB
      label: 'First Data',
      metric: { namespace: 'default' },
    },
    {
      x: 3,
      y: 30 * 1000, // 30 MiB
      label: 'First Data',
      metric: { namespace: 'default' },
    },
    {
      x: 4,
      y: 40 * 1000, // 40 MiB
      label: 'First Data',
      metric: { namespace: 'default' },
    },
    {
      x: 5,
      y: 50 * 1000, // 50 MiB
      label: 'First Data',
      metric: { namespace: 'default' },
    },
  ],
  capacityTotal: '10000000',
  metricTotal: '10000000',
  capacityUsed: '150000',
  humanize: humanizeBinaryBytes,
  fakeModel: {
    abbr: 'fk',
    kind: 'fake',
    label: 'Fake',
    labelPlural: 'Fakes',
    plural: 'fakes',
    apiVersion: 'v1',
  },
};
