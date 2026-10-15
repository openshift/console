import { matchesNamespaceFilterText } from '../filters';

describe('matchesNamespaceFilterText', () => {
  it('matches a namespace by its display name', () => {
    const namespace = {
      metadata: {
        name: 'some-namespace-123',
        annotations: { 'openshift.io/display-name': 'My Product Name' },
      },
    };

    expect(matchesNamespaceFilterText('my product', namespace)).toBe(true);
  });

  it('matches a namespace by label key and value', () => {
    const namespace = {
      metadata: {
        name: 'some-namespace-123',
        labels: { app: 'my-product-name' },
      },
    };

    expect(matchesNamespaceFilterText('my-product-name', namespace)).toBe(true);
  });

  it('matches a namespace by annotation key and value', () => {
    const namespace = {
      metadata: {
        name: 'some-namespace-123',
        annotations: { 'example.com/team': 'platform-engineering' },
      },
    };

    expect(matchesNamespaceFilterText('platform engineering', namespace)).toBe(true);
  });

  it('still matches the namespace name itself', () => {
    const namespace = {
      metadata: {
        name: 'team-analytics-prod',
      },
    };

    expect(matchesNamespaceFilterText('analytics', namespace)).toBe(true);
  });
});
