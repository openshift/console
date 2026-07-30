import { isValidElement } from 'react';
import type { ReactElement } from 'react';
import { renderHook } from '@testing-library/react';
import { modelFor } from '@console/internal/module/k8s';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import useConfirmNavUnpinModal from '../useConfirmNavUnpinModal';

jest.mock('@console/internal/module/k8s', () => ({
  modelFor: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useWarningModal', () => ({
  useWarningModal: jest.fn(),
}));

describe('useConfirmNavUnpinModal', () => {
  const mockConfirmModalLauncher = jest.fn();
  const mockUpdatePinsFn = jest.fn();
  const pinnedResources = ['core~v1~ConfigMap', 'apps~v1~Deployment'];

  beforeEach(() => {
    jest.clearAllMocks();
    (useWarningModal as jest.Mock).mockReturnValue(mockConfirmModalLauncher);
    (modelFor as jest.Mock).mockReturnValue({ labelPlural: 'ConfigMaps' });
  });

  it('should return a function to launch the confirm modal', () => {
    const { result } = renderHook(() => useConfirmNavUnpinModal(pinnedResources, mockUpdatePinsFn));

    expect(typeof result.current).toBe('function');
  });

  it('should launch modal with correct message when called', () => {
    const { result } = renderHook(() => useConfirmNavUnpinModal(pinnedResources, mockUpdatePinsFn));

    result.current('core~v1~ConfigMap');

    expect(mockConfirmModalLauncher).toHaveBeenCalledTimes(1);
    const { children, onConfirm } = mockConfirmModalLauncher.mock.calls[0][0];
    expect(typeof onConfirm).toBe('function');
    expect(isValidElement(children)).toBe(true);
    expect((children as ReactElement).type).toBe('span');
  });

  it('should remove resource from pinned list when confirmed', async () => {
    const { result } = renderHook(() => useConfirmNavUnpinModal(pinnedResources, mockUpdatePinsFn));

    result.current('core~v1~ConfigMap');

    const { onConfirm } = mockConfirmModalLauncher.mock.calls[0][0];
    await onConfirm();

    expect(mockUpdatePinsFn).toHaveBeenCalledWith(['apps~v1~Deployment']);
  });

  it('should use model labelPlural for confirmation message', () => {
    (modelFor as jest.Mock).mockReturnValue({ labelPlural: 'Deployments' });

    const { result } = renderHook(() => useConfirmNavUnpinModal(pinnedResources, mockUpdatePinsFn));

    result.current('apps~v1~Deployment');

    expect(modelFor).toHaveBeenCalledWith('apps~v1~Deployment');
    expect(mockConfirmModalLauncher).toHaveBeenCalled();
  });

  it('should handle undefined model gracefully', () => {
    (modelFor as jest.Mock).mockReturnValue(undefined);

    const { result } = renderHook(() => useConfirmNavUnpinModal(pinnedResources, mockUpdatePinsFn));

    result.current('unknown~v1~Resource');

    expect(mockConfirmModalLauncher).toHaveBeenCalled();
  });

  it('should maintain stable callback reference', () => {
    const { result, rerender } = renderHook(() =>
      useConfirmNavUnpinModal(pinnedResources, mockUpdatePinsFn),
    );

    const firstCallback = result.current;
    rerender();
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);
  });
});
