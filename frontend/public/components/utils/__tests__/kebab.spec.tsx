import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { KebabItem, KebabItemAccessReview_ } from '../kebab';
import { useAccessReview } from '../index';

jest.mock('../index', () => ({
  useAccessReview: jest.fn(),
}));

const mockOption = {
  labelKey: 'public~Edit {{kind}}',
  labelKind: { kind: 'Project' },
  dataTest: 'Edit Project',
  href: '/k8s/cluster/projects/yvakil/yaml',
};

describe('KebabItem', () => {
  it('should disable option without callback / href (i.e. option does nothing)', () => {
    const nothingOption = { ...mockOption, href: undefined };
    const trackOnClick = jest.fn();
    const renderItem = render(<KebabItem onClick={trackOnClick} option={nothingOption} />);
    fireEvent.click(renderItem.getByRole('button'));
    expect(trackOnClick).toHaveBeenCalledTimes(0);
  });
  it('should enable when option has href', () => {
    const hrefOption = { ...mockOption };
    const trackOnClick = jest.fn();
    const renderItem = render(<KebabItem onClick={trackOnClick} option={hrefOption} />);
    fireEvent.click(renderItem.getByRole('button'));
    expect(trackOnClick).toHaveBeenCalledTimes(1);
  });
  it('should enable when option has a callback', () => {
    const callbackOption = { ...mockOption, href: undefined, callback: () => {} };
    const trackOnClick = jest.fn();
    const renderItem = render(<KebabItem onClick={trackOnClick} option={callbackOption} />);
    fireEvent.click(renderItem.getByRole('button'));
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
  it('should disable option when option.accessReview present and not allowed', () => {
    const useAccessReviewMock = useAccessReview as jest.Mock;
    const trackOnClick = jest.fn();
    useAccessReviewMock.mockReturnValue(false);
    const renderItem = render(
      <KebabItemAccessReview_
        option={useAccessReviewOption}
        onClick={trackOnClick}
        impersonate={mockImpersonate}
      />,
    );
    fireEvent.click(renderItem.getByRole('button'));
    expect(trackOnClick).toHaveBeenCalledTimes(0);
  });
  it('should enable option when option.accessReview present and allowed', () => {
    const useAccessReviewMock = useAccessReview as jest.Mock;
    const trackOnClick = jest.fn();
    useAccessReviewMock.mockReturnValue(true);
    const renderItem = render(
      <KebabItemAccessReview_
        option={useAccessReviewOption}
        onClick={trackOnClick}
        impersonate={mockImpersonate}
      />,
    );
    fireEvent.click(renderItem.getByRole('button'));
    expect(trackOnClick).toHaveBeenCalledTimes(1);
  });
});
