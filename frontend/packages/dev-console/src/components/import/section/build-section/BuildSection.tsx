import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ImportStrategy, getGitService } from '@console/git-service/src';
import { getStrategyType } from '@console/internal/components/build';
import { LoadingBox } from '@console/internal/components/utils';
import { FLAG_OPENSHIFT_PIPELINE_AS_CODE } from '@console/pipelines-plugin/src/const';
import { EnvironmentField, useDebounceCallback, useFlag } from '@console/shared/src';
import {
  isPreferredStrategyAvailable,
  useClusterBuildStrategy,
} from '../../../../utils/shipwright-build-hook';
import { AppResources } from '../../../edit-application/edit-application-types';
import BuildConfigSection from '../../advanced/BuildConfigSection';
import { useBuilderImageEnvironments } from '../../builder/builderImageHooks';
import { BuildOptions, GitImportFormData } from '../../import-types';
import FormSection from '../FormSection';
import { BuildOption } from './BuildOptions';
import { BuildStrategySelector } from './BuildStrategySelector';

type BuildSectionProps = {
  values: FormikValues & GitImportFormData;
  appResources?: AppResources;
};

export const BuildSection: React.FC<BuildSectionProps> = ({ values, appResources }) => {
  const { t } = useTranslation();
  const {
    project: { name: namespace },
    build: { option: buildOption, env: buildEnv },
    image: { selected: selectedImage, tag: selectedTag },
    import: { selectedStrategy, knativeFuncLoaded: funcLoaded },
  } = values;
  const { setFieldValue } = useFormikContext<FormikValues>();
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);
  const [strategy] = useClusterBuildStrategy();

  const [environments, envsLoaded] = useBuilderImageEnvironments(selectedImage, selectedTag);

  const envs = React.useMemo(() => {
    if (selectedStrategy.type === ImportStrategy.SERVERLESS_FUNCTION) {
      return buildEnv;
    }

    if (buildOption === BuildOptions.BUILDS) {
      const strategyType = getStrategyType(appResources?.buildConfig?.data?.spec?.strategy?.type);
      const buildConfigObj = appResources?.buildConfig?.data || {
        metadata: {
          namespace,
        },
      };
      return (buildConfigObj.spec?.strategy?.[strategyType]?.env || []).filter(
        (e) => !environments.some((env) => env.key === e.name),
      );
    }

    if (buildOption === BuildOptions.SHIPWRIGHT_BUILD) {
      const swBuildObj = appResources?.shipwrightBuild?.data || {
        metadata: {
          namespace,
        },
      };
      return (swBuildObj.spec?.env || []).filter(
        (e) => !environments.some((env) => env.key === e.name),
      );
    }

    return [];
  }, [
    appResources?.buildConfig?.data,
    appResources?.shipwrightBuild?.data,
    buildEnv,
    buildOption,
    environments,
    namespace,
    selectedStrategy.type,
  ]);

  /* Auto-select Pipelines as Build option for PAC Repositories */
  const autoSelectPipelines = useDebounceCallback(() => {
    const { git, formType } = values || {};

    if (formType !== 'edit' && git?.url) {
      const gitService = getGitService(
        git?.url,
        git?.type,
        git?.ref,
        git?.dir,
        git?.secretResource,
      );
      const checkTektonFolder = async () => {
        const res = await gitService?.isTektonFolderPresent();
        if (isRepositoryEnabled && res) {
          setFieldValue('build.option', BuildOptions.PIPELINES);
        }
      };
      gitService && checkTektonFolder();
    }
  }, 2000);

  React.useEffect(() => {
    autoSelectPipelines();
  }, [values?.git?.url, isRepositoryEnabled, setFieldValue, autoSelectPipelines]);

  React.useEffect(() => {
    if (values?.formType === 'edit' && values?.pipeline?.enabled) {
      setFieldValue('build.option', BuildOptions.PIPELINES);
    }
    if (values?.formType === 'edit' && values.build.option === BuildOptions.BUILDS) {
      setFieldValue('build.option', BuildOptions.BUILDS);
    }
    if (values?.formType === 'edit' && values.build.option === BuildOptions.SHIPWRIGHT_BUILD) {
      setFieldValue('build.option', BuildOptions.SHIPWRIGHT_BUILD);
    }
  }, [values, setFieldValue]);

  React.useEffect(() => {
    if (
      values?.formType !== 'edit' &&
      values.pipeline?.enabled &&
      values.build.option !== BuildOptions.PIPELINES
    ) {
      setFieldValue('pipeline.enabled', false);
      setFieldValue('pac.pipelineEnabled', false);
    }
  }, [setFieldValue, values.pipeline?.enabled, values.build?.option, values.formType]);

  /** NOTE: Shipwright Builds are not supported with Devfile Import Strategy currently and if required ClusterBuildStrategy for the ImportType is not available */
  React.useEffect(() => {
    if (values?.formType !== 'edit') {
      if (
        values?.import?.selectedStrategy?.type === ImportStrategy.DEVFILE ||
        !isPreferredStrategyAvailable(values?.import?.selectedStrategy?.type, strategy)
      ) {
        setFieldValue('build.option', BuildOptions.BUILDS);
      } else {
        setFieldValue('build.option', BuildOptions.SHIPWRIGHT_BUILD);
      }
    }
  }, [setFieldValue, values?.import?.selectedStrategy?.type, strategy, values?.formType]);

  return (
    <FormSection title={t('devconsole~Build')}>
      <BuildOption
        isDisabled={values?.formType === 'edit'}
        importStrategy={values?.import?.selectedStrategy?.type}
      />

      {values.build?.option === BuildOptions.SHIPWRIGHT_BUILD && (
        <BuildStrategySelector
          formType={values?.formType}
          importStrategy={values?.import?.selectedStrategy?.type}
        />
      )}
      {values.isi || values.pipeline?.enabled ? null : (
        <ExpandableSection toggleText={t('devconsole~Show advanced Build option')}>
          {values.build?.option === BuildOptions.BUILDS && (
            <BuildConfigSection showHeader={false} />
          )}
          {(
            selectedStrategy.type === ImportStrategy.SERVERLESS_FUNCTION
              ? funcLoaded ?? false
              : envsLoaded
          ) ? (
            <EnvironmentField
              name="build.env"
              label={t('devconsole~Environment variables (build and runtime)')}
              obj={{ metadata: { namespace } }}
              envs={envs}
            />
          ) : (
            <LoadingBox />
          )}
        </ExpandableSection>
      )}
    </FormSection>
  );
};
