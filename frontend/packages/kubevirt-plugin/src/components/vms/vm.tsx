import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateActions,
  EmptyStateHeader,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { RocketIcon } from '@patternfly/react-icons/dist/esm/icons/rocket-icon';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useLocation, Link } from 'react-router-dom-v5-compat';
import { QuickStartModel } from '@console/app/src/models';
import {
  MultiListPage,
  RowFunctionArgs,
  Table,
  TableData,
} from '@console/internal/components/factory';
import {
  Kebab,
  FirehoseResult,
  history,
  ResourceLink,
  Timestamp,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  NamespaceModel,
  NodeModel,
  PersistentVolumeClaimModel,
  PodModel,
} from '@console/internal/models';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared';
import { VMWizardMode, VMWizardName } from '../../constants';
import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { useNamespace } from '../../hooks/use-namespace';
import { VMImportWrappper } from '../../k8s/wrapper/vm-import/vm-import-wrapper';
import {
  DataVolumeModel,
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getCreationTimestamp, getLabels, getName, getNamespace, getUID } from '../../selectors';
import { isVM, isVMI, isVMImport } from '../../selectors/check-type';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { getVMImportStatusAsVMStatus } from '../../statuses/vm-import/vm-import-status';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VMILikeEntityKind } from '../../types/vmLike';
import {
  createLookup,
  dimensifyHeader,
  dimensifyRow,
  getBasicID,
  getLoadedData,
  getVMActionContext,
} from '../../utils';
import { hasPendingChanges } from '../../utils/pending-changes';
import { getVMWizardCreateLink } from '../../utils/url';
import { VMStatus } from '../vm-status/vm-status';
import { vmStatusFilter } from './table-filters';
import VMIP from './VMIP';

import './vm.scss';

const tableColumnClasses = (showNamespace: boolean) => [
  'pf-v5-u-w-16-on-xl pf-v5-u-w-50-on-xs',
  classNames('pf-m-hidden', { 'pf-m-visible-on-lg': showNamespace }),
  '',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-lg',
  '',
  Kebab.columnClass,
];

const VMHeader = (t: TFunction, showNamespace: boolean) => () =>
  dimensifyHeader(
    [
      {
        title: t('kubevirt-plugin~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Status'),
        sortField: 'metadata.status',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Node'),
        sortField: 'metadata.node',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~IP Address'),
      },
      {
        title: '',
      },
    ],
    tableColumnClasses(showNamespace),
  );

const PendingChanges: React.FC = () => {
  const { t } = useTranslation();
  return <div className="kv-vm-row_status-extra-label">{t('kubevirt-plugin~Pending changes')}</div>;
};

const VMRow: React.FC<RowFunctionArgs<VMRowObjType>> = ({ obj }) => {
  const { vm, vmi, vmImport } = obj;
  const { name, namespace, node, creationTimestamp, uid, vmStatusBundle } = obj.metadata;
  const activeNamespace = useNamespace();
  const dimensify = dimensifyRow(tableColumnClasses(!activeNamespace));
  const model =
    (vmImport && VirtualMachineImportModel) ||
    (vm && VirtualMachineModel) ||
    (vmi && VirtualMachineInstanceModel);
  const context = getVMActionContext(vm || vmi);

  const arePendingChanges = hasPendingChanges(vm, vmi);

  return (
    <>
      <TableData className={dimensify()}>
        <ResourceLink kind={kubevirtReferenceForModel(model)} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <VMStatus
          vm={vm}
          vmi={vmi}
          vmStatusBundle={vmStatusBundle}
          arePendingChanges={arePendingChanges}
        />
        {arePendingChanges && <PendingChanges />}
      </TableData>
      <TableData className={dimensify()}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData className={dimensify()}>
        {node && (
          <ResourceLink key="node-link" kind={NodeModel.kind} name={node} namespace={namespace} />
        )}
      </TableData>
      <TableData className={dimensify()}>{vmi && <VMIP data={getVmiIpAddresses(vmi)} />}</TableData>
      <TableData className={dimensify(true)}>
        <LazyActionMenu context={context} key={`kebab-for-${uid}`} />
      </TableData>
    </>
  );
};

const VMListEmpty: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const namespace = useNamespace();
  const searchText = 'virtual machine';
  const [quickStarts, quickStartsLoaded] = useK8sWatchResource<QuickStart[]>({
    kind: kubevirtReferenceForModel(QuickStartModel),
    isList: true,
  });
  const hasQuickStarts =
    quickStartsLoaded &&
    quickStarts.find(
      ({ spec: { displayName, description } }) =>
        displayName.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText),
    );
  return (
    <EmptyState>
      <EmptyStateHeader
        titleText={<>{t('kubevirt-plugin~No virtual machines found')}</>}
        icon={<EmptyStateIcon icon={VirtualMachineIcon} />}
        headingLevel="h4"
      />
      <EmptyStateBody>
        <Trans ns="kubevirt-plugin">
          See the{' '}
          <Link
            data-test="vm-empty-templates"
            to={`${location.pathname}${location.pathname.endsWith('/') ? '' : '/'}templates`}
          >
            templates tab
          </Link>{' '}
          to quickly create a virtual machine from the available templates.
        </Trans>
      </EmptyStateBody>
      <EmptyStateFooter>
        <Button
          data-test="create-vm-empty"
          variant="primary"
          onClick={() =>
            history.push(
              getVMWizardCreateLink({
                namespace,
                wizardName: VMWizardName.BASIC,
                mode: VMWizardMode.VM,
              }),
            )
          }
        >
          {t('kubevirt-plugin~Create virtual machine')}
        </Button>
        {hasQuickStarts && (
          <EmptyStateActions>
            <Button
              data-test="vm-quickstart"
              variant="secondary"
              onClick={() => history.push('/quickstart?keyword=virtual+machine')}
            >
              <RocketIcon className="kv-vm-quickstart-icon" />
              {t('kubevirt-plugin~Learn how to use virtual machines')}
            </Button>
          </EmptyStateActions>
        )}
      </EmptyStateFooter>
    </EmptyState>
  );
};

const VMList: React.FC<React.ComponentProps<typeof Table> & VMListProps> = (props) => {
  const { t } = useTranslation();
  const activeNamespace = useNamespace();
  return (
    <div className="kv-vm-list">
      <Table
        {...props}
        EmptyMsg={VMListEmpty}
        aria-label={t('kubevirt-plugin~Virtual Machines')}
        Header={VMHeader(t, !activeNamespace)}
        Row={VMRow}
        virtualize
      />
    </div>
  );
};

VMList.displayName = 'VMList';

export const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const { skipAccessReview, noProjectsAvailable, showTitle } = props.customData;
  const namespace = params.ns;

  const resources = [
    {
      kind: kubevirtReferenceForModel(VirtualMachineModel),
      namespace,
      prop: 'vms',
    },
    {
      kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
      namespace,
      prop: 'vmis',
    },
    {
      kind: PodModel.kind,
      namespace,
      prop: 'kubevirtPods',
      selector: {
        matchLabels: {
          app: 'kubevirt',
        },
      },
    },
    {
      kind: PodModel.kind,
      namespace,
      prop: 'cdiPods',
      selector: {
        matchLabels: {
          app: 'containerized-data-importer',
        },
      },
    },
    {
      kind: kubevirtReferenceForModel(VirtualMachineInstanceMigrationModel),
      namespace,
      prop: 'migrations',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'pvcs',
    },
    {
      kind: kubevirtReferenceForModel(DataVolumeModel),
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
    {
      kind: kubevirtReferenceForModel(VirtualMachineImportModel),
      isList: true,
      namespace,
      prop: 'vmImports',
      optional: true,
    },
  ];

  const flatten = ({
    vms,
    vmis,
    kubevirtPods,
    cdiPods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  }: {
    vms: FirehoseResult<VMKind[]>;
    vmis: FirehoseResult<VMIKind[]>;
    kubevirtPods: FirehoseResult<PodKind[]>;
    cdiPods: FirehoseResult<PodKind[]>;
    migrations: FirehoseResult;
    pvcs: FirehoseResult<PersistentVolumeClaimKind[]>;
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
    vmImports: FirehoseResult<VMImportKind[]>;
  }) => {
    const loadedVMs = getLoadedData(vms);
    const loadedVMIs = getLoadedData(vmis);
    const loadedKubevirtPods = getLoadedData(kubevirtPods);
    const loadedCDIPods = getLoadedData(cdiPods);
    const loadedMigrations = getLoadedData(migrations);
    const loadedVMImports = getLoadedData(vmImports);
    const loadedPVCs = getLoadedData(pvcs);
    const loadedDataVolumes = getLoadedData(dataVolumes);
    const isVMImportLoaded = !vmImports || vmImports.loaded || vmImports.loadError; // go in when CRD missing or no permissions

    if (
      ![
        loadedVMs,
        loadedVMIs,
        loadedKubevirtPods,
        loadedCDIPods,
        loadedMigrations,
        loadedDataVolumes,
        isVMImportLoaded,
      ].every((v) => v)
    ) {
      return null;
    }

    const vmisLookup = createLookup<VMIKind>(vmis, getBasicID);

    const uniqueVMImportsByTargetName = _.sortedUniqBy(
      [...(loadedVMImports || [])].sort((a, b) =>
        new Date(getCreationTimestamp(a)) > new Date(getCreationTimestamp(b)) ? -1 : 1,
      ),
      (vmImport) => new VMImportWrappper(vmImport).getResolvedVMTargetName(),
    );

    const virtualMachines = _.unionBy(
      // order of arrays designates the priority
      loadedVMs,
      loadedVMIs,
      uniqueVMImportsByTargetName,
      (entity: VMKind | VMIKind | VMImportKind) =>
        entity.kind === VirtualMachineImportModel.kind
          ? `${getNamespace(entity)}-${new VMImportWrappper(entity).getResolvedVMTargetName()}`
          : getBasicID(entity),
    );

    return virtualMachines
      .map((obj: VMILikeEntityKind | VMImportKind) => {
        const lookupID = getBasicID(obj);
        const objectBundle: ObjectBundle = { vm: null, vmi: null, vmImport: null };
        let vmStatusBundle: VMStatusBundle;
        let vmImportStatus: V2VVMImportStatus;

        if (isVMImport(obj)) {
          objectBundle.vmImport = obj;
          const { vmImportStatus: importstatus, ...bundle } = getVMImportStatusAsVMStatus({
            vmImport: obj,
          });
          vmStatusBundle = bundle;
          vmImportStatus = importstatus;
        } else {
          if (isVM(obj)) {
            objectBundle.vm = obj;
            objectBundle.vmi = vmisLookup[lookupID];
          } else if (isVMI(obj)) {
            objectBundle.vmi = obj;
          }

          vmStatusBundle = getVMStatus({
            vm: objectBundle.vm,
            vmi: objectBundle.vmi,
            pods: [...loadedKubevirtPods, ...loadedCDIPods],
            migrations: loadedMigrations,
            pvcs: loadedPVCs,
            dataVolumes: loadedDataVolumes,
            vmImports: loadedVMImports,
          });
        }

        return {
          metadata: {
            name: getName(obj),
            namespace: getNamespace(obj),
            node: getVMINodeName(objectBundle.vmi),
            creationTimestamp: getCreationTimestamp(obj),
            uid: getUID(obj),
            status: vmStatusBundle.status.toSimpleSortString(),
            vmStatusBundle,
            vmImportStatus,
            lookupID,
            labels: getLabels(obj),
          },
          ...objectBundle,
        };
      })
      .filter(({ vmImport, metadata }) => !(vmImport && metadata.vmImportStatus?.isCompleted()));
  };

  const createAccessReview = skipAccessReview ? null : { model: VirtualMachineModel, namespace };
  const modifiedProps = Object.assign({}, { mock: noProjectsAvailable }, props);
  return (
    <MultiListPage
      {...modifiedProps}
      createAccessReview={createAccessReview}
      createButtonText={t('kubevirt-plugin~Create virtual machine')}
      title={VirtualMachineModel.labelPlural}
      showTitle={showTitle}
      rowFilters={[vmStatusFilter(t)]}
      ListComponent={VMList}
      resources={resources}
      flatten={flatten}
      label={VirtualMachineModel.labelPlural}
    />
  );
};

type ObjectBundle = {
  vm: VMKind;
  vmi: VMIKind;
  vmImport: VMImportKind;
};

type VMRowObjType = {
  metadata: {
    name: string;
    namespace: string;
    status: string;
    node: string;
    creationTimestamp: string;
    uid: string;
    lookupID: string;
    vmStatusBundle: VMStatusBundle;
    vmImportStatus?: V2VVMImportStatus;
  };
} & ObjectBundle;

type VMListProps = {
  data: VMRowObjType[];
};

type VirtualMachinesPageProps = {
  customData: {
    showTitle?: boolean;
    skipAccessReview?: boolean;
    noProjectsAvailable?: boolean;
  };
};
