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
  RowFunctionArgs,
  Table,
  TableData,
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
import { referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared';
import GenericStatus from '@console/shared/src/components/status/GenericStatus';
import { VMWizardMode, VMWizardName } from '../../constants';
import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { printableToVMStatus, VMStatus } from '../../constants/vm/vm-status';
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
import { hasPendingChanges } from '../../utils/pending-changes';
import { getVMWizardCreateLink } from '../../utils/url';
import { LazyVMStatus } from '../vm-status/lazy-vm-status';
import { useVmStatusResources, VmStatusResourcesValue } from '../vm-status/use-vm-status-resources';
import { getVMStatusIcon } from '../vm-status/vm-status';
import { vmStatusFilterNew } from './table-filters';
import VMIP from './VMIP';

import './vm.scss';

const tableColumnClasses = [
  'pf-u-w-16-on-xl pf-u-w-50-on-xs',
  'pf-m-hidden pf-m-visible-on-lg',
  '',
  'pf-m-hidden pf-m-visible-on-xl',
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
        title: t('kubevirt-plugin~Conditions'),
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

const VMRow: React.FC<RowFunctionArgs<VMRowObjType, VmStatusResourcesValue>> = ({
  obj,
  customData: vmStatusResources,
}) => {
  const { vm, vmi } = obj;
  const { name, namespace, creationTimestamp, node } = obj.metadata;
  const dimensify = dimensifyRow(tableColumnClasses);
  const arePendingChanges = hasPendingChanges(vm, vmi);
  const printableStatus = obj?.metadata?.status;
  const status: VMStatus = printableToVMStatus?.[printableStatus];

  const objReference = referenceFor(vm || vmi);
  const context = { [objReference]: vm || vmi };

  return (
    <>
      <TableData className={dimensify()}>
        <ResourceLink kind={objReference} name={name} namespace={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink kind={NamespaceModel.kind} name={namespace} title={namespace} />
      </TableData>
      <TableData className={dimensify()}>
        {status ? (
          <GenericStatus
            title={printableStatus}
            Icon={getVMStatusIcon(status === VMStatus.PAUSED, status, arePendingChanges)}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={dimensify()}>
        <LazyVMStatus
          vm={vm}
          vmi={vmi}
          printableStatus={printableStatus}
          vmStatusResources={vmStatusResources}
        />
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
        <LazyActionMenu context={context} />
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

export const VirtualMachinesPage: React.FC<VirtualMachinesPageProps> = (props) => {
  const { t } = useTranslation();
  const { skipAccessReview, noProjectsAvailable, showTitle } = props.customData;
  const namespace = props.match.params.ns;
  const vmStatusResources = useVmStatusResources(namespace);

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
          status: isVM(obj)
            ? obj?.status?.printableStatus
            : isVMI(obj)
            ? obj?.status?.phase
            : 'Unknown',
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
      rowFilters={[vmStatusFilterNew]}
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
