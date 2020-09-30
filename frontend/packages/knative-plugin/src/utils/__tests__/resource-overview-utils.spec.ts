import { MockKnativeResources } from '../../topology/__tests__/topology-knative-test-data';
import { getKnativeRoutesLinks, groupTrafficByRevision } from '../resource-overview-utils';

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

  it('should not return unique urls for revisions without tag', () => {
    const { urls } = groupTrafficByRevision(multipleRevisionsData, {
      ...MockKnativeResources.revisions.data[0],
      metadata: { name: 'test' },
    });
    expect(urls).toHaveLength(0);
  });

  it('should return total percentage when grouping', () => {
    const { percent: totalPercentage } = groupTrafficByRevision(multipleRevisionsData, {
      ...MockKnativeResources.revisions.data[0],
      metadata: { name: 'test' },
    });
    expect(totalPercentage).toEqual('25%');
  });

  it('should club the percentage and have unique urls for the same revision name', () => {
    const multipleTrafficSplitRevision = {
      ...multipleRevisionsData,
      status: {
        ...multipleRevisionsData.status,
        traffic: [
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            percent: 25,
            tag: 'tag-two',
            url: 'http://tag-two.testing.apps.bpetersen-june-23.devcluster.openshift.com',
          },
          {
            ...MockKnativeResources.ksroutes.data[0].status.traffic[0],
            percent: 75,
            tag: 'tag-two',
            url: 'http://tag-three.testing.apps.bpetersen-june-23.devcluster.openshift.com',
          },
        ],
      },
    };
    const { urls, percent: totalPercentage } = groupTrafficByRevision(
      multipleTrafficSplitRevision,
      MockKnativeResources.revisions.data[0],
    );
    expect(urls).toHaveLength(2);
    expect(totalPercentage).toEqual('100%');
  });
});
