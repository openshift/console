import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { FormikValues, useFormikContext } from 'formik';
import { GridItem } from '@patternfly/react-core';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { DropdownField } from '@console/shared';
import { HelmChartMetaData, HelmRelease, HelmChart } from '../helm-types';
import { getChartURL, getChartVersions, getChartValuesYAML } from '../helm-utils';

export type HelmChartVersionDropdownProps = {
  chartVersion: string;
  chartName: string;
};

const HelmChartVersionDropdown: React.FunctionComponent<HelmChartVersionDropdownProps> = ({
  chartVersion,
  chartName,
}) => {
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [helmChartVersions, setHelmChartVersions] = React.useState({});
  const [helmChartEntries, setHelmChartEntries] = React.useState<HelmChartMetaData[]>([]);

  React.useEffect(() => {
    let ignore = false;

    const fetchChartVersions = async () => {
      let json: HelmRelease;

      try {
        const response = await coFetch('/api/helm/charts/index.yaml');
        const yaml = await response.text();
        json = safeLoad(yaml);
      } catch {
        if (ignore) return;
      }
      if (ignore) return;
      setHelmChartEntries(_.get(json, ['entries', chartName]));
      setHelmChartVersions(getChartVersions(_.get(json, ['entries', chartName])));
    };
    fetchChartVersions();
    return () => {
      ignore = true;
    };
  }, [chartName]);

  const onChartVersionChange = (value: string) => {
    if (chartVersion === value) return;

    const chartURL = getChartURL(helmChartEntries, value);

    setFieldValue('chartVersion', value);
    setFieldValue('helmChartURL', chartURL);

    coFetchJSON(`/api/helm/chart?url=${chartURL}`)
      .then((res: HelmChart) => {
        const chartValues = getChartValuesYAML(res);
        setFieldValue('chartValuesYAML', chartValues);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  };

  return (
    <GridItem span={6}>
      <DropdownField
        name="chartVersion"
        label="Chart Version"
        items={helmChartVersions}
        helpText={'Select the version to upgrade to.'}
        disabled={_.isEmpty(helmChartVersions)}
        title={chartVersion}
        onChange={onChartVersionChange}
        required
        fullWidth
      />
    </GridItem>
  );
};

export default HelmChartVersionDropdown;
