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
import {
  FirehoseResult,
  Kebab,
  KebabOption,
  ResourceLink,
} from '@console/internal/components/utils';
import { fromNow } from '@console/internal/components/utils/datetime';
import { K8sKind, PodKind } from '@console/internal/module/k8s';
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
import { getVMStatus } from '../../statuses/vm/vm-status';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { isVMImport, isVM, isVMI } from '../../selectors/check-type';
import { vmStatusFilter } from './table-filters';
import { vmiMenuActions, vmImportMenuActions, vmMenuActions } from './menu-actions';
import { VMILikeEntityKind } from '../../types/vmLike';
import { getVMWizardCreateLink } from '../../utils/url';
import { VMWizardActionLabels, VMWizardMode, VMWizardName } from '../../constants/vm';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VMStatusBundle } from '../../statuses/vm/types';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { VMImportWrappper } from '../../k8s/wrapper/vm-import/vm-import-wrapper';
import { getVMImportStatusAsVMStatus } from '../../statuses/vm-import/vm-import-status';
import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';

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

  return (
    <TableRow key={`${key}${name}`} id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={model?.kind} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <VMStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
      </TableData>
      <TableData className={dimensify()}>{fromNow(creationTimestamp)}</TableData>
      <TableData className={dimensify()}>
        {node && (
          <ResourceLink key="node-link" kind={NodeModel.kind} name={node} namespace={namespace} />
        )}
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

    const vmisLookup = createLookup<VMIKind>(vmis, getBasicID);
    const virtualMachines = _.unionBy(
      // order of arrays designates the priority
      loadedVMs,
      loadedVMIs,
      loadedVMImports,
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
          },
          ...objectBundle,
        };
      })
      .filter(({ vm, vmi, vmImport, metadata }) => {
        if (vmImport && metadata.vmImportStatus?.isCompleted()) {
          return false;
        }

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
