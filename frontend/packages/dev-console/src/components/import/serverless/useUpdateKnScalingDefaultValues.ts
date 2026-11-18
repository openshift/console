import { useState } from 'react';
import { getAutoscaleWindow } from './serverless-utils';
import { useGetAutoscalerConfig } from './useGetAutoscalerConfig';

const setKnScalingDefaultValue = (initialValues, knScalingConfig) => {
  const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } =
    knScalingConfig && getAutoscaleWindow(knScalingConfig['stable-window'] ?? '');
  // Return a new object instead of mutating the previous state: an in-place
  // mutation returns the same reference, so React skips the re-render and
  // the defaults only become visible through the shared reference.
  // TODO: we should not build formik initial values in a hook at all.
  return {
    ...initialValues,
    serverless: {
      ...initialValues.serverless,
      scaling: {
        ...initialValues.serverless.scaling,
        concurrencytarget: knScalingConfig['container-concurrency-target-default'] || '',
        concurrencyutilization: knScalingConfig['container-concurrency-target-percentage'] || '',
        defaultConcurrencytarget: knScalingConfig['container-concurrency-target-default'] || '',
        defaultConcurrencyutilization:
          knScalingConfig['container-concurrency-target-percentage'] || '',
        autoscale: {
          autoscalewindow,
          defaultAutoscalewindow: autoscalewindow,
          autoscalewindowUnit,
          defaultAutoscalewindowUnit,
        },
      },
    },
  };
};

export const useUpdateKnScalingDefaultValues = (initialValues) => {
  const knScalingConfig = useGetAutoscalerConfig();
  // TODO: We should not expect that overridding the formik initialValues in a hook works fine.
  const [initialValuesState, setInitialValuesState] = useState(initialValues);

  // `null` as the initial previous value ensures the scaling defaults are
  // also applied on the first render when the config is already loaded.
  const [prevKnScalingConfig, setPrevKnScalingConfig] = useState<unknown>(null);
  if (prevKnScalingConfig !== knScalingConfig) {
    setPrevKnScalingConfig(knScalingConfig);
    if (knScalingConfig) {
      setInitialValuesState((previousValues) =>
        setKnScalingDefaultValue(previousValues, knScalingConfig),
      );
    }
  }
  return initialValuesState;
};
