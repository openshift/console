import * as React from 'react';
import {
  Alert,
  Button,
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Tooltip,
} from '@patternfly/react-core';
import { EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { selectorToK8s } from '@console/app/src/components/network-policies/network-policy-model';
import { ResourceIcon } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel, PodModel } from '@console/internal/models';
import { K8sResourceCommon, PodKind, Selector } from '@console/internal/module/k8s';

type NetworkPolicySelectorPreviewProps = {
  podSelector: string[][];
  namespaceSelector?: string[][];
  policyNamespace: string;
};

export const NetworkPolicySelectorPreview: React.FC<NetworkPolicySelectorPreviewProps> = (
  props,
) => {
  const { t } = useTranslation();
  const [visible, setVisible] = React.useState(false);
  const allNamespaces =
    props.namespaceSelector && props.namespaceSelector.filter((pair) => !!pair[0]).length === 0;

  return (
    <>
      <Tooltip
        content={
          <div>
            {t(
              "public~The list of pods excludes any pod that the logged-in user hasn't access to, even if the rule accepts them.",
            )}
          </div>
        }
      >
        <Button onClick={() => setVisible(!visible)}>
          {visible ? <EyeSlashIcon /> : <EyeIcon />} {t('public~Pods preview')}
        </Button>
      </Tooltip>
      {visible && (
        <DataList aria-label="pods-list">
          {props.namespaceSelector ? (
            allNamespaces ? (
              <PodsPreview selector={props.podSelector} />
            ) : (
              <NamespacesPreview
                namespaceSelector={props.namespaceSelector}
                podSelector={props.podSelector}
              />
            )
          ) : (
            <PodsPreview namespace={props.policyNamespace} selector={props.podSelector} />
          )}
        </DataList>
      )}
    </>
  );
};

type PodsPreviewProps = {
  namespace?: string;
  selector: string[][];
};

const PodsPreview: React.FunctionComponent<PodsPreviewProps> = (props) => {
  const { namespace, selector } = props;
  const { t } = useTranslation();

  const watchedResource = React.useMemo(
    () => ({
      isList: true,
      kind: 'Pod',
      selector: selectorToK8s(selector, { matchLabels: {} }) as Selector,
      namespace,
    }),
    [namespace, selector],
  );

  const [selectedPods, podsLoaded, loadError] = useK8sWatchResource<PodKind[]>(watchedResource);

  return (
    <>
      {loadError && (
        <Alert variant="danger" title={t("public~Can't preview pods")}>
          <p>
            {t('public~Reason:')} {loadError}
          </p>
        </Alert>
      )}
      {podsLoaded &&
        !loadError &&
        selectedPods.map((pod) => (
          <DataListItem key={`${pod.metadata.name}.${pod.metadata.namespace}`}>
            <DataListItemRow>
              <DataListItemCells
                dataListCells={[
                  <DataListCell key="ns">
                    <ResourceIcon kind={NamespaceModel.kind} />
                    {pod.metadata.namespace}
                  </DataListCell>,
                  <DataListCell key="pod">
                    <ResourceIcon kind={PodModel.kind} />
                    {pod.metadata.name}
                  </DataListCell>,
                ]}
              />
            </DataListItemRow>
          </DataListItem>
        ))}
    </>
  );
};

type NamespacesPreviewProps = {
  namespaceSelector: string[][];
  podSelector: string[][];
};

export const NamespacesPreview: React.FunctionComponent<NamespacesPreviewProps> = ({
  namespaceSelector,
  podSelector,
}) => {
  const { t } = useTranslation();

  const watchedResource = React.useMemo(
    () => ({
      isList: true,
      kind: 'Namespace',
      selector: selectorToK8s(namespaceSelector, { matchLabels: {} }) as Selector,
    }),
    [namespaceSelector],
  );

  const [namespaces, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>(watchedResource);
  return (
    <>
      {loadError && (
        <Alert variant="danger" title={t("public~Can't load namespaces")}>
          <p>
            {t('public~Reason:')} {loadError}
          </p>
        </Alert>
      )}
      {loaded &&
        !loadError &&
        namespaces.map((ns) => (
          <PodsPreview
            key={ns.metadata?.name}
            namespace={ns.metadata?.name}
            selector={podSelector}
          />
        ))}
    </>
  );
};
