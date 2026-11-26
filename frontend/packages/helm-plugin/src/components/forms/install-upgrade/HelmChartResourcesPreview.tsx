import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  ExpandableSection,
  Label,
  Spinner,
} from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import { loadAll, safeDump, safeLoad, DEFAULT_SAFE_SCHEMA } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { coFetch } from '@console/shared/src/utils/console-fetch';

import './HelmChartResourcesPreview.scss';

const parseManifestYaml = (yamlText: string): K8sResourceKind[] => {
  if (!yamlText) {
    return [];
  }
  const manifests = loadAll(yamlText, null, { schema: DEFAULT_SAFE_SCHEMA, json: true });
  const flattened = manifests.flatMap((resource: K8sResourceKind) => {
    if (resource?.kind === 'List' && Array.isArray((resource as any).items)) {
      return (resource as any).items;
    }
    return [resource];
  });
  return flattened.filter(Boolean);
};

const resourceToYaml = (resource: K8sResourceKind): string => {
  try {
    return safeDump(resource, { lineWidth: -1, noRefs: true });
  } catch {
    return JSON.stringify(resource, null, 2);
  }
};

interface HelmChartResourcesPreviewProps {
  chartURL: string;
  indexEntry?: string;
  releaseName: string;
  namespace: string;
  editorType: EditorType;
  yamlData: string;
  formData: any;
  basicAuthSecretName?: string;
  noRepo?: boolean;
}

const HelmChartResourcesPreview: FC<HelmChartResourcesPreviewProps> = ({
  chartURL,
  indexEntry,
  releaseName,
  namespace,
  editorType,
  yamlData,
  formData,
  basicAuthSecretName,
  noRepo,
}) => {
  const { t } = useTranslation('helm-plugin');
  const [isExpanded, setIsExpanded] = useState(false);
  const [resources, setResources] = useState<K8sResourceKind[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(null);
  const hasFetched = useRef(false);

  const fetchPreview = useCallback(async () => {
    if (!chartURL && !indexEntry && !releaseName) return;
    setLoading(true);
    setError(null);
    try {
      let valuesObj = {};
      if (editorType === EditorType.Form && formData) {
        valuesObj = prune(formData) || {};
      } else if (yamlData) {
        valuesObj = (safeLoad(yamlData) as any) || {};
      }

      const payload = {
        name: releaseName || 'preview-release',
        namespace,
        ...(chartURL ? { chart_url: chartURL } : {}),
        ...(indexEntry ? { indexEntry } : {}),
        ...(noRepo ? { noRepo: true } : {}),
        ...(basicAuthSecretName ? { basic_auth_secret_name: basicAuthSecretName } : {}),
        values: valuesObj,
      };

      const response = await coFetch('/api/helm/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const yamlResponse = await response.text();
      const parsed = parseManifestYaml(yamlResponse);
      setResources(parsed);
    } catch (e) {
      setError(e.message || t('Failed to render chart template'));
    } finally {
      hasFetched.current = true;
      setLoading(false);
    }
  }, [
    chartURL,
    indexEntry,
    releaseName,
    namespace,
    editorType,
    yamlData,
    formData,
    noRepo,
    basicAuthSecretName,
    t,
  ]);

  useEffect(() => {
    if (isExpanded && !hasFetched.current && !loading) {
      fetchPreview();
    }
  }, [isExpanded, fetchPreview, loading]);

  const resourceSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.kind] = (counts[r.kind] || 0) + 1;
    });
    return counts;
  }, [resources]);

  return (
    <ExpandableSection
      toggleText={
        resources.length > 0
          ? t('Resource preview ({{count}} resources)', { count: resources.length })
          : t('Resource preview')
      }
      onToggle={(_e, expanded) => setIsExpanded(expanded)}
      isExpanded={isExpanded}
      data-test="helm-chart-resources-preview"
    >
      {error && (
        <Alert variant="warning" isInline isPlain title={error} className="pf-v6-u-mb-sm" />
      )}

      {loading && (
        <div className="co-helm-resources-preview__loading">
          <Spinner size="lg" />
          <span>{t('Rendering chart template...')}</span>
        </div>
      )}

      {!loading && resources.length > 0 && (
        <>
          <div className="co-helm-resources-preview__toolbar">
            <div className="co-helm-resources-preview__summary">
              {Object.entries(resourceSummary).map(([kind, count]) => (
                <Label key={kind} isCompact>
                  {kind}: {count}
                </Label>
              ))}
            </div>
            <Button variant="link" icon={<SyncAltIcon />} onClick={fetchPreview} size="sm">
              {t('Refresh')}
            </Button>
          </div>

          <div className="co-helm-resources-preview__list">
            {resources.map((resource) => {
              const key = `${resource.kind}/${resource.metadata?.name}`;
              return (
                <ExpandableSection
                  key={key}
                  toggleText={`${resource.kind}: ${resource.metadata?.name || 'unknown'}`}
                  className="co-helm-resources-preview__resource"
                  data-test={`resource-preview-${resource.kind}-${resource.metadata?.name}`}
                >
                  <CodeBlock>
                    <CodeBlockCode>{resourceToYaml(resource)}</CodeBlockCode>
                  </CodeBlock>
                </ExpandableSection>
              );
            })}
          </div>
        </>
      )}
    </ExpandableSection>
  );
};

export default HelmChartResourcesPreview;
