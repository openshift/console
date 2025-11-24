import { PodStatus } from '@console/internal/module/k8s';
import { getRenderContainers } from '../logs-utils';
import { podData } from './logs-test-data';

describe('logs utils', () => {
  it('should return container and still fetching as false when logs completed', () => {
    const { containers, stillFetching } = getRenderContainers(podData);
    expect(stillFetching).toBe(false);
    expect(containers).toHaveLength(1);
  });

  it('should return container and still fetching as true when logs are not completed', () => {
    const { metadata, spec } = podData;
    const resource = {
      metadata,
      spec,
      status: {
        containerStatuses: [
          {
            name: 'step-oc',
            state: {
              running: {},
            },
            lastState: {},
          },
        ],
      } as PodStatus,
    };
    const { containers, stillFetching } = getRenderContainers(resource);
    expect(containers).toHaveLength(1);
    expect(stillFetching).toBe(true);
  });
});
