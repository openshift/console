import * as React from 'react';
import * as classNames from 'classnames';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { sortable } from '@patternfly/react-table';
import {
  ListPage,
  Table,
  TableRow,
  TableData,
  MultiListPage,
  RowFunction,
} from '@console/internal/components/factory';
import {
  Kebab,
  ResourceLink,
  ResourceKebab,
  FirehoseResult,
  pluralize,
} from '@console/internal/components/utils';
import {
  TemplateModel,
  NamespaceModel,
  PersistentVolumeClaimModel,
} from '@console/internal/models';
import { TemplateKind, PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import {
  dimensifyHeader,
  dimensifyRow,
  getName,
  createLookup,
  K8sEntityMap,
  ALL_NAMESPACES_KEY,
  ANNOTATIONS,
} from '@console/shared';
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
  TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
} from '../../constants/vm';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { getVMWizardCreateLink } from '../../utils/url';
import { menuActions } from './menu-actions';
import { TemplateSource } from './vm-template-source';

import './vm-template.scss';
import { getAnnotation } from '../../selectors/selectors';
import { Button, ButtonVariant, Badge } from '@patternfly/react-core';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { getTemplateOSIcon } from './os-icons';
import { createVMModal } from '../modals/create-vm/create-vm';
import { selectVM } from '../../selectors/vm-template/basic';
import { getDisks } from '../../selectors/vm';

const tableColumnClasses = (showNamespace: boolean) => [
  '', // name
  '', // badge
  classNames('pf-m-hidden', { 'pf-m-visible-on-lg': showNamespace }), // namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // storage
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // source
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // create action
  Kebab.columnClass,
];

const VMTemplateTableHeader = (showNamespace: boolean) =>
  dimensifyHeader(
    [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
      },
      {
        title: '',
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
      },
      {
        title: 'Storage',
      },
      {
        title: 'Source',
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

type TemplateItem = {
  metadata: {
    name: string;
    namespace: string;
  };
  type: 'common' | 'user';
  templates: TemplateKind[];
};

type VMTemplateTableRowProps = {
  dataVolumeLookup: K8sEntityMap<V1alpha1DataVolume>;
  baseImageLookup: K8sEntityMap<PersistentVolumeClaimKind>;
  showNamespace: boolean;
};

const VMTemplateTableRow: RowFunction<TemplateItem, VMTemplateTableRowProps> = ({
  obj: templateItem,
  customData: { dataVolumeLookup, baseImageLookup, showNamespace },
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses(showNamespace));
  const vm = selectVM(templateItem.templates[0]);

  return (
    <TableRow id={templateItem.metadata.name} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <img
          src={getTemplateOSIcon(templateItem.templates[0])}
          alt=""
          className="kubevirt-vm-template-logo"
        />
        {templateItem.metadata.name}
      </TableData>
      <TableData className={dimensify()}>
        <Badge isRead>
          {templateItem.type === 'common' ? 'Red Hat template' : 'Custom template'}
        </Badge>
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={NamespaceModel.kind}
          name={templateItem.metadata.namespace}
          title={templateItem.metadata.namespace}
        />
      </TableData>
      <TableData className={dimensify()}>{pluralize(getDisks(vm).length, 'Disk')}</TableData>
      <TableData className={dimensify()}>
        <TemplateSource
          template={templateItem.templates[0]}
          dataVolumeLookup={dataVolumeLookup}
          baseImageLookup={baseImageLookup}
        />
      </TableData>
      <TableData className={dimensify()}>
        <Button
          onClick={() =>
            createVMModal({
              templateName: templateItem.metadata.name,
              templates: templateItem.templates,
              baseImageLookup,
            })
          }
          isInline
          variant={ButtonVariant.link}
        >
          Create Virtual Machine
        </Button>
      </TableData>
      <TableData className={dimensify(true)}>
        <ResourceKebab
          actions={menuActions}
          kind={TemplateModel.kind}
          resource={templateItem.templates[0]}
        />
      </TableData>
    </TableRow>
  );
};

type VirtualMachineTemplatesProps = React.ComponentProps<typeof Table> & {
  data: TemplateKind[];
  resources: {
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
    baseImages: FirehoseResult<PersistentVolumeClaimKind[]>;
  };
};

const VirtualMachineTemplates: React.FC<VirtualMachineTemplatesProps> = (props) => {
  const activeNamespace = useSelector(getActiveNamespace);
  const showNamespace = activeNamespace === ALL_NAMESPACES_KEY;
  return (
    <div className="kubevirt-vm-template-list">
      <Table
        {...props}
        aria-label={VM_TEMPLATE_LABEL_PLURAL}
        Header={() => VMTemplateTableHeader(showNamespace)}
        Row={VMTemplateTableRow}
        virtualize
        customData={{
          dataVolumeLookup: createLookup(props.resources.dataVolumes, getName),
          baseImageLookup: createLookup(props.resources.baseImages, getName),
          showNamespace,
        }}
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
      optional: true,
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace: TEMPLATE_VM_GOLDEN_OS_NAMESPACE,
      prop: 'baseImages',
      optional: true,
    },
  ];

  const flatten = ({ vmTemplates, vmCommonTemplates }) => {
    const user = getLoadedData(vmTemplates, []);
    const common = getLoadedData(vmCommonTemplates, []);
    const userGroupped = user.reduce((acc, template) => {
      const name = getAnnotation(template, ANNOTATIONS.displayName, template.metadata.name);
      if (acc[name]) {
        acc[name].templates.push(template);
      } else {
        acc[name] = {
          type: 'user',
          metadata: {
            name,
            namespace: template.metadata.namespace,
          },
          templates: [template],
        };
      }
      return acc;
    }, {} as TemplateItem);
    const commonGroupped = common.reduce((acc, template) => {
      const name = getAnnotation(template, ANNOTATIONS.displayName, template.metadata.name);
      if (acc[name]) {
        acc[name].templates.push(template);
      } else {
        acc[name] = {
          type: 'common',
          metadata: {
            name,
            namespace: template.metadata.namespace,
          },
          templates: [template],
        };
      }
      return acc;
    }, {} as TemplateItem);
    return [...Object.values(userGroupped), ...Object.values(commonGroupped)];
  };

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
