import * as React from 'react';
import { getAutoscaleWindow } from './serverless-utils';
import { useGetAutoscalerConfig } from './useGetAutoscalerConfig';

export const setKnScalingDefaultValue = (initialValues, knScalingConfig) => {
  const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } =
    knScalingConfig && getAutoscaleWindow(knScalingConfig['stable-window'] ?? '');
  // TODO: we should not mutate initial values at all.
  initialValues.serverless.scaling.concurrencytarget =
    knScalingConfig['container-concurrency-target-default'] || '';
  initialValues.serverless.scaling.concurrencyutilization =
    knScalingConfig['container-concurrency-target-percentage'] || '';
  initialValues.serverless.scaling.autoscale = {
    autoscalewindow,
    autoscalewindowUnit,
    defaultAutoscalewindowUnit,
  };
  return initialValues;
};

export const useUpdateKnScalingDefaultValues = (initialValues) => {
  const knScalingConfig = useGetAutoscalerConfig();
  // TODO: We should not expect that overridding the formik initialValues in a hook works fine.
  const [initialValuesState, setInitialValuesState] = React.useState(initialValues);
  React.useEffect(() => {
    if (knScalingConfig) {
      setInitialValuesState((previousValues) =>
        setKnScalingDefaultValue(previousValues, knScalingConfig),
      );
    }
  }, [knScalingConfig]);
  return initialValuesState;
};
