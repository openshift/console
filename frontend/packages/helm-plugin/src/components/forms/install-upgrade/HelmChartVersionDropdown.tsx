import * as React from 'react';
import { GridItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { FormikValues, useFormikContext } from 'formik';
import { safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { DropdownField } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HelmChartRepositoryModel } from '../../../models';
import {
  HelmChartMetaData,
  HelmChart,
  HelmActionType,
  HelmChartEntries,
} from '../../../types/helm-types';
import {
  getChartURL,
  getChartVersions,
  getChartValuesYAML,
  getChartReadme,
  concatVersions,
  getChartEntriesByName,
  getChartRepositoryTitle,
} from '../../../utils/helm-utils';

export type HelmChartVersionDropdownProps = {
  chartVersion: string;
  chartName: string;
  helmAction: string;
  onVersionChange: (chart: HelmChart) => void;
};
type ModalCallback = () => void;

const HelmChartVersionDropdown: React.FunctionComponent<HelmChartVersionDropdownProps> = ({
  chartVersion,
  chartName,
  helmAction,
  onVersionChange,
}) => {
  const { t } = useTranslation();
  const {
    setFieldValue,
    values: { chartRepoName, yamlData, formData, appVersion },
    setFieldTouched,
  } = useFormikContext<FormikValues>();
  const [helmChartVersions, setHelmChartVersions] = React.useState({});
  const [helmChartEntries, setHelmChartEntries] = React.useState<HelmChartMetaData[]>([]);
  const [initialYamlData, setInitialYamlData] = React.useState<string>('');
  const [initialFormData, setInitialFormData] = React.useState<object>();

  const resourceSelector: WatchK8sResource = {
    isList: true,
    kind: referenceForModel(HelmChartRepositoryModel),
  };
  const [chartRepositories] = useK8sWatchResource<K8sResourceKind[]>(resourceSelector);

  const warnOnChartVersionChange = (
    onAccept: ModalCallback,
    currentVersion: string,
    newVersion: string,
  ) => {
    confirmModal({
      title: t('helm-plugin~Change chart version?'),
      message: (
        <>
          <p>
            <Trans t={t} ns="helm-plugin">
              Are you sure you want to change the chart version from{' '}
              <strong>{{ currentVersion }}</strong> to <strong>{{ newVersion }}</strong>?{' '}
            </Trans>
          </p>
          <p>
            <InfoCircleIcon color="var(--pf-global--info-color--100)" />{' '}
            <Trans t={t} ns="helm-plugin">
              All data entered for version <strong>{{ currentVersion }}</strong> will be reset
            </Trans>
          </p>
        </>
      ),
      submitDanger: false,
      btnText: t('helm-plugin~Proceed'),
      cancelText: t('helm-plugin~Cancel'),
      executeFn: () => {
        onAccept();
        return Promise.resolve();
      },
      cancel: () => {
        setFieldValue('chartVersion', currentVersion);
        setFieldTouched('chartVersion', false);
      },
    });
  };

  React.useEffect(() => {
    setInitialYamlData(yamlData);
    setInitialFormData(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    let ignore = false;

    const fetchChartVersions = async () => {
      let json: { entries: HelmChartEntries };

      try {
        const response = await coFetch('/api/helm/charts/index.yaml');
        const yaml = await response.text();
        json = safeLoad(yaml);
      } catch {
        if (ignore) return;
      }
      if (ignore) return;
      const chartEntries = getChartEntriesByName(
        json?.entries,
        chartName,
        chartRepoName,
        chartRepositories,
      );
      setHelmChartEntries(chartEntries);
      setHelmChartVersions(getChartVersions(chartEntries, t));
    };
    fetchChartVersions();
    return () => {
      ignore = true;
    };
  }, [chartName, chartRepoName, chartRepositories, t]);

  const onChartVersionChange = (value: string) => {
    const [version, repoName] = value.split('--');

    const chartURL = getChartURL(helmChartEntries, version, repoName);

    setFieldValue('chartVersion', value);
    setFieldValue('chartURL', chartURL);

    coFetchJSON(`/api/helm/chart?url=${chartURL}`)
      .then((res: HelmChart) => {
        onVersionChange(res);

        const chartReadme = getChartReadme(res);
        const valuesYAML = getChartValuesYAML(res);
        const valuesJSON = res?.values;
        const valuesSchema = res?.schema && JSON.parse(atob(res?.schema));
        const editorType = valuesSchema ? EditorType.Form : EditorType.YAML;
        setFieldValue('editorType', editorType);
        setFieldValue('formSchema', valuesSchema);
        setFieldValue('yamlData', valuesYAML);
        setFieldValue('formData', valuesJSON);
        setFieldValue('chartReadme', chartReadme);
        setInitialYamlData(valuesYAML);
        setInitialFormData(valuesJSON);
      })
      .catch((err) => {
        console.error(err); // eslint-disable-line no-console
      });
  };

  const handleChartVersionChange = (val: string) => {
    if (val !== chartVersion) {
      const isDirty =
        !_.isEqual(initialYamlData, yamlData) || !_.isEqual(initialFormData, formData);
      if (isDirty) {
        warnOnChartVersionChange(() => onChartVersionChange(val), chartVersion, val);
      } else {
        onChartVersionChange(val);
      }
    }
  };

  const helpText =
    helmAction === HelmActionType.Install
      ? t('helm-plugin~Select the chart version.')
      : t('helm-plugin~Select the version to upgrade to.');

  const title =
    _.isEmpty(helmChartVersions) && !chartVersion
      ? t('helm-plugin~No versions available')
      : helmChartVersions[`${chartVersion}`] ||
        concatVersions(
          chartVersion,
          appVersion,
          t,
          getChartRepositoryTitle(chartRepositories, chartRepoName),
        );

  return (
    <GridItem span={6}>
      <DropdownField
        name="chartVersion"
        label={t('helm-plugin~Chart version')}
        items={helmChartVersions}
        helpText={helpText}
        disabled={_.isEmpty(helmChartVersions) || _.keys(helmChartVersions).length === 1}
        title={title}
        onChange={handleChartVersionChange}
        required
        fullWidth
      />
    </GridItem>
  );
};

export default HelmChartVersionDropdown;
