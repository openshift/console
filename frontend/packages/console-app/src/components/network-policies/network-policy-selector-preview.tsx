import * as React from 'react';
import { Alert, Label, Popover, TreeView, TreeViewDataItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { selectorToK8s } from '@console/app/src/components/network-policies/network-policy-model';
import { filterTypeMap } from '@console/internal/components/filter-toolbar';
import { ResourceIcon, resourceListPathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel, PodModel } from '@console/internal/models';
import { K8sResourceCommon, PodKind, Selector } from '@console/internal/module/k8s';

const maxPreviewPods = 10;
const labelFilterQueryParamSeparator = ',';

type NetworkPolicySelectorPreviewProps = {
  podSelector: string[][];
  namespaceSelector?: string[][];
  policyNamespace: string;
  popoverRef: React.MutableRefObject<undefined>;
  dataTest?: string;
};

export const NetworkPolicySelectorPreview: React.FC<NetworkPolicySelectorPreviewProps> = (
  props,
) => {
  const allNamespaces =
    props.namespaceSelector && props.namespaceSelector.filter((pair) => !!pair[0]).length === 0;

  return (
    <>
      <Popover
        aria-label="pods-list"
        headerContent={<p />}
        data-test={props.dataTest ? `${props.dataTest}-popover` : `pods-preview-popover`}
        bodyContent={
          props.namespaceSelector ? (
            allNamespaces ? (
              <PodsPreview podSelector={props.podSelector} />
            ) : (
              <PodsPreview
                namespaceSelector={props.namespaceSelector}
                podSelector={props.podSelector}
              />
            )
          ) : (
            <PodsPreview namespace={props.policyNamespace} podSelector={props.podSelector} />
          )
        }
        reference={props.popoverRef}
        position={'bottom'}
      />
    </>
  );
};

// Prevents illegal selectors to crash the system when passed to useK8sWatchResource
const allowedSelector = /^([A-Za-z0-9][-A-Za-z0-9_\\/.]*)?[A-Za-z0-9]$/;
const safeSelector = (selector?: string[][]): [Selector, string?] => {
  if (!selector || selector?.length === 0) {
    return [{ matchLabels: {} }, undefined];
  }
  for (const label of selector) {
    if (!label[0].match(allowedSelector)) {
      return [{ matchLabels: {} }, label[0]];
    }
    if (!label[1].match(allowedSelector)) {
      return [{ matchLabels: {} }, label[1]];
    }
  }
  return [selectorToK8s(selector) as Selector, undefined];
};

function useWatch<T>(kind: string, selector: Selector, namespace?: string) {
  const watchPods = React.useMemo(
    () => ({
      isList: true,
      kind,
      selector,
      namespace,
    }),
    [kind, namespace, selector],
  );
  return useK8sWatchResource<T[]>(watchPods);
}

/**
 * `podSelector` must be set (even if empty).
 *
 * If `namespace` is set, it will look for pods within this namespace, otherwise:
 *    - if `namespaceSelector` is not set or empty, if will look for pods in all the namespaces
 *    - if `namespaceSelector` is set, it will look for pods in the namespaces with labels matching this selector
 */
type PodsPreviewProps = {
  namespace?: string;
  namespaceSelector?: string[][];
  podSelector: string[][];
};

/**
 * Instantiates a pods preview tree
 * @param props see {@link PodsPreviewProps}
 * @returns a pods preview tree
 */
export const PodsPreview: React.FunctionComponent<PodsPreviewProps> = (props) => {
  const { namespace, podSelector, namespaceSelector } = props;
  const { t } = useTranslation();

  const [safeNsSelector, offendingNsSelector] = React.useMemo(
    () => safeSelector(namespaceSelector),
    [namespaceSelector],
  );

  const [safePodSelector, offendingPodSelector] = React.useMemo(() => safeSelector(podSelector), [
    podSelector,
  ]);

  const [watchedPods, watchPodLoaded, watchPodError] = useWatch<PodKind>(
    PodModel.kind,
    safePodSelector,
    namespace,
  );

  const [watchedNs, watchNsLoaded, watchNsError] = useWatch<K8sResourceCommon>(
    NamespaceModel.kind,
    safeNsSelector,
  );

  const selectorError = React.useMemo(() => {
    if (offendingPodSelector || offendingNsSelector) {
      return t(
        'public~Input error: selectors must start and end by a letter ' +
          'or number, and can only contain -, _, / or . ' +
          'Offending value: {{offendingSelector}}',
        {
          offendingSelector: offendingPodSelector || offendingNsSelector,
        },
      );
    }
    return undefined;
  }, [offendingPodSelector, offendingNsSelector, t]);

  // Converts fetched namespaces to a set for faster lookup
  const matchedNs = React.useMemo(() => {
    const set = new Set<string>();
    if (watchNsLoaded && !watchNsError) {
      for (const ns of watchedNs) {
        const name = ns.metadata?.name;
        if (name) {
          set.add(name);
        }
      }
    }
    return set;
  }, [watchNsError, watchNsLoaded, watchedNs]);

  // takes the first 'maxPreviewPods' received pods and groups them by namespace
  const preview: {
    pods?: TreeViewDataItem[];
    total?: number;
    error?: any;
  } = React.useMemo(() => {
    if (selectorError) {
      return { error: selectorError };
    }
    if (!watchPodLoaded) {
      return { pods: [], total: 0 };
    }
    if (watchPodError) {
      return { error: watchPodError };
    }
    // If there is a defined namespace selector, filter pods to remove
    // those from non-matching namespaces
    let filteredPods = watchedPods;
    if (namespaceSelector) {
      if (watchNsError) {
        return { error: watchNsError };
      }
      filteredPods = filteredPods.filter(
        (pod) => pod.metadata.namespace && matchedNs.has(pod.metadata.namespace),
      );
    }
    // Group pod TreeViewDataItem by namespace, up to a maximum of maxPreviewedPods entries
    const podsByNs: { [key: string]: TreeViewDataItem[] } = {};
    filteredPods.slice(0, maxPreviewPods).forEach((pod) => {
      const ns = pod?.metadata?.namespace as string;
      podsByNs[ns] = podsByNs[ns] || [];
      podsByNs[ns].push({
        name: pod?.metadata?.name,
        icon: <ResourceIcon kind={PodModel.kind} />,
      });
    });
    // Then convert the above groups of pod TreeViewDataItems to subchildren of
    // the namespaces' TreeViewDataItems
    const podTreeEntries = _.toPairs(podsByNs).map(
      ([ns, pods]): TreeViewDataItem => ({
        name: ns,
        children: pods,
        defaultExpanded: true,
        icon: <ResourceIcon kind={NamespaceModel.kind} />,
      }),
    );
    return {
      pods: podTreeEntries,
      total: filteredPods.length,
    };
  }, [
    matchedNs,
    namespaceSelector,
    selectorError,
    watchNsError,
    watchPodError,
    watchPodLoaded,
    watchedPods,
  ]);

  const labelList = _.map(safePodSelector.matchLabels || {}, (value, label) => `${label}=${value}`);
  const labelBadges = _.map(safePodSelector.matchLabels || {}, (value, label) => (
    <Label key={label} value={value} color="green">
      {label}={value}
    </Label>
  ));
  // Filter by labels in the "View all XXX results" link, if needed
  const podsFilterQuery =
    preview.total && preview.total > maxPreviewPods && labelList.length > 0
      ? `?${filterTypeMap.Label}=${encodeURIComponent(
          labelList.join(labelFilterQueryParamSeparator),
        )}`
      : '';

  return preview.error ? (
    <Alert
      data-test="pods-preview-alert"
      variant="danger"
      isInline
      title={t("public~Can't preview pods")}
    >
      <p>{preview.error}</p>
    </Alert>
  ) : (
    <>
      {watchPodLoaded && preview.pods?.length === 0 && (
        <div data-test="pods-preview-title">
          {t('public~No pods matching the provided labels in the current namespace')}
        </div>
      )}
      {preview.pods && preview.pods.length > 0 && (
        <>
          <div data-test="pods-preview-title">
            {labelList?.length > 0 ? (
              <>
                {t('public~List of pods matching')} {labelBadges}
              </>
            ) : (
              t('public~List of pods')
            )}
          </div>
          <TreeView
            data-test="pods-preview-tree"
            className="co-create-networkpolicy__selector-preview"
            data={preview.pods}
            hasGuides
          />
          {preview.total && preview.total > maxPreviewPods && (
            <>
              {_.size(safeNsSelector.matchLabels) === 0 ? (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${resourceListPathFromModel(PodModel, namespace)}${podsFilterQuery}`}
                  data-test="pods-preview-footer-link"
                >
                  {t('public~View all {{total}} results', {
                    total: preview.total,
                  })}
                </a>
              ) : (
                // The PodsList page allows filtering by pod labels for the current namespace
                // or for all the namespaces, but does not allow filtering by namespace labels.
                // So if the namespace selector has labels, we disable the link to avoid
                // directing the user to incorrect data
                <p data-test="pods-preview-footer">
                  {t('public~Showing {{shown}} from {{total}} results', {
                    shown: maxPreviewPods,
                    total: preview.total,
                  })}
                </p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};
