import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { FormikValues, useFormikContext } from 'formik';
import { GridItem } from '@patternfly/react-core';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { DropdownField } from '@console/shared';
import { confirmModal } from '@console/internal/components/modals/confirm-modal';
import { k8sVersion } from '@console/internal/module/status';
import { getK8sGitVersion } from '@console/internal/module/k8s';
import { HelmChartMetaData, HelmChart, HelmActionType, HelmChartEntries } from '../helm-types';
import { getChartURL, getChartVersions, getChartValuesYAML } from '../helm-utils';

export type HelmChartVersionDropdownProps = {
  chartVersion: string;
  chartName: string;
  helmAction: string;
};
type ModalCallback = () => void;

const HelmChartVersionDropdown: React.FunctionComponent<HelmChartVersionDropdownProps> = ({
  chartVersion,
  chartName,
  helmAction,
}) => {
  const {
    setFieldValue,
    values: { chartValuesYAML, appVersion },
    setFieldTouched,
  } = useFormikContext<FormikValues>();
  const [helmChartVersions, setHelmChartVersions] = React.useState({});
  const [helmChartEntries, setHelmChartEntries] = React.useState<HelmChartMetaData[]>([]);
  const [initialChartYAMLValues, setInitialChartYAMLValues] = React.useState('');
  const [kubernetesVersion, setKubernetesVersion] = React.useState<string>();

  const warnOnChartVersionChange = (
    onAccept: ModalCallback,
    currentVersion: string,
    newVersion: string,
  ) => {
    confirmModal({
      title: 'Change Chart Version?',
      message: (
        <>
          Are you sure you want to change the chart version from <strong>{currentVersion}</strong>{' '}
          to <strong>{newVersion}</strong>? <br />
          You have data entered for version <strong>{currentVersion}</strong> in the YAML editor.
          All data entered will be lost when changed to <strong>{newVersion}</strong>.
        </>
      ),
      submitDanger: true,
      btnText: 'Yes',
      cancelText: 'No',
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
    setInitialChartYAMLValues(chartValuesYAML);
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
    setFieldValue('helmChartURL', chartURL);

    coFetchJSON(`/api/helm/chart?url=${chartURL}`)
      .then((res: HelmChart) => {
        const chartValues = getChartValuesYAML(res);
        setFieldValue('chartValuesYAML', chartValues);
        setInitialChartYAMLValues(chartValues);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  };

  const handleChartVersionChange = (val: string) => {
    if (val !== chartVersion) {
      const isDirty = !_.isEqual(initialChartYAMLValues, chartValuesYAML);
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
        title={helmChartVersions[chartVersion] || `${chartVersion} / App Version ${appVersion}`}
        onChange={handleChartVersionChange}
        required
        fullWidth
      />
    </GridItem>
  );
};

export default HelmChartVersionDropdown;
