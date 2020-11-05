import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { safeLoad } from 'js-yaml';
import { FormikValues, useFormikContext } from 'formik';
import { GridItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { DropdownField } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HelmChartMetaData, HelmChart, HelmActionType, HelmChartEntries } from '../helm-types';
import {
  getChartURL,
  getChartVersions,
  getChartValuesYAML,
  getChartReadme,
  concatVersions,
  getChartEntriesByName,
} from '../helm-utils';

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

  const warnOnChartVersionChange = (
    onAccept: ModalCallback,
    currentVersion: string,
    newVersion: string,
  ) => {
    confirmModal({
      title: t('devconsole~Change Chart Version?'),
      message: (
        <>
          <p>
            {t('devconsole~Are you sure you want to change the chart version from')}{' '}
            <strong>{currentVersion}</strong> {t('devconsole~to')} <strong>{newVersion}</strong>?{' '}
          </p>
          <p>
            <InfoCircleIcon color="var(--pf-global--info-color--100)" />{' '}
            {t('devconsole~All data entered for version')} <strong>{currentVersion}</strong>{' '}
            {t('devconsole~will be reset')}.
          </p>
        </>
      ),
      submitDanger: false,
      btnText: t('devconsole~Proceed'),
      cancelText: t('devconsole~Cancel'),
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
      const chartEntries = getChartEntriesByName(json?.entries, chartName, chartRepoName);
      setHelmChartEntries(chartEntries);
      setHelmChartVersions(getChartVersions(chartEntries));
    };
    fetchChartVersions();
    return () => {
      ignore = true;
    };
  }, [chartName, chartRepoName]);

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
      ? t('devconsole~Select the Chart Version.')
      : t('devconsole~Select the version to upgrade to.');

  const title =
    _.isEmpty(helmChartVersions) && !chartVersion
      ? t('devconsole~No versions available')
      : helmChartVersions[`${chartVersion}`] ||
        concatVersions(chartVersion, appVersion, chartRepoName);

  return (
    <GridItem span={6}>
      <DropdownField
        name="chartVersion"
        label={t('devconsole~Chart Version')}
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
