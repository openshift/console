import * as React from 'react';
import * as classNames from 'classnames';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { match } from 'react-router';
import { sortable } from '@patternfly/react-table';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { global_palette_blue_300 as blueInfoColor } from '@patternfly/react-tokens/dist/js/global_palette_blue_300';
import {
  ListPage,
  Table,
  TableRow,
  TableData,
  MultiListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import {
  Kebab,
  ResourceLink,
  FirehoseResult,
  ExternalLink,
} from '@console/internal/components/utils';
import {
  TemplateModel,
  NamespaceModel,
  PersistentVolumeClaimModel,
  PodModel,
} from '@console/internal/models';
import { TemplateKind, PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import {
  dimensifyHeader,
  dimensifyRow,
  ALL_NAMESPACES_KEY,
  SuccessStatus,
  ErrorStatus,
} from '@console/shared';
import {
  Button,
  Popover,
  PopoverPosition,
  TextContent,
  Text,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { getActiveNamespace } from '@console/internal/actions/ui';
import GenericStatus from '@console/shared/src/components/status/GenericStatus';

import {
  BOOT_SOURCE_COMMUNITY,
  BOOT_SOURCE_USER,
  SUPPORT_URL,
  VM_TEMPLATE_LABEL_PLURAL,
} from '../../constants/vm-templates';
import { getLoadedData } from '../../utils';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_VM } from '../../constants/vm';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { menuActionsCreator } from './menu-actions';
import { TemplateSource } from './vm-template-source';
import { getTemplateOSIcon, PinnedIcon } from './os-icons';
import {
  getTemplateSizeRequirement,
  getTemplateMemory,
} from '../../selectors/vm-template/advanced';
import { useBaseImages } from '../../hooks/use-base-images';
import { getWorkloadProfile, getCPU, vCPUCount } from '../../selectors/vm';
import {
  selectVM,
  getTemplateName,
  getTemplateProvider,
  getTemplateProviderType,
  templateProviders,
} from '../../selectors/vm-template/basic';
import { Link } from 'react-router-dom';
import { getTemplateSourceStatus } from '../../statuses/template/template-source-status';
import { TemplateSourceStatus } from '../../statuses/template/types';
import { createVMAction, filterTemplates } from './utils';
import { TemplateItem } from '../../types/template';
import { VMTemplateLabel } from './label';
import { usePinnedTemplates } from '../../hooks/use-pinned-templates';
import { useSupportModal } from '../../hooks/use-support-modal';
import { CDI_APP_LABEL } from '../../constants';

import './vm-template.scss';

const tableColumnClasses = (showNamespace: boolean) => [
  'pf-u-w-33', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // provider
  classNames('pf-m-hidden', { 'pf-m-visible-on-lg': showNamespace }), // namespace
  '', // boot source
  classNames('pf-u-w-25', 'kubevirt-vm-template-actions'), // actions
  Kebab.columnClass,
];

const VMTemplateTableHeader = (showNamespace: boolean) =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortFunc: 'vmTemplateName',
        transforms: [sortable],
      },
      {
        title: 'Provider',
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Boot source',
        header: {
          info: {
            popover: (
              <Stack hasGutter>
                <StackItem>
                  <SuccessStatus title={BOOT_SOURCE_COMMUNITY} />
                  The image has been added to the cluster via the operator.
                </StackItem>
                <StackItem>
                  <SuccessStatus title={BOOT_SOURCE_USER} />
                  The image has been added to the cluster by a user.
                </StackItem>
                <StackItem>
                  <GenericStatus
                    Icon={(props) => <PlusCircleIcon {...props} color={blueInfoColor.value} />}
                    title="Add source"
                  />
                  Provide a source for the template across the cluster.
                </StackItem>
                <StackItem>
                  <ErrorStatus title="Boot source error" />
                  Error with the provided boot source.
                </StackItem>
              </Stack>
            ),
            ariaLabel: 'More information on boot sources',
            popoverProps: {
              headerContent: 'Boot source',
            },
          },
        },
      },
      {
        title: '',
      },
      {
        title: '',
      },
    ],
    tableColumnClasses(showNamespace),
  );

VMTemplateTableHeader.displayName = 'VMTemplateTableHeader';

type VMTemplateDetailsBodyProps = {
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
};

const VMTemplateDetailsBody: React.FC<VMTemplateDetailsBodyProps> = ({
  template,
  sourceStatus,
}) => {
  return (
    <TextContent>
      <Text>{getTemplateName(template)}</Text>
      <Text>
        <div className="kubevirt-vm-template-popover">
          <div>Storage</div>
          <div>{getTemplateSizeRequirement(template, sourceStatus)}</div>
        </div>
        <div className="kubevirt-vm-template-popover">
          <div>Memory</div>
          <div>{getTemplateMemory(template)}</div>
        </div>
        <div className="kubevirt-vm-template-popover">
          <div>CPU</div>
          <div>{vCPUCount(getCPU(selectVM(template)))}</div>
        </div>
        <div className="kubevirt-vm-template-popover">
          <div>Workload profile</div>
          <div>{getWorkloadProfile(template)}</div>
        </div>
      </Text>
      <Link
        to={`/k8s/ns/${template.metadata.namespace}/vmtemplates/${template.metadata.name}`}
        title={template.metadata.uid}
        data-test-id={template.metadata.name}
        className="co-resource-item__resource-name"
      >
        View full details
      </Link>
    </TextContent>
  );
};

type VMTemplateTableRowProps = {
  dataVolumes: V1alpha1DataVolume[];
  pvcs: PersistentVolumeClaimKind[];
  pods: PodKind[];
  namespace: string;
  loaded: boolean;
  isPinned: (template: TemplateItem) => boolean;
  togglePin: (template: TemplateItem) => void;
  sourceLoadError: any;
};

const VMTemplateTableRow: RowFunction<TemplateItem, VMTemplateTableRowProps> = ({
  obj,
  customData: { dataVolumes, pvcs, pods, namespace, loaded, togglePin, isPinned, sourceLoadError },
  index,
  key,
  style,
}) => {
  const [template] = obj.variants;
  const dimensify = dimensifyRow(tableColumnClasses(!namespace));
  const sourceStatus = getTemplateSourceStatus({ template, pvcs, dataVolumes, pods });
  const pinned = isPinned(obj);
  const withSupportModal = useSupportModal();

  return (
    <TableRow id={template.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <img src={getTemplateOSIcon(template)} alt="" className="kubevirt-vm-template-logo" />
        <Link
          to={`/k8s/ns/${template.metadata.namespace}/vmtemplates/${template.metadata.name}`}
          title={template.metadata.uid}
          data-test-id={template.metadata.name}
          className="co-resource-item__resource-name"
        >
          {getTemplateName(template)}
        </Link>
        <VMTemplateLabel template={template} />
        {pinned && <PinnedIcon />}
      </TableData>
      <TableData className={dimensify()}>{getTemplateProvider(template)}</TableData>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={NamespaceModel.kind}
          name={template.metadata.namespace}
          title={template.metadata.namespace}
        />
      </TableData>
      <TableData className={dimensify()}>
        <TemplateSource
          loadError={sourceLoadError}
          loaded={loaded}
          template={template}
          sourceStatus={sourceStatus}
          detailed
        />
      </TableData>
      <TableData className={dimensify()}>
        <Popover
          position={PopoverPosition.top}
          headerContent={<div>Template details</div>}
          bodyContent={<VMTemplateDetailsBody template={template} sourceStatus={sourceStatus} />}
        >
          <Button variant="secondary" className="kubevirt-vm-template-details">
            Details
          </Button>
        </Popover>
        <Button
          onClick={() => withSupportModal(obj, () => createVMAction(obj, sourceStatus))}
          variant="secondary"
        >
          Create Virtual Machine
        </Button>
      </TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={menuActionsCreator(TemplateModel, obj, null, {
            togglePin,
            pinned,
            namespace,
            withSupportModal,
            sourceStatus,
            sourceLoaded: true,
            sourceLoadError,
          })}
          key={`kebab-for-${template.metadata.uid}`}
          id={`kebab-for-${template.metadata.uid}`}
        />
      </TableData>
    </TableRow>
  );
};

type VirtualMachineTemplatesProps = React.ComponentProps<typeof Table> & {
  data: TemplateKind[];
  resources: {
    vmCommonTemplates: FirehoseResult<TemplateKind[]>;
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
    pvcs: FirehoseResult<PersistentVolumeClaimKind[]>;
    pods: FirehoseResult<PodKind[]>;
  };
};

export const VMTemplateSupport: React.FC = () => (
  <>
    Red Hat supported templates are labeled below.{' '}
    <ExternalLink href={SUPPORT_URL} text="Learn more about template support" />
  </>
);

const VirtualMachineTemplates: React.FC<VirtualMachineTemplatesProps> = (props) => {
  const [isPinned, togglePin] = usePinnedTemplates();
  const activeNamespace = useSelector(getActiveNamespace);
  const namespace = activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace;
  const [baseImages, imagesLoaded, error, baseImageDVs, baseImagePods] = useBaseImages(
    props.resources.vmCommonTemplates?.data ?? [],
    !!namespace,
  );
  const dataVolumes = React.useMemo(
    () => [...props.resources.dataVolumes.data, ...(baseImageDVs || [])],
    [props.resources.dataVolumes.data, baseImageDVs],
  );
  const pvcs = React.useMemo(() => [...props.resources.pvcs.data, ...(baseImages || [])], [
    props.resources.pvcs.data,
    baseImages,
  ]);
  const pods = React.useMemo(() => [...props.resources.pods.data, ...(baseImagePods || [])], [
    props.resources.pods.data,
    baseImagePods,
  ]);
  return (
    <Stack hasGutter className="kubevirt-vm-template-list">
      <StackItem className="kv-vm-template__support">
        <VMTemplateSupport />
      </StackItem>
      <StackItem>
        <Table
          {...props}
          aria-label={VM_TEMPLATE_LABEL_PLURAL}
          Header={() => VMTemplateTableHeader(!namespace)}
          Row={(rowProps) => <VMTemplateTableRow {...rowProps} />}
          virtualize
          customData={{
            dataVolumes,
            pvcs,
            pods,
            loaded: imagesLoaded,
            namespace,
            togglePin,
            isPinned,
            sourceLoadError: error,
          }}
          isPinned={isPinned}
          defaultSortFunc="vmTemplateName"
        />
      </StackItem>
    </Stack>
  );
};

const filters: RowFilter[] = [
  {
    filterGroupName: 'Provider',
    type: 'template-provider',
    reducer: getTemplateProviderType,
    items: templateProviders,
    filter: (types, template: TemplateItem) => {
      const type = getTemplateProviderType(template);
      return types.selected.size === 0 || types.selected.has(type);
    },
  },
];

const flatten = ({ vmTemplates, vmCommonTemplates }) => {
  const user = getLoadedData<TemplateKind[]>(vmTemplates, []);
  const common = getLoadedData<TemplateKind[]>(vmCommonTemplates, []);
  return filterTemplates(user, common);
};

const VirtualMachineTemplatesPage: React.FC<VirtualMachineTemplatesPageProps &
  React.ComponentProps<typeof ListPage>> = (props) => {
  const { skipAccessReview, noProjectsAvailable, showTitle } = props.customData;
  const namespace = props.match.params.ns;

  const resources = [
    {
      kind: TemplateModel.kind,
      isList: true,
      namespace,
      prop: 'vmTemplates',
      selector: {
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_VM },
      },
    },
    {
      kind: TemplateModel.kind,
      isList: true,
      namespace: 'openshift',
      prop: 'vmCommonTemplates',
      selector: {
        matchLabels: { [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE },
      },
    },
    {
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'pvcs',
    },
    {
      kind: PodModel.kind,
      isList: true,
      namespace,
      selector: {
        matchLabels: { app: CDI_APP_LABEL },
      },
      prop: 'pods',
    },
  ];

  const createAccessReview = skipAccessReview ? null : { model: TemplateModel, namespace };
  const modifiedProps = Object.assign({}, { mock: noProjectsAvailable }, props);

  return (
    <MultiListPage
      {...modifiedProps}
      createAccessReview={createAccessReview}
      createButtonText="Create"
      title={VM_TEMPLATE_LABEL_PLURAL}
      showTitle={showTitle}
      ListComponent={VirtualMachineTemplates}
      resources={resources}
      flatten={flatten}
      label={VM_TEMPLATE_LABEL_PLURAL}
      rowFilters={filters}
    />
  );
};

type VirtualMachineTemplatesPageProps = {
  match: match<{ ns?: string }>;
  customData: {
    showTitle?: boolean;
    skipAccessReview?: boolean;
    noProjectsAvailable?: boolean;
  };
};

export { VirtualMachineTemplatesPage };
