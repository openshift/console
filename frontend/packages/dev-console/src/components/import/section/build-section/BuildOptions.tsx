import type { FC } from 'react';
import { useMemo, useCallback } from 'react';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { ImportStrategy } from '@console/git-service/src/types';
import { LoadingInline } from '@console/internal/components/utils';
import { SelectInputOption, SingleDropdownField, useFlag } from '@console/shared';
import { FLAG_OPENSHIFT_BUILDCONFIG, FLAG_OPENSHIFT_PIPELINE } from '../../../../const';
import {
  isPreferredStrategyAvailable,
  useClusterBuildStrategy,
  useShipwrightBuilds,
} from '../../../../utils/shipwright-build-hook';
import { BuildOptions, ReadableBuildOptions } from '../../import-types';
import { usePipelineAccessReview } from './usePipelineAccessReview';

type BuildOptionProps = {
  isDisabled: boolean;
  importStrategy: ImportStrategy;
};

export const BuildOption: FC<BuildOptionProps> = ({ isDisabled, importStrategy }) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<FormikValues>();
  const isBuildV1Enabled = useFlag(FLAG_OPENSHIFT_BUILDCONFIG);
  const isShipwrightBuildsEnabled = useShipwrightBuilds();
  const [strategy, strategyLoaded] = useClusterBuildStrategy();
  const isPipelineEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);
  const hasCreatePipelineAccess = usePipelineAccessReview();

  const fieldName = 'build.option';

  const selectInputOptions = useMemo(() => {
    const options: SelectInputOption[] = [];

    if (isShipwrightBuildsEnabled && isPreferredStrategyAvailable(importStrategy, strategy)) {
      options.push({
        label: t(ReadableBuildOptions[BuildOptions.SHIPWRIGHT_BUILD]),
        value: BuildOptions.SHIPWRIGHT_BUILD,
        description: t(
          'devconsole~Shipwright is an extensible framework for building container images on OpenShift Container Platform cluster.',
        ),
      });
    }

    if (isBuildV1Enabled) {
      options.push({
        label: t(ReadableBuildOptions[BuildOptions.BUILDS]),
        value: BuildOptions.BUILDS,
        description: t(
          'devconsole~Build configuration describes build definitions used for transforming source code into a runnable container image.',
        ),
      });
    }

    // OCPBUGS-32526: Pipeline builds and Devfile import are mutually exclusive
    if (isPipelineEnabled && hasCreatePipelineAccess && importStrategy !== ImportStrategy.DEVFILE) {
      options.push({
        label: t(ReadableBuildOptions[BuildOptions.PIPELINES]),
        value: BuildOptions.PIPELINES,
        description: t(
          'devconsole~Build using pipeline describes a process for transforming source code into a runnable container image. Pipelines support can be added using Red Hat OpenShift Pipelines Operator.',
        ),
      });
    }

    return options;
  }, [
    isBuildV1Enabled,
    isShipwrightBuildsEnabled,
    isPipelineEnabled,
    hasCreatePipelineAccess,
    strategy,
    importStrategy,
    t,
  ]);

  const onChange = useCallback(
    (selection: string) => {
      const value = _.findKey(ReadableBuildOptions, (name) => t(name) === selection);
      setFieldValue(fieldName, value);
    },
    [setFieldValue, fieldName, t],
  );

  return strategyLoaded ? (
    <SingleDropdownField
      name={fieldName}
      label={t('devconsole~Build option')}
      options={selectInputOptions}
      onChange={onChange}
      isDisabled={isDisabled}
      getLabelFromValue={(value: string) => t(ReadableBuildOptions[value])}
      helpText={
        <p className="pf-c-form__helper-text">
          <Trans t={t} ns="devconsole">
            Build option to use for transforming source code into a runnable container image.
          </Trans>
        </p>
      }
      toggleOnSelection
    />
  ) : (
    <LoadingInline />
  );
};
