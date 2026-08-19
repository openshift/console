import { act } from '@testing-library/react';
import { useStore } from 'react-redux';
import type { RootState } from '@console/internal/redux';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useFeatureFlagController } from '../FeatureFlagExtensionLoader';

jest.mock('@console/internal/plugins', () => {
  // Avoid loading real local plugins / schema validation in unit tests.
  const { TestPluginStore } = jest.requireActual('@openshift/dynamic-plugin-sdk');
  return {
    pluginStore: new TestPluginStore({
      autoEnableLoadedPlugins: true,
      loader: {
        loadPluginManifest: async () => {
          throw new Error('unused');
        },
        transformPluginManifest: (manifest) => manifest,
        loadPlugin: async () => ({ success: true as const, loadedExtensions: [] }),
      },
    }),
    featureFlagMiddleware: () => (next) => (action) => next(action),
  };
});

describe('useFeatureFlagController', () => {
  it('defers flag updates made during render until after the render completes', async () => {
    let flagDuringRender: boolean | undefined;
    const { store, result } = renderHookWithProviders(() => {
      const reduxStore = useStore<RootState>();
      const setFeatureFlag = useFeatureFlagController();
      // Simulate console.flag/hookProvider handlers that set flags during render.
      setFeatureFlag('SYNC_FLAG', true);
      flagDuringRender = reduxStore.getState().FLAGS.get('SYNC_FLAG');
      return setFeatureFlag;
    });

    expect(flagDuringRender).toBeUndefined();
    expect(result.current).toEqual(expect.any(Function));

    await act(async () => {
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.get('SYNC_FLAG')).toBe(true);
  });

  it('applies async flag updates without waiting for another render', async () => {
    const { store, result } = renderHookWithProviders(() => useFeatureFlagController());

    await act(async () => {
      result.current('ASYNC_FLAG', true);
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.get('ASYNC_FLAG')).toBe(true);
  });

  it('coalesces consecutive async updates to the latest value', async () => {
    const { store, result } = renderHookWithProviders(() => useFeatureFlagController());

    await act(async () => {
      result.current('TOGGLE_FLAG', true);
      result.current('TOGGLE_FLAG', false);
      await Promise.resolve();
    });

    expect(store.getState().FLAGS.get('TOGGLE_FLAG')).toBe(false);
  });
});
