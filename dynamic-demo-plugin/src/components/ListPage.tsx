import * as React from 'react';
import {
  DocumentTitle,
  ListPageHeader,
  ListPageBody,
  ListPageCreate,
  ConsoleDataView,
  k8sDelete,
  useUserPreference,
  useK8sWatchResource,
  useK8sModel,
  useOverlay,
  useToast,
  ResourceLink,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import type {
  Action,
  ColumnLayout,
  ConsoleDataViewColumn,
  ConsoleDataViewSelectionActions,
  GetDataViewRows,
  K8sGroupVersionKind,
  K8sResourceCommon,
  OverlayComponent,
  ResourceFilters,
} from '@openshift-console/dynamic-plugin-sdk';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import {
  AlertVariant,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { isPixaaPod } from './pixaa-pods';

const POD_GVK: K8sGroupVersionKind = { version: 'v1', kind: 'Pod' };
const TABLE_ID = 'console-demo-plugin~v1~Pod';
const COLUMN_MANAGEMENT_PREFERENCE_KEY = 'console.tableColumns';

type PodFilters = ResourceFilters & { 'pod-app': string[] };
const initialFilters: PodFilters = { 'pod-app': [] };

const getPodType = (name: string | undefined): string => {
  if (isPixaaPod(name)) return 'pixaa';
  return name?.includes('kube-scheduler') ? 'scheduler' : 'other';
};

type PodsTableProps = {
  data: K8sResourceCommon[];
  loaded: boolean;
  loadError: unknown;
};

const getPodId = (pod: K8sResourceCommon): string =>
  pod.metadata.uid ?? `${pod.metadata.namespace}/${pod.metadata.name}`;

type KillPodsModalProps = {
  hasPodsToKill: boolean;
  onConfirm: () => Promise<void>;
};

const KillPodsModal: OverlayComponent<KillPodsModalProps> = ({
  closeOverlay,
  hasPodsToKill,
  onConfirm,
}) => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const [isKilling, setIsKilling] = React.useState(false);

  const handleConfirm = async () => {
    setIsKilling(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Could not kill selected pods', error);
    } finally {
      closeOverlay();
    }
  };

  return (
    <Modal variant={ModalVariant.small} isOpen onClose={() => !isKilling && closeOverlay()}>
      <ModalHeader title={t('Kill selected pods?')} titleIconVariant="warning" />
      <ModalBody>
        {t(
          'This deletes selected pods except PIXAA pods. PIXAA pods are durable and remain selected. Controllers may recreate deleted pods.',
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          isLoading={isKilling}
          isDisabled={isKilling || !hasPodsToKill}
          onClick={handleConfirm}
        >
          {t('Kill pods')}
        </Button>
        <Button variant="link" isDisabled={isKilling} onClick={closeOverlay}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const usePodBulkActions = () => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const [podModel] = useK8sModel(POD_GVK);
  const launchOverlay = useOverlay();
  const toast = useToast();

  const killSelectedPods = React.useCallback(
    async (selectedPods: K8sResourceCommon[], deselect: (itemIds: string[]) => void) => {
      const podsToKill = selectedPods.filter((pod) => !isPixaaPod(pod.metadata.name));
      if (!podModel || podsToKill.length === 0) {
        return;
      }
      const results = await Promise.allSettled(
        podsToKill.map((pod) => k8sDelete({ model: podModel, resource: pod })),
      );
      const killedIds = podsToKill
        .filter((_, index) => results[index].status === 'fulfilled')
        .map(getPodId);
      const failedCount = results.length - killedIds.length;
      deselect(killedIds);
      if (killedIds.length > 0) {
        toast.addToast({
          title: t('Killed selected pods'),
          content: t('Kubernetes may recreate pods managed by a controller.'),
          variant: AlertVariant.success,
        });
      }
      if (failedCount > 0) {
        toast.addToast({
          title: t('Could not kill selected pods'),
          content: t('The failed pods remain selected. Check permissions and try again.'),
          variant: AlertVariant.danger,
        });
      }
    },
    [podModel, t, toast],
  );

  return React.useCallback(
    ({ selectedItems, deselect }: ConsoleDataViewSelectionActions<K8sResourceCommon>): Action[] => {
      const hasPodsToKill = selectedItems.some((pod) => !isPixaaPod(pod.metadata.name));
      return [
        {
          id: 'kill-selected-pods',
          label: t('Kill selected pods'),
          description: t('PIXAA pods are durable and are skipped by this action.'),
          disabled: !podModel || !hasPodsToKill,
          cta: () =>
            launchOverlay(KillPodsModal, {
              hasPodsToKill,
              onConfirm: () => killSelectedPods(selectedItems, deselect),
            }),
        },
      ];
    },
    [killSelectedPods, launchOverlay, podModel, t],
  );
};

const PodsTable: React.FC<PodsTableProps> = ({ data, loaded, loadError }) => {
  const { t } = useTranslation('plugin__console-demo-plugin');
  const getPodActions = usePodBulkActions();
  const podTypeOptions = React.useMemo(
    () => [
      { value: 'scheduler', label: t('Scheduler pods') },
      { value: 'pixaa', label: t('PIXAA pods') },
      { value: 'other', label: t('Other pods') },
    ],
    [t],
  );
  const additionalFilterNodes = React.useMemo(
    () => [
      <DataViewCheckboxFilter
        key="pod-app"
        filterId="pod-app"
        title={t('Pod type')}
        placeholder={t('Filter by pod type')}
        options={podTypeOptions}
      />,
    ],
    [podTypeOptions, t],
  );
  const matchesAdditionalFilters = React.useCallback(
    (pod: K8sResourceCommon, filters: PodFilters) =>
      filters['pod-app'].length === 0 || filters['pod-app'].includes(getPodType(pod.metadata.name)),
    [],
  );
  const [selectedColumnPreferences] = useUserPreference<Record<string, string[]>>(
    COLUMN_MANAGEMENT_PREFERENCE_KEY,
    undefined,
    true,
  );
  const getPodDataViewRows = React.useCallback<GetDataViewRows<K8sResourceCommon>>(
    (rows, activeColumns) =>
      rows.map(({ obj }) =>
        activeColumns.map(({ id }) => ({
          id,
          cell:
            id === 'name' ? (
              <ResourceLink
                kind="Pod"
                name={obj.metadata.name}
                namespace={obj.metadata.namespace}
              />
            ) : id === 'namespace' ? (
              <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
            ) : id === 'actions' ? undefined : null,
        })),
      ),
    [],
  );

  const columns = React.useMemo<ConsoleDataViewColumn<K8sResourceCommon>[]>(
    () => [
      {
        title: t('Name'),
        id: 'name',
        type: 'name' as const,
        sort: 'metadata.name',
      },
      {
        title: t('Namespace'),
        id: 'namespace',
        sort: 'metadata.namespace',
      },
      { id: 'actions', type: 'actions' as const },
    ],
    [t],
  );

  const columnLayout = React.useMemo<Omit<ColumnLayout, 'id'>>(
    () => ({
      type: t('Pod'),
      columns: columns.map(({ id, title, additional }) => ({ id, title, additional })),
      selectedColumns: new Set(selectedColumnPreferences?.[TABLE_ID] ?? []),
      showNamespaceOverride: true,
    }),
    [columns, selectedColumnPreferences, t],
  );

  return (
    <ConsoleDataView<K8sResourceCommon, unknown, PodFilters>
      id={TABLE_ID}
      columnLayout={columnLayout}
      label={t('Pods')}
      data={data}
      loaded={loaded}
      loadError={loadError}
      columns={columns}
      initialFilters={initialFilters}
      additionalFilterNodes={additionalFilterNodes}
      matchesAdditionalFilters={matchesAdditionalFilters}
      getDataViewRows={getPodDataViewRows}
      selection={{
        getItemId: getPodId,
        getActions: getPodActions,
      }}
      showNamespaceOverride
    />
  );
};

const ListPage = () => {
  const [pods, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: POD_GVK,
    isList: true,
    namespaced: true,
  });
  const { t } = useTranslation('plugin__console-demo-plugin');

  const listPods = React.useMemo(
    () =>
      (pods ?? []).filter(
        ({ metadata }) => metadata.namespace === 'default' || metadata.name?.includes('openshift'),
      ),
    [pods],
  );
  return (
    <>
      <DocumentTitle>{t('List Page')}</DocumentTitle>
      <ListPageHeader title={t('OpenShift Pods List Page')}>
        <ListPageCreate groupVersionKind="Pod">{t('Create Pod')}</ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <PodsTable data={listPods} loaded={loaded} loadError={loadError} />
      </ListPageBody>
      <ListPageBody>
        <p>{t('Sample ResourceIcon')}</p>
        <p>
          <ResourceIcon kind="Pod" />
        </p>
      </ListPageBody>
    </>
  );
};

export default ListPage;
