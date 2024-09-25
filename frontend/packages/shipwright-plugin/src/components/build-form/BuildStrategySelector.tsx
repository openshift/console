import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SingleDropdownField, SelectInputOption } from '@console/shared/src';
import { BuildStrategyModel, ClusterBuildStrategyModel } from '../../models';
import { BuildStrategyKind, ClusterBuildStrategyKind } from '../../types';

type BuildStrategySelectorProps = {
  namespace: string;
  formType?: string;
};

const BuildStrategySelector: React.FC<BuildStrategySelectorProps> = ({ namespace, formType }) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [error, setError] = React.useState('');
  const watchedResources = {
    bs: {
      isList: true,
      groupVersionKind: getGroupVersionKindForModel(BuildStrategyModel),
      namespace,
      optional: true,
    },
    cbs: {
      isList: true,
      groupVersionKind: getGroupVersionKindForModel(ClusterBuildStrategyModel),
      optional: true,
    },
  };
  const watchedBuildStrategies = useK8sWatchResources<{
    cbs: ClusterBuildStrategyKind[];
    bs: BuildStrategyKind[];
  }>(watchedResources);
  const buildStrategies = React.useMemo(
    () => [...watchedBuildStrategies.bs.data, ...watchedBuildStrategies.cbs.data],
    [watchedBuildStrategies.bs.data, watchedBuildStrategies.cbs.data],
  );

  React.useEffect(() => {
    const errorKey = Object.keys(watchedBuildStrategies).find(
      (key) => watchedBuildStrategies[key].loadError,
    );
    if (
      buildStrategies.length === 0 &&
      !watchedBuildStrategies[errorKey]?.loaded &&
      watchedBuildStrategies[errorKey]?.loadError
    ) {
      setError(`${watchedBuildStrategies[errorKey]?.loadError?.message}`);
    } else {
      setError('');
    }
  }, [buildStrategies, watchedBuildStrategies]);

  const clusterBuildStrategyOptions = React.useMemo(() => {
    const options: SelectInputOption[] = buildStrategies.reduce((acc, currentValue) => {
      acc.push({
        label: currentValue.metadata.name,
        value: currentValue.metadata.name,
        description: `${currentValue.apiVersion}~${currentValue.kind}`,
      });
      return acc;
    }, []);
    return options;
  }, [buildStrategies]);
  const onChange = (selection) => {
    setFieldValue('formData.build.strategy', selection);
    const selectedBuildStrategy = buildStrategies?.find((bs) => bs.metadata.name === selection);
    setFieldValue('formData.build.selectedBuildStrategy', selectedBuildStrategy);
    setFieldValue('formData.build.kind', selectedBuildStrategy.kind);
    const overridableVolumes = selectedBuildStrategy?.spec?.volumes?.filter(
      (volume) => volume.overridable === true,
    );
    const volumes = (overridableVolumes || []).map((volume) => {
      const keys = Object.keys(volume);
      const volumeKey = _.without(keys, 'name', 'overridable', 'description');
      return {
        name: volume.name,
        resourceType: volumeKey[0],
        resource: volumeKey[0] === 'emptyDir' ? volume[volumeKey[0]] : volume[volumeKey[0]].name,
        overridable: volume.overridable,
        description: volume.description,
      };
    });
    setFieldValue('formData.volumes', volumes || []);

    if (selectedBuildStrategy?.spec) {
      const params = (selectedBuildStrategy?.spec?.parameters || []).map((param) => {
        return {
          ...param,
          ...(param.type ? { type: param.type } : { type: param.defaults ? 'array' : 'string' }),
          value: param.default || param.defaults, // setup the default if it exists
        };
      });
      setFieldValue('formData.parameters', params);
    }
  };

  return (
    <FormSection>
      <SingleDropdownField
        data-test-id="build-strategy-field"
        name="formData.build.strategy"
        label={t('shipwright-plugin~Build Strategy')}
        onChange={onChange}
        isDisabled={formType === 'edit'}
        ariaLabel={t('shipwright-plugin~Cluster Build Strategy')}
        placeholderText={t('shipwright-plugin~Select Build Strategy')}
        helpText={t(
          'shipwright-plugin~Cluster Build Strategies define a shared group of steps, needed to fullfil the application build process.',
        )}
        options={clusterBuildStrategyOptions}
        toggleOnSelection
        required
      />
      {error && buildStrategies.length === 0 && (
        <Alert variant="danger" truncateTitle={3} title={error} />
      )}
    </FormSection>
  );
};

export default BuildStrategySelector;
