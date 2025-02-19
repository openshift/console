import * as React from 'react';
import { cleanup, configure, render, screen } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FinishTourText } from '../GuidedTourText';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => {
  return {
    useK8sWatchResource: jest.fn(),
  };
});

describe('GuidedTourText', () => {
  afterEach(() => cleanup());

  it('should render openshift-blog and openshift-docs link', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true, '']);
    render(<FinishTourText />);

    screen.getByTestId('openshift-blog-link');
    screen.getByTestId('openshift-docs-link');
  });

  it('should render the openshift-blog href with link from consoleLinks', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([
      [{ metadata: { name: 'openshift-blog' }, spec: { href: 'https://blog.openshift.com/' } }],
      true,
      '',
    ]);
    const { getByTestId } = render(<FinishTourText />);
    expect(getByTestId('openshift-blog-link').getAttribute('href')).toEqual(
      'https://blog.openshift.com/',
    );
  });

  it('should render the openshift-blog href with default link if consoleLinks are not available', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true, '']);
    const { getByTestId } = render(<FinishTourText />);
    expect(getByTestId('openshift-blog-link').getAttribute('href')).toEqual(
      'https://developers.redhat.com/products/openshift/whats-new',
    );
  });

  it('should render openshift-docs href with default link', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true, '']);
    const { getByTestId } = render(<FinishTourText />);
    expect(getByTestId('openshift-docs-link').getAttribute('href')).toEqual(
      'https://docs.okd.io/latest/',
    );
  });
});
