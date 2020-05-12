import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { getKnativeRoutesLinks } from '../resource-overview-utils';

describe('resource overview utils', () => {
  const multipleRevisionsData = {
    ...MockKnativeResources.ksroutes.data[0],
    status: {
      ...MockKnativeResources.ksroutes.data[0].status,
      traffic: [
        {
          ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
          percent: 50,
          tag: 'tag-one',
          url: 'http://testing.apps.bpetersen-june-23.devcluster.openshift.com',
        },
        {
          ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
          percent: 25,
        },
        {
          ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
          revisionName: 'test',
          percent: 25,
        },
      ],
    },
  };
  it('expect getKnativeRoutesLinks to return array of resource overview item', () => {
    const routeLinks = getKnativeRoutesLinks(
      MockKnativeResources.ksroutes.data[0],
      MockKnativeResources.revisions.data[0],
    );
    expect(routeLinks).toHaveLength(1);
  });
  it('should return all the revisions in the traffic block if service is passed', () => {
    const routeLinks = getKnativeRoutesLinks(
      multipleRevisionsData,
      MockKnativeResources.ksservices.data[0],
    );
    expect(routeLinks).toHaveLength(3);
  });

  it('should return only the matching revisions in the traffic block if revision is passed', () => {
    const routeLinks = getKnativeRoutesLinks(
      multipleRevisionsData,
      MockKnativeResources.revisions.data[0],
    );
    expect(routeLinks).toHaveLength(2);
  });

  it('should return empty array if the resource does not match with traffic revision name', () => {
    const routeLinks = getKnativeRoutesLinks(
      multipleRevisionsData,
      MockKnativeResources.services.data[0],
    );
    expect(routeLinks).toHaveLength(0);
  });
});
