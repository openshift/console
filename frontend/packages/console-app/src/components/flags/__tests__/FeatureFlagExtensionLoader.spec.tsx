import { act } from '@testing-library/react';
import { useStore } from 'react-redux';
import type { RootState } from '@console/internal/redux';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { createTestPluginStore } from '../../console-operator/__tests__/pluginTestUtils';
import { useFeatureFlagController } from '../FeatureFlagExtensionLoader';

describe('useFeatureFlagController', () => {
  it('defers flag updates made during render until after the render completes', async () => {
    let flagDuringRender: boolean | undefined;
    const { store, result } = renderHookWithProviders(
      () => {
        const reduxStore = useStore<RootState>();
        const setFeatureFlag = useFeatureFlagController();
        // Simulate console.flag/hookProvider handlers that set flags during render.
        setFeatureFlag('SYNC_FLAG', true);
        flagDuringRender = reduxStore.getState().FLAGS.SYNC_FLAG;
        return setFeatureFlag;
      },
      { pluginStore: createTestPluginStore() },
    );

    expect(flagDuringRender).toBeUndefined();
    expect(result.current).toEqual(expect.any(Function));

    await act(async () => {
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.SYNC_FLAG).toBe(true);
  });

  it('applies async flag updates without waiting for another render', async () => {
    const { store, result } = renderHookWithProviders(() => useFeatureFlagController(), {
      pluginStore: createTestPluginStore(),
    });

    await act(async () => {
      result.current('ASYNC_FLAG', true);
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.ASYNC_FLAG).toBe(true);
  });

  it('coalesces consecutive async updates to the latest value', async () => {
    const { store, result } = renderHookWithProviders(() => useFeatureFlagController(), {
      pluginStore: createTestPluginStore(),
    });

    await act(async () => {
      result.current('TOGGLE_FLAG', true);
      result.current('TOGGLE_FLAG', false);
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.TOGGLE_FLAG).toBe(false);
  });

  it('preserves flag updates made reentrantly during flush', async () => {
    const { store, result } = renderHookWithProviders(() => useFeatureFlagController(), {
      pluginStore: createTestPluginStore(),
    });

    await act(async () => {
      const unsubscribe = store.subscribe(() => {
        if (store.getState().FLAGS.REENTRANT_FLAG === true) {
          result.current('REENTRANT_FLAG', false);
          unsubscribe();
        }
      });
      result.current('REENTRANT_FLAG', true);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.REENTRANT_FLAG).toBe(false);
  });
});
