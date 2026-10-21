import type { FC } from 'react';
import { useMemo, useEffect, useCallback } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useClusterBuildStrategy } from '@console/dev-console/src/utils/shipwright-build-hook';
import { ImportStrategy } from '@console/git-service/src';
import { LoadingInline } from '@console/internal/components/utils';
import type { SelectInputOption } from '@console/shared/src';
import { SingleDropdownField } from '@console/shared/src';
import {
  ClusterBuildStrategy,
  ReadableClusterBuildStrategies,
} from '@console/shipwright-plugin/src/types';

type BuildStrategySelectorProps = {
  formType: string;
  importStrategy: ImportStrategy;
};

export const BuildStrategySelector: FC<BuildStrategySelectorProps> = ({
  formType,
  importStrategy,
}) => {
  const { t } = useTranslation();
  const [strategy, strategyLoaded] = useClusterBuildStrategy();
  const { setFieldValue } = useFormikContext<FormikValues>();

  const clusterBuildStrategyOptions = useMemo(() => {
    const options: SelectInputOption[] = [];
    if (strategy.buildah && importStrategy === ImportStrategy.DOCKERFILE) {
      options.push({
        label: t(ReadableClusterBuildStrategies[ClusterBuildStrategy.BUILDAH]),
        value: ClusterBuildStrategy.BUILDAH,
      });
    }
    if (strategy.s2i && importStrategy === ImportStrategy.S2I) {
      options.push({
        label: t(ReadableClusterBuildStrategies[ClusterBuildStrategy.S2I]),
        value: ClusterBuildStrategy.S2I,
      });
    }
    return options;
  }, [strategy, importStrategy, t]);

  useEffect(() => {
    if (formType !== 'edit') {
      if (importStrategy === ImportStrategy.S2I) {
        setFieldValue('build.clusterBuildStrategy', ClusterBuildStrategy.S2I);
      } else if (importStrategy === ImportStrategy.DOCKERFILE) {
        setFieldValue('build.clusterBuildStrategy', ClusterBuildStrategy.BUILDAH);
      }
    }
  }, [setFieldValue, importStrategy, formType]);

  const onChange = useCallback(
    (selection: string) => {
      const value = _.findKey(ReadableClusterBuildStrategies, (name) => t(name) === selection);
      setFieldValue('build.clusterBuildStrategy', value);
    },
    [setFieldValue, t],
  );

  return strategyLoaded ? (
    <SingleDropdownField
      data-test-id="cluster-build-strategy-field"
      name="build.clusterBuildStrategy"
      label={t('devconsole~Cluster Build Strategy')}
      onChange={onChange}
      isDisabled={formType === 'edit'}
      ariaLabel={t('devconsole~Cluster Build Strategy')}
      placeholderText={t('devconsole~Select Cluster Build Strategy')}
      helpText={t(
        'devconsole~Cluster Build Strategies define a shared group of steps, needed to fullfil the application build process.',
      )}
      getLabelFromValue={(value: string) => t(ReadableClusterBuildStrategies[value])}
      options={clusterBuildStrategyOptions}
      toggleOnSelection
    />
  ) : (
    <LoadingInline />
  );
};
