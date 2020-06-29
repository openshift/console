import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { FormikValues, useFormikContext } from 'formik';
import { GridItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { DropdownField } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { k8sVersion } from '@console/internal/module/status';
import { getK8sGitVersion } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HelmChartMetaData, HelmChart, HelmActionType, HelmChartEntries } from '../helm-types';
import {
  getChartURL,
  getChartVersions,
  getChartValuesYAML,
  getChartReadme,
  concatVersions,
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
  const {
    setFieldValue,
    values: { yamlData, formData, appVersion },
    setFieldTouched,
  } = useFormikContext<FormikValues>();
  const [helmChartVersions, setHelmChartVersions] = React.useState({});
  const [helmChartEntries, setHelmChartEntries] = React.useState<HelmChartMetaData[]>([]);
  const [kubernetesVersion, setKubernetesVersion] = React.useState<string>();
  const [initialYamlData, setInitialYamlData] = React.useState<string>('');
  const [initialFormData, setInitialFormData] = React.useState<object>();

  const warnOnChartVersionChange = (
    onAccept: ModalCallback,
    currentVersion: string,
    newVersion: string,
  ) => {
    confirmModal({
      title: 'Change Chart Version?',
      message: (
        <>
          <p>
            Are you sure you want to change the chart version from <strong>{currentVersion}</strong>{' '}
            to <strong>{newVersion}</strong>?{' '}
          </p>
          <p>
            <InfoCircleIcon color="var(--pf-global--info-color--100)" /> All data entered for
            version <strong>{currentVersion}</strong> will be reset.
          </p>
        </>
      ),
      submitDanger: false,
      btnText: 'Proceed',
      cancelText: 'Cancel',
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
    k8sVersion()
      .then((response) => setKubernetesVersion(getK8sGitVersion(response) || '-'))
      .catch(() => setKubernetesVersion('unknown'));
  }, []);

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
      setHelmChartEntries(json?.entries?.[chartName]);
      setHelmChartVersions(getChartVersions(json?.entries?.[chartName], kubernetesVersion));
    };
    fetchChartVersions();
    return () => {
      ignore = true;
    };
  }, [chartName, kubernetesVersion]);

  const onChartVersionChange = (value: string) => {
    const chartURL = getChartURL(helmChartEntries, value);

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
      ? 'Select the Chart Version.'
      : 'Select the version to upgrade to.';

  return (
    <GridItem span={6}>
      <DropdownField
        name="chartVersion"
        label="Chart Version"
        items={helmChartVersions}
        helpText={helpText}
        disabled={_.isEmpty(helmChartVersions) || _.keys(helmChartVersions).length === 1}
        title={helmChartVersions[chartVersion] || concatVersions(chartVersion, appVersion)}
        onChange={handleChartVersionChange}
        required
        fullWidth
      />
    </GridItem>
  );
};

export default HelmChartVersionDropdown;
