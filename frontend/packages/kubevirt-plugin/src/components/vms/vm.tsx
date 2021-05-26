import * as React from 'react';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateSecondaryActions,
  Title,
} from '@patternfly/react-core';
import { RocketIcon, VirtualMachineIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { Link, useLocation } from 'react-router-dom';
import { QuickStart } from '@console/app/src/components/quick-starts/utils/quick-start-types';
import { QuickStartModel } from '@console/app/src/models';
import {
  MultiListPage,
  RowFunction,
  Table,
  TableData,
  TableRow,
} from '@console/internal/components/factory';
import {
  FirehoseResult,
  history,
  Kebab,
  KebabOption,
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
import {
  K8sKind,
  PersistentVolumeClaimKind,
  PodKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import {
  createLookup,
  dimensifyHeader,
  dimensifyRow,
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getUID,
} from '@console/shared';
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
import { isVM, isVMI, isVMImport } from '../../selectors/check-type';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { getVMImportStatusAsVMStatus } from '../../statuses/vm-import/vm-import-status';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VMILikeEntityKind } from '../../types/vmLike';
import { getBasicID, getLoadedData } from '../../utils';
import { hasPendingChanges } from '../../utils/pending-changes';
import { getVMWizardCreateLink } from '../../utils/url';
import { VMStatus } from '../vm-status/vm-status';
import { vmiMenuActions, vmImportMenuActions, vmMenuActions } from './menu-actions';
import { vmStatusFilter } from './table-filters';
import VMIP from './VMIP';

import './vm.scss';

const tableColumnClasses = [
  'pf-u-w-16-on-xl pf-u-w-50-on-xs',
  'pf-m-hidden pf-m-visible-on-lg',
  '',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-lg',
  '',
  Kebab.columnClass,
];

const VMHeader = (t: TFunction) => () =>
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
    tableColumnClasses,
  );

const PendingChanges: React.FC = () => {
  const { t } = useTranslation();
  return <div className="kv-vm-row_status-extra-label">{t('kubevirt-plugin~Pending changes')}</div>;
};

const VMRow: RowFunction<VMRowObjType> = ({ obj, index, key, style }) => {
  const { vm, vmi, vmImport } = obj;
  const { name, namespace, node, creationTimestamp, uid, vmStatusBundle } = obj.metadata;
  const dimensify = dimensifyRow(tableColumnClasses);

  let options: KebabOption[];
  let model: K8sKind;

  if (vmImport) {
    model = VirtualMachineImportModel;
    options = vmImportMenuActions.map((action) => action(model, vmImport));
  } else if (vm) {
    model = VirtualMachineModel;
    options = vmMenuActions.map((action) =>
      action(model, vm, {
        vmStatusBundle,
        vmi,
      }),
    );
  } else if (vmi) {
    model = VirtualMachineInstanceModel;
    options = vmiMenuActions.map((action) => action(model, vmi));
  }

  const arePendingChanges = hasPendingChanges(vm, vmi);

  return (
    <TableRow key={`${key}${name}`} id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={model?.kind} name={name} namespace={namespace} />
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
        <Kebab options={options} key={`kebab-for-${uid}`} id={`kebab-for-${uid}`} />
      </TableData>
    </TableRow>
  );
};

const VMListEmpty: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const namespace = useNamespace();

  const searchText = 'virtual machine';
  const [quickStarts, quickStartsLoaded] = useK8sWatchResource<QuickStart[]>({
    kind: referenceForModel(QuickStartModel),
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
      <EmptyStateIcon icon={VirtualMachineIcon} />
      <Title headingLevel="h4" size="lg">
        {t('kubevirt-plugin~No virtual machines found')}
      </Title>
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
        <EmptyStateSecondaryActions>
          <Button
            data-test="vm-quickstart"
            variant="secondary"
            onClick={() => history.push('/quickstart?keyword=virtual+machine')}
          >
            <RocketIcon className="kv-vm-quickstart-icon" />
            {t('kubevirt-plugin~Learn how to use virtual machines')}
          </Button>
        </EmptyStateSecondaryActions>
      )}
    </EmptyState>
  );
};

const VMList: React.FC<React.ComponentProps<typeof Table> & VMListProps> = (props) => {
  const { t } = useTranslation();
  return (
    <div className="kv-vm-list">
      <Table
        {...props}
        EmptyMsg={VMListEmpty}
        aria-label={t('kubevirt-plugin~Virtual Machines')}
        Header={VMHeader(t)}
        Row={VMRow}
        virtualize
      />
    </div>
  );
};

VMList.displayName = 'VMList';

const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = (props) => {
  const { t } = useTranslation();
  const { skipAccessReview, noProjectsAvailable, showTitle } = props.customData;
  const namespace = props.match.params.ns;

  const resources = [
    {
      kind: VirtualMachineModel.kind,
      namespace,
      prop: 'vms',
    },
    {
      kind: VirtualMachineInstanceModel.kind,
      namespace,
      prop: 'vmis',
    },
    {
      kind: PodModel.kind,
      namespace,
      prop: 'pods',
    },
    {
      kind: VirtualMachineInstanceMigrationModel.kind,
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
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
    {
      kind: VirtualMachineImportModel.kind,
      isList: true,
      namespace,
      prop: 'vmImports',
      optional: true,
    },
  ];

  const flatten = ({
    vms,
    vmis,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  }: {
    vms: FirehoseResult<VMKind[]>;
    vmis: FirehoseResult<VMIKind[]>;
    pods: FirehoseResult<PodKind[]>;
    migrations: FirehoseResult;
    pvcs: FirehoseResult<PersistentVolumeClaimKind[]>;
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
    vmImports: FirehoseResult<VMImportKind[]>;
  }) => {
    const loadedVMs = getLoadedData(vms);
    const loadedVMIs = getLoadedData(vmis);
    const loadedPods = getLoadedData(pods);
    const loadedMigrations = getLoadedData(migrations);
    const loadedVMImports = getLoadedData(vmImports);
    const loadedPVCs = getLoadedData(pvcs);
    const loadedDataVolumes = getLoadedData(dataVolumes);
    const isVMImportLoaded = !vmImports || vmImports.loaded || vmImports.loadError; // go in when CRD missing or no permissions

    if (
      ![
        loadedVMs,
        loadedVMIs,
        loadedPods,
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
            pods: loadedPods,
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
      rowFilters={[vmStatusFilter]}
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
  match: match<{ ns?: string }>;
  customData: {
    showTitle?: boolean;
    skipAccessReview?: boolean;
    noProjectsAvailable?: boolean;
  };
};

export { VirtualMachinesPage };
