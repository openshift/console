import * as React from 'react';
import { SelectVariant } from '@patternfly/react-core/deprecated';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useAccessReview } from '@console/internal/components/utils';
import { CLUSTER_PIPELINE_NS, FLAG_OPENSHIFT_PIPELINE } from '@console/pipelines-plugin/src/const';
import { PipelineModel } from '@console/pipelines-plugin/src/models';
import { SelectInputField, SelectInputOption, useFlag } from '@console/shared';
import { FLAG_OPENSHIFT_BUILDCONFIG } from '../../../const';
import { BuildOptions, ReadableBuildOptions } from '../import-types';

const usePipelineAccessReview = (): boolean => {
  const canListPipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: CLUSTER_PIPELINE_NS,
    verb: 'list',
  });

  const canCreatePipelines = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  return canListPipelines && canCreatePipelines;
};

export const BuildOption = ({ isDisabled }) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<FormikValues>();
  const isBuildV1Enabled = useFlag(FLAG_OPENSHIFT_BUILDCONFIG);
  const isPipelineEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);
  const hasCreatePipelineAccess = usePipelineAccessReview();

  const fieldName = 'build.option';

  const selectInputOptions = React.useMemo(() => {
    const options: SelectInputOption[] = [];

    if (isBuildV1Enabled) {
      options.push({
        label: t(ReadableBuildOptions[BuildOptions.BUILDS]),
        value: BuildOptions.BUILDS,
        description: t(
          'devconsole~Builds are a core concept in OpenShift Container Platform. A build describes a process for transforming source code into a runnable image.',
        ),
      });
    }

    if (isPipelineEnabled && hasCreatePipelineAccess) {
      options.push({
        label: t(ReadableBuildOptions[BuildOptions.PIPELINES]),
        value: BuildOptions.PIPELINES,
        description: t(
          'devconsole~Pipeline support is added via Red Hat OpenShift Pipelines Operator or Tekton Operator. A pipeline describes a process for transforming source code into a runnable image.',
        ),
      });
    }

    return options;
  }, [isBuildV1Enabled, isPipelineEnabled, hasCreatePipelineAccess, t]);

  const onChange = React.useCallback(
    (selection: string) => {
      const value = _.findKey(ReadableBuildOptions, (name) => t(name) === selection);
      setFieldValue(fieldName, value);
    },
    [setFieldValue, fieldName, t],
  );

  return (
    <SelectInputField
      name={fieldName}
      label={t('devconsole~Build Option')}
      options={selectInputOptions}
      variant={SelectVariant.single}
      onChange={onChange}
      isDisabled={isDisabled}
      getLabelFromValue={(value: string) => t(ReadableBuildOptions[value])}
      helpText={
        <p className="pf-c-form__helper-text">
          <Trans t={t} ns="devconsole">
            Build Option to use for building the application.
          </Trans>
        </p>
      }
      hideClearButton
      toggleOnSelection
    />
  );
};
