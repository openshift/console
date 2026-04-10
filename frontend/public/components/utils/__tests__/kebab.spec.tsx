import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KebabItem, KebabItemAccessReview_ } from '../kebab';
import { useAccessReview } from '../rbac';

jest.mock('../rbac', () => ({
  useAccessReview: jest.fn(),
}));

const mockOption = {
  labelKey: 'public~Edit {{kind}}',
  labelKind: { kind: 'Project' },
  dataTest: 'Edit Project',
  href: '/k8s/cluster/projects/yvakil/yaml',
};

describe('KebabItem', () => {
  it('should disable option without callback / href (i.e. option does nothing)', async () => {
    const user = userEvent.setup();
    const nothingOption = { ...mockOption, href: undefined };
    const trackOnClick = jest.fn();
    render(<KebabItem onClick={trackOnClick} option={nothingOption} />);
    await user.click(screen.getByRole('menuitem'));
    expect(trackOnClick).toHaveBeenCalledTimes(0);
  });
  it('should enable when option has href', async () => {
    const user = userEvent.setup();
    const hrefOption = { ...mockOption };
    const trackOnClick = jest.fn();
    render(<KebabItem onClick={trackOnClick} option={hrefOption} />);
    await user.click(screen.getByRole('menuitem'));
    expect(trackOnClick).toHaveBeenCalledTimes(1);
  });
  it('should enable when option has a callback', async () => {
    const user = userEvent.setup();
    const callbackOption = { ...mockOption, href: undefined, callback: () => {} };
    const trackOnClick = jest.fn();
    render(<KebabItem onClick={trackOnClick} option={callbackOption} />);
    await user.click(screen.getByRole('menuitem'));
    expect(trackOnClick).toHaveBeenCalledTimes(1);
  });
});

describe('KebabItemAccessReview_', () => {
  const useAccessReviewOption = { ...mockOption, accessReview: {} };
  const mockImpersonate = {
    kind: 'dummy',
    name: 'dummy',
    subprotocols: ['dummy'],
  };
  it('should disable option when option.accessReview present and not allowed', async () => {
    const user = userEvent.setup();
    const useAccessReviewMock = useAccessReview as jest.Mock;
    const trackOnClick = jest.fn();
    useAccessReviewMock.mockReturnValue(false);
    render(
      <KebabItemAccessReview_
        option={useAccessReviewOption}
        onClick={trackOnClick}
        impersonate={mockImpersonate}
      />,
    );
    await user.click(screen.getByRole('menuitem'));
    expect(trackOnClick).toHaveBeenCalledTimes(0);
  });
  it('should enable option when option.accessReview present and allowed', async () => {
    const user = userEvent.setup();
    const useAccessReviewMock = useAccessReview as jest.Mock;
    const trackOnClick = jest.fn();
    useAccessReviewMock.mockReturnValue(true);
    render(
      <KebabItemAccessReview_
        option={useAccessReviewOption}
        onClick={trackOnClick}
        impersonate={mockImpersonate}
      />,
    );
    await user.click(screen.getByRole('menuitem'));
    expect(trackOnClick).toHaveBeenCalledTimes(1);
  });
});
