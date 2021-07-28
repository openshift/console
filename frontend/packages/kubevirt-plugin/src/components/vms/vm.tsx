import * as React from 'react';
import { QuickStart } from '@patternfly/quickstarts';
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
import { Trans, useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { Link, useLocation } from 'react-router-dom';
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
  ResourceLink,
  Timestamp,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { NamespaceModel, NodeModel } from '@console/internal/models';
import { K8sKind } from '@console/internal/module/k8s';
import { VMWizardMode, VMWizardName } from '../../constants';
import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { useNamespace } from '../../hooks/use-namespace';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import {
  getCreationTimestamp,
  getLabels,
  getName,
  getNamespace,
  getOwnerReferences,
  getUID,
} from '../../selectors';
import { isVM, isVMI } from '../../selectors/check-type';
import { getVmiIpAddresses, getVMINodeName } from '../../selectors/vmi';
import { VMStatusBundle } from '../../statuses/vm/types';
import { VMIKind, VMKind } from '../../types';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VMILikeEntityKind } from '../../types/vmLike';
import {
  createLookup,
  dimensifyHeader,
  dimensifyRow,
  getBasicID,
  getLoadedData,
} from '../../utils';
import { getVMWizardCreateLink } from '../../utils/url';
import { LazyVmRowKebab } from '../vm-status/lazy-vm-row-kebab';
import { LazyVMStatus } from '../vm-status/lazy-vm-status';
import { useVmStatusResources, VmStatusResourcesValue } from '../vm-status/use-vm-status-resources';
import { useVmStatusFilter } from './table-filters';
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

const VMRow: RowFunction<VMRowObjType, VmStatusResourcesValue> = ({
  obj,
  index,
  key,
  style,
  customData: vmStatusResources,
}) => {
  const { vm, vmi } = obj;
  const { name, namespace, creationTimestamp, uid, node } = obj.metadata;
  const dimensify = dimensifyRow(tableColumnClasses);

  let model: K8sKind;

  if (vm) {
    model = VirtualMachineModel;
  } else if (vmi) {
    model = VirtualMachineInstanceModel;
  }

  return (
    <TableRow key={`${key}${name}`} id={uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink kind={kubevirtReferenceForModel(model)} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <LazyVMStatus vm={vm} vmi={vmi} vmStatusResources={vmStatusResources} />
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
        <LazyVmRowKebab
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
          vm={vm}
          vmi={vmi}
          vmStatusResources={vmStatusResources}
        />
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
  const vmStatusResources = useVmStatusResources(namespace);
  const vmRowFilter = useVmStatusFilter(vmStatusResources);

  const resources = React.useMemo(
    () => [
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
    ],
    [namespace],
  );

  const flatten = ({
    vms,
    vmis,
  }: {
    vms: FirehoseResult<VMKind[]>;
    vmis: FirehoseResult<VMIKind[]>;
  }) => {
    const loadedVMs = getLoadedData(vms);
    const loadedVMIs = getLoadedData(vmis);

    if (![loadedVMs, loadedVMIs].every((v) => v)) {
      return null;
    }
    const vmisLookup = createLookup<VMIKind>(vmis, getBasicID);

    const virtualMachines = [
      ...loadedVMs,
      ...loadedVMIs.filter(
        (vmi) => !getOwnerReferences(vmi)?.find((owner) => owner.kind === VirtualMachineModel.kind),
      ),
    ];

    return virtualMachines.map((obj: VMILikeEntityKind) => {
      const objectBundle: ObjectBundle = { vm: null, vmi: null, vmImport: null };
      const lookupID = getBasicID(obj);

      if (isVM(obj)) {
        objectBundle.vm = obj;
        objectBundle.vmi = vmisLookup[lookupID];
      } else if (isVMI(obj)) {
        objectBundle.vmi = obj;
      }
      return {
        metadata: {
          name: getName(obj),
          namespace: getNamespace(obj),
          creationTimestamp: getCreationTimestamp(obj),
          node: getVMINodeName(objectBundle.vmi),
          uid: getUID(obj),
          lookupID,
          labels: getLabels(obj),
          // printableStatus is only available for latest kubevirt version, so if its not available we sort by ready
          status: obj?.status?.printableStatus || obj?.status?.ready,
        },
        ...objectBundle,
      };
    });
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
      rowFilters={vmStatusResources?.loaded ? [vmRowFilter] : []}
      ListComponent={VMList}
      resources={resources}
      flatten={flatten}
      label={VirtualMachineModel.labelPlural}
      customData={vmStatusResources}
    />
  );
};

type ObjectBundle = {
  vm: VMKind;
  vmi: VMIKind;
  vmImport: VMImportKind;
};

export type VMRowObjType = {
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
    namespace: string;
  };
};

export { VirtualMachinesPage };
