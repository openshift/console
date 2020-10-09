import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { sortable } from '@patternfly/react-table';
import { ThumbtackIcon } from '@patternfly/react-icons';
import {
  ListPage,
  Table,
  TableRow,
  TableData,
  MultiListPage,
  RowFunction,
} from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { Kebab, ResourceLink, FirehoseResult, history } from '@console/internal/components/utils';
import {
  TemplateModel,
  NamespaceModel,
  PersistentVolumeClaimModel,
  PodModel,
} from '@console/internal/models';
import { TemplateKind, PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { dimensifyHeader, dimensifyRow, ALL_NAMESPACES_KEY, getLabel } from '@console/shared';
import { match } from 'react-router';
import { VM_TEMPLATE_LABEL_PLURAL } from '../../constants/vm-templates';
import { getLoadedData } from '../../utils';
import {
  VMWizardName,
  VMWizardMode,
  VMWizardActionLabels,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_VM,
} from '../../constants/vm';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { getVMWizardCreateLink } from '../../utils/url';
import { menuActionsCreator } from './menu-actions';
import { TemplateSource } from './vm-template-source';

import './vm-template.scss';
import { Button, Badge, Popover, PopoverPosition, TextContent, Text } from '@patternfly/react-core';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { getTemplateOSIcon } from './os-icons';
import {
  getTemplateSizeRequirement,
  getTemplateMemory,
} from '../../selectors/vm-template/advanced';
import { useBaseImages } from '../../hooks/use-base-images';
import { getWorkloadProfile, getCPU, vCPUCount } from '../../selectors/vm';
import { selectVM, getTemplateName, isCommonTemplate } from '../../selectors/vm-template/basic';
import { createVMModal } from '../modals/create-vm/create-vm';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../../hooks/use-local-storage';
import { getTemplateSourceStatus } from '../../statuses/template/template-source-status';
import { isTemplateSourceError, TemplateSourceStatus } from '../../statuses/template/types';

const tableColumnClasses = (showNamespace: boolean) => [
  'pf-u-w-25', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // badge
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
        title: 'Template type',
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Boot source',
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

type VMTemplateBadgeProps = {
  template: TemplateKind;
};

const VMTemplateBadge: React.FC<VMTemplateBadgeProps> = ({ template }) => {
  const isCommon = isCommonTemplate(template);
  return (
    <Badge className={`kubevirt-vm-template-badge--${isCommon ? 'common' : 'custom'}`}>
      {isCommon ? 'Provided' : 'Custom'}
    </Badge>
  );
};

type VMTemplateTableRowProps = {
  dataVolumes: V1alpha1DataVolume[];
  pvcs: PersistentVolumeClaimKind[];
  pods: PodKind[];
  namespace: string;
  loaded: boolean;
  pinnedTemplates: string[];
  togglePin: (template: TemplateKind) => void;
};

const VMTemplateTableRow: RowFunction<TemplateKind, VMTemplateTableRowProps> = ({
  obj: template,
  customData: { dataVolumes, pvcs, pods, namespace, loaded, togglePin, pinnedTemplates },
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses(!namespace));
  const sourceStatus = getTemplateSourceStatus({ template, pvcs, dataVolumes, pods });
  const isPinned = pinnedTemplates.includes(template.metadata.uid);

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
        {isPinned && <ThumbtackIcon className="kubevirt-vm-template-pin" />}
      </TableData>
      <TableData className={dimensify()}>
        <VMTemplateBadge template={template} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={NamespaceModel.kind}
          name={template.metadata.namespace}
          title={template.metadata.namespace}
        />
      </TableData>
      <TableData className={dimensify()}>
        <TemplateSource loaded={loaded} template={template} sourceStatus={sourceStatus} />
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
          onClick={() => {
            !isTemplateSourceError(sourceStatus) && sourceStatus?.isReady
              ? createVMModal({
                  template,
                  sourceStatus,
                })
              : history.push(
                  getVMWizardCreateLink({
                    namespace,
                    wizardName: VMWizardName.WIZARD,
                    mode: VMWizardMode.VM,
                    template,
                  }),
                );
          }}
          variant="secondary"
        >
          Create Virtual Machine
        </Button>
      </TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={menuActionsCreator(namespace)(TemplateModel, template, null, {
            togglePin,
            isPinned,
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

const VirtualMachineTemplates: React.FC<VirtualMachineTemplatesProps> = (props) => {
  const [pins, setPins] = useLocalStorage('kubevirt.templates.pins');
  const pinnedTemplates = React.useMemo(() => pins?.split(',') ?? [], [pins]);
  const togglePin = React.useCallback(
    (template: TemplateKind) => {
      const { uid } = template.metadata;
      const index = pinnedTemplates.indexOf(uid);
      const newPins = [...pinnedTemplates];
      if (index !== -1) {
        newPins.splice(index, 1);
      } else {
        newPins.push(uid);
      }
      setPins(newPins.join(','));
    },
    [pinnedTemplates, setPins],
  );
  const activeNamespace = useSelector(getActiveNamespace);
  const namespace = activeNamespace === ALL_NAMESPACES_KEY ? undefined : activeNamespace;
  const [baseImages, imagesLoaded, , baseImageDVs, baseImagePods] = useBaseImages(
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
    <div className="kubevirt-vm-template-list">
      <Table
        {...props}
        aria-label={VM_TEMPLATE_LABEL_PLURAL}
        Header={() => VMTemplateTableHeader(!namespace)}
        Row={VMTemplateTableRow}
        virtualize
        customData={{
          dataVolumes,
          pvcs,
          pods,
          loaded: imagesLoaded,
          namespace,
          togglePin,
          pinnedTemplates,
        }}
        isPinned={(template) => pinnedTemplates.includes(template?.metadata?.uid)}
      />
    </div>
  );
};

const getCreateProps = ({ namespace }: { namespace: string }) => {
  const items: any = {
    [VMWizardName.WIZARD]: VMWizardActionLabels.WIZARD,
    [VMWizardName.YAML]: VMWizardActionLabels.YAML,
  };

  return {
    items,
    createLink: (itemName) =>
      getVMWizardCreateLink({ namespace, wizardName: itemName, mode: VMWizardMode.TEMPLATE }),
  };
};

const templateTypeFilterReducer = (template: TemplateKind): string =>
  template.metadata.labels?.[TEMPLATE_TYPE_LABEL] === TEMPLATE_TYPE_BASE ? 'vendor' : 'custom';

const filters: RowFilter[] = [
  {
    filterGroupName: 'Type',
    type: 'template-type',
    reducer: templateTypeFilterReducer,
    items: [
      { id: 'vendor', title: 'Red Hat template' },
      { id: 'custom', title: 'Custom template' },
    ],
    filter: (types, template: TemplateKind) => {
      const type = templateTypeFilterReducer(template);
      return types.selected.size === 0 || types.selected.has(type);
    },
  },
];

const flatten = ({ vmTemplates, vmCommonTemplates }) => {
  const user = getLoadedData<TemplateKind[]>(vmTemplates, []);
  const common = getLoadedData<TemplateKind[]>(vmCommonTemplates, []);
  const commonByName = _.groupBy(common, getTemplateName);
  const commonTemplates = Object.keys(commonByName).map((key) => {
    const templates = commonByName[key];
    // TODO recommended label
    return templates.find((t) => getLabel(t, 'kubevirt.io/recommended')) || templates[0];
  });
  return [...user, ...commonTemplates];
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
      canCreate
      title={VM_TEMPLATE_LABEL_PLURAL}
      showTitle={showTitle}
      ListComponent={VirtualMachineTemplates}
      createProps={getCreateProps({
        namespace,
      })}
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
