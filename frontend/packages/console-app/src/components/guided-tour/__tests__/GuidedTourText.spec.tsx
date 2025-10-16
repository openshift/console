import { render, screen } from '@testing-library/react';
import { helpTourText, userPreferencesTourText, FinishTourText } from '../GuidedTourText';
import '@testing-library/jest-dom';

// Mock k8s-watch-hook
jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: () => [
    [{ metadata: { name: 'openshift-blog' }, spec: { href: 'https://blog.example.com' } }],
  ],
}));

describe('GuidedTourText', () => {
  it('renders helpTourText', () => {
    render(helpTourText);
    expect(
      screen.getByText(
        'Access our new quick starts where you can learn more about creating or deploying an application using OpenShift Developer Console. You can also restart this tour anytime here.',
      ),
    ).toBeInTheDocument();
  });

  it('renders userPreferencesTourText', () => {
    render(userPreferencesTourText);
    expect(
      screen.getByText(
        'Set your individual console preferences including default views, language, import settings, and more.',
      ),
    ).toBeInTheDocument();
  });

  it('renders FinishTourText with blog and documentation links', () => {
    render(<FinishTourText />);
    expect(screen.getByTestId('openshift-blog-link')).toHaveAttribute(
      'href',
      'https://blog.example.com',
    );
    expect(screen.getByTestId('openshift-help-link')).toHaveAttribute(
      'href',
      'https://docs.okd.io/latest/',
    );
    expect(screen.getByText('blog')).toBeInTheDocument();
    expect(screen.getByText('documentation')).toBeInTheDocument();
  });
});
