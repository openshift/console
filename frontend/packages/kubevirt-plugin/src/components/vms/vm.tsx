import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { match } from 'react-router';
import { sortable } from '@patternfly/react-table';
import {
  createLookup,
  dimensifyHeader,
  dimensifyRow,
  getCreationTimestamp,
  getDeletetionTimestamp,
  getName,
  getNamespace,
  getOwnerReferences,
  getUID,
} from '@console/shared';
import { withStartGuide } from '@console/internal/components/start-guide';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { NamespaceModel, PodModel, NodeModel } from '@console/internal/models';
import {
  Table,
  MultiListPage,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import { FirehoseResult, Kebab, ResourceLink } from '@console/internal/components/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { PodKind } from '@console/internal/module/k8s';
import { VMStatus } from '../vm-status/vm-status';
import {
  DataVolumeModel,
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VMIKind, VMKind } from '../../types';
import { buildOwnerReferenceForModel, getBasicID, getLoadedData } from '../../utils';
import { getVMStatus } from '../../statuses/vm/vm';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { getVMLikeModel, isVM } from '../../selectors/vm';
import { vmStatusFilter } from './table-filters';
import { vmiMenuActions, vmMenuActions } from './menu-actions';
import { VMILikeEntityKind } from '../../types/vmLike';
import { getVMWizardCreateLink } from '../../utils/url';
import { VMWizardActionLabels, VMWizardMode, VMWizardName } from '../../constants/vm';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VMStatusBundle } from '../../statuses/vm/types';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';

import './vm.scss';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-6', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-3', 'col-xs-3'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-3', 'col-xs-3'),
  Kebab.columnClass,
];

const VMHeader = () =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Status',
        sortField: 'metadata.status',
        transforms: [sortable],
      },
      {
        title: 'Created',
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
      },
      {
        title: 'Node',
        sortField: 'metadata.node',
        transforms: [sortable],
      },
      {
        title: 'IP Address',
      },
      {
        title: '',
      },
    ],
    tableColumnClasses,
  );

const VMRow: RowFunction<VMRowObjType> = ({ obj, index, key, style }) => {
  const { vm, vmi } = obj;
  const { name, namespace, node, creationTimestamp, uid, vmStatusBundle } = obj.metadata;
  const dimensify = dimensifyRow(tableColumnClasses);

  const options = vm
    ? vmMenuActions.map((action) =>
        action(VirtualMachineModel, vm, {
          vmStatusBundle,
          vmi,
        }),
      )
    : vmiMenuActions.map((action) => action(VirtualMachineInstanceModel, vmi));

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={getVMLikeModel(vm || vmi).kind} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <VMStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
      </TableData>
      <TableData className={dimensify()}>{fromNow(creationTimestamp)}</TableData>
      <TableData className={dimensify()}>
        {node && <ResourceLink kind={NodeModel.kind} name={node} namespace={namespace} />}
      </TableData>
      <TableData className={dimensify()}>{vmi && getVmiIpAddresses(vmi).join(', ')}</TableData>
      <TableData className={dimensify(true)}>
        <Kebab options={options} key={`kebab-for-${uid}`} id={`kebab-for-${uid}`} />
      </TableData>
    </TableRow>
  );
};

const VMList: React.FC<React.ComponentProps<typeof Table> & VMListProps> = (props) => (
  <div className="kubevirt-vm-list">
    <Table
      {...props}
      aria-label={VirtualMachineModel.labelPlural}
      Header={VMHeader}
      Row={VMRow}
      virtualize
    />
  </div>
);

VMList.displayName = 'VMList';

const wizardImportName = 'wizardImport';
const getCreateProps = ({ namespace }: { namespace: string }) => {
  const items: any = {
    [VMWizardName.WIZARD]: VMWizardActionLabels.WIZARD,
    [VMWizardName.YAML]: VMWizardActionLabels.YAML,
    [wizardImportName]: VMWizardActionLabels.IMPORT,
  };

  return {
    items,
    createLink: (wizardName) =>
      getVMWizardCreateLink({
        namespace,
        wizardName: wizardName === wizardImportName ? VMWizardName.WIZARD : wizardName,
        mode: wizardName === wizardImportName ? VMWizardMode.IMPORT : VMWizardMode.VM,
      }),
  };
};

export const WrappedVirtualMachinesPage: React.FC<VirtualMachinesPageProps> = (props) => {
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
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
    {
      kind: VirtualMachineImportModel.kind,
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
    dataVolumes,
    vmImports,
  }: {
    vms: FirehoseResult<VMKind[]>;
    vmis: FirehoseResult<VMIKind[]>;
    pods: FirehoseResult<PodKind[]>;
    migrations: FirehoseResult;
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
    vmImports: FirehoseResult<VMImportKind[]>;
  }) => {
    const loadedVMs = getLoadedData(vms);
    const loadedVMIs = getLoadedData(vmis);
    const loadedPods = getLoadedData(pods);
    const loadedMigrations = getLoadedData(migrations);
    const loadedVMImports = getLoadedData(vmImports);
    const loadedDataVolumes = getLoadedData(dataVolumes);
    const isVMImportLoaded = !vmImports || vmImports.loaded; // go in when CRD missing

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

    const vmisLookup = createLookup(vmis, getBasicID);
    const virtualMachines = _.unionBy(loadedVMs, loadedVMIs, getBasicID);

    return virtualMachines
      .map((obj: VMILikeEntityKind) => {
        const lookupID = getBasicID(obj);
        const { vm, vmi } = isVM(obj)
          ? { vm: obj as VMKind, vmi: vmisLookup[lookupID] as VMIKind }
          : { vm: null, vmi: obj as VMIKind };

        const vmStatusBundle = getVMStatus({
          vm,
          vmi,
          pods: loadedPods,
          migrations: loadedMigrations,
          dataVolumes: loadedDataVolumes,
          vmImports: loadedVMImports,
        });

        return {
          metadata: {
            name: getName(obj),
            namespace: getNamespace(obj),
            vmStatusBundle,
            status: vmStatusBundle.status.toSimpleSortString(),
            node: getVMINodeName(vmi),
            creationTimestamp: getCreationTimestamp(obj),
            uid: getUID(obj),
            lookupID,
          },
          vm,
          vmi,
        };
      })
      .filter(({ vm, vmi }) => {
        if (vm || !getDeletetionTimestamp(vmi)) {
          return true;
        }
        const vmOwnerReference = buildOwnerReferenceForModel(VirtualMachineModel, getName(vmi));

        // show finalizing VMIs only if they are not owned by VM
        return !(getOwnerReferences(vmi) || []).some((o) =>
          compareOwnerReference(o, vmOwnerReference),
        );
      });
  };

  const createAccessReview = skipAccessReview ? null : { model: VirtualMachineModel, namespace };
  const modifiedProps = Object.assign({}, { mock: noProjectsAvailable }, props);

  return (
    <MultiListPage
      {...modifiedProps}
      createAccessReview={createAccessReview}
      createButtonText="Create Virtual Machine"
      canCreate
      title={VirtualMachineModel.labelPlural}
      showTitle={showTitle}
      rowFilters={[vmStatusFilter]}
      ListComponent={VMList}
      createProps={getCreateProps({ namespace })}
      resources={resources}
      flatten={flatten}
      label={VirtualMachineModel.labelPlural}
    />
  );
};

const VirtualMachinesPage = withStartGuide(WrappedVirtualMachinesPage);

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
  };
  vm: VMKind;
  vmi: VMIKind;
};

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
