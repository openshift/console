import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { GridItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { safeDump, safeLoad } from 'js-yaml';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import type { ModalCallback } from '@console/internal/components/modals/types';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { DropdownField } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { useWarningModal } from '@console/shared/src/hooks/useWarningModal';
import { coFetchJSON, coFetch } from '@console/shared/src/utils/console-fetch';
import { HelmChartRepositoryModel } from '../../../models';
import type { HelmChartMetaData, HelmChart, HelmChartEntries } from '../../../types/helm-types';
import { HelmActionType } from '../../../types/helm-types';
import {
  getChartURL,
  getChartVersions,
  getChartReadme,
  concatVersions,
  getChartEntriesByName,
  getChartRepositoryTitle,
  getChartIndexEntry,
  mergeHelmValuesOnChartVersionChange,
} from '../../../utils/helm-utils';

export type HelmChartVersionDropdownProps = {
  chartVersion: string;
  chartName: string;
  helmAction: string;
  onVersionChange: (chart: HelmChart) => void;
  namespace: string;
  chartIndexEntry: string;
  annotatedName?: string;
  providerName?: string;
};

const HelmChartVersionDropdown: FC<HelmChartVersionDropdownProps> = ({
  chartVersion,
  chartName,
  helmAction,
  onVersionChange,
  namespace,
  chartIndexEntry,
  annotatedName,
  providerName,
}) => {
  const { t } = useTranslation();
  const {
    setFieldValue,
    values: { chartRepoName, yamlData, formData, appVersion, editorType },
    setFieldTouched,
  } = useFormikContext<FormikValues>();
  const [helmChartVersions, setHelmChartVersions] = useState({});
  const [helmChartEntries, setHelmChartEntries] = useState<HelmChartMetaData[]>([]);
  const [initialYamlData, setInitialYamlData] = useState<string>('');
  const [initialFormData, setInitialFormData] = useState<object>();
  const [helmChartRepos, setHelmChartRepos] = useState<HelmChartEntries>({});
  const resourceSelector: WatchK8sResource = {
    isList: true,
    kind: referenceForModel(HelmChartRepositoryModel),
  };
  const [chartRepositories] = useK8sWatchResource<K8sResourceKind[]>(resourceSelector);

  const warningModalLauncher = useWarningModal({
    title: t('helm-plugin~Change chart version?'),
  });

  const warnOnChartVersionChange = (
    onAccept: ModalCallback,
    currentVersion: string,
    newVersion: string,
  ) => {
    const message = (
      <>
        <p>
          <Trans t={t} ns="helm-plugin">
            Are you sure you want to change the chart version from{' '}
            <strong>{{ currentVersion }}</strong> to <strong>{{ newVersion }}</strong>?{' '}
          </Trans>
        </p>
        <p>
          <InfoCircleIcon color="var(--pf-t--global--icon--color--status--info--default)" />{' '}
          <Trans t={t} ns="helm-plugin">
            Values from your current release are merged with the new chart{"'"}s defaults. Review
            the YAML or form before upgrading.
          </Trans>
        </p>
      </>
    );

    warningModalLauncher({
      children: message,
      confirmButtonLabel: t('helm-plugin~Proceed'),
      cancelButtonLabel: t('helm-plugin~Cancel'),
      onConfirm: () => {
        onAccept();
        return Promise.resolve();
      },
      onClose: () => {
        setFieldValue('chartVersion', currentVersion);
        setFieldTouched('chartVersion', false);
      },
      ouiaId: 'HelmChangeChartVersionConfirmation',
    });
  };

  useEffect(() => {
    setInitialYamlData(yamlData);
    setInitialFormData(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ignore = false;

    const fetchChartVersions = async () => {
      let json: { entries: HelmChartEntries };

      try {
        const response = await coFetch(`/api/helm/charts/index.yaml?namespace=${namespace}`);
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
        annotatedName,
        providerName,
      );
      if (!chartIndexEntry) {
        setFieldValue(
          'chartIndexEntry',
          getChartIndexEntry(json?.entries, chartName, chartEntries[0]?.repoName),
        );
      }
      setHelmChartRepos(json?.entries);
      setHelmChartEntries(chartEntries);
      setHelmChartVersions(getChartVersions(chartEntries, t));
    };
    fetchChartVersions();
    return () => {
      ignore = true;
    };
  }, [
    chartName,
    chartRepoName,
    chartRepositories,
    t,
    namespace,
    chartIndexEntry,
    setFieldValue,
    annotatedName,
    providerName,
  ]);

  const onChartVersionChange = (value: string) => {
    const [version, repoName] = value.split('--');
    const chartURL = getChartURL(helmChartEntries, version, repoName);
    const chartRepoIndex = getChartIndexEntry(helmChartRepos, chartName, repoName);

    setFieldValue('chartVersion', value);
    setFieldValue('chartURL', chartURL);
    coFetchJSON(
      `/api/helm/chart?url=${encodeURIComponent(
        chartURL,
      )}&namespace=${namespace}&indexEntry=${encodeURIComponent(chartRepoIndex)}`,
    )
      .then((res: HelmChart) => {
        onVersionChange(res);

        const chartReadme = getChartReadme(res);
        const valuesJSON = res?.values;
        const valuesSchema = res?.schema && JSON.parse(atob(res?.schema));
        const nextEditorType = valuesSchema ? EditorType.Form : EditorType.YAML;
        const mergedValues = mergeHelmValuesOnChartVersionChange(
          valuesJSON as Record<string, unknown> | undefined,
          yamlData as string,
          formData,
          editorType as EditorType,
        );
        try {
          const mergedYaml = safeDump(mergedValues);
          setFieldValue('editorType', nextEditorType);
          setFieldValue('formSchema', valuesSchema);
          setFieldValue('yamlData', mergedYaml);
          setFieldValue('formData', mergedValues);
          setFieldValue('chartReadme', chartReadme);
          setInitialYamlData(mergedYaml);
          setInitialFormData(mergedValues);
        } catch (err) {
          console.error('Failed to serialize merged values:', err); // eslint-disable-line no-console
          // Fall back to using the merged values object without YAML serialization
          setFieldValue('editorType', nextEditorType);
          setFieldValue('formSchema', valuesSchema);
          setFieldValue('formData', mergedValues);
          setFieldValue('chartReadme', chartReadme);
          setInitialFormData(mergedValues);
        }
      })
      .catch((err) => {
        console.error(`Could not fetch helm chart with chart URL ${chartURL}:`, err); // eslint-disable-line no-console
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

  const isDisabled = _.isEmpty(helmChartVersions) || _.keys(helmChartVersions).length === 1;

  const helpText =
    helmAction === HelmActionType.Upgrade && t('helm-plugin~Select the version to upgrade to.');

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
        helpText={!isDisabled ? helpText : ''}
        disabled={isDisabled}
        title={title}
        onChange={handleChartVersionChange}
        required
        fullWidth
      />
    </GridItem>
  );
};

export default HelmChartVersionDropdown;
