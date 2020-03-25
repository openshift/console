import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  ListPage,
  Table,
  TableRow,
  TableData,
  MultiListPage,
} from '@console/internal/components/factory';
import {
  Kebab,
  ResourceLink,
  ResourceKebab,
  FirehoseResult,
} from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  dimensifyHeader,
  dimensifyRow,
  getNamespace,
  DASH,
  getUID,
  getName,
  createLookup,
  K8sEntityMap,
} from '@console/shared';
import { match } from 'react-router';
import { withStartGuide } from '@console/internal/components/start-guide';
import { VM_TEMPLATE_LABEL_PLURAL } from '../../constants/vm-templates';
import {
  getTemplateOperatingSystems,
  getTemplateFlavors,
} from '../../selectors/vm-template/advanced';
import { getLoadedData } from '../../utils';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../constants/vm';
import { DataVolumeModel } from '../../models';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { VMTemplateLink } from './vm-template-link';
import { menuActions } from './menu-actions';
import { TemplateSource } from './vm-template-source';

import './vm-template.scss';

const tableColumnClass = classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-4');
const tableColumnClassHiddenOnSmall = classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs');

const tableColumnClasses = [
  tableColumnClass,
  tableColumnClass,
  tableColumnClass,
  tableColumnClassHiddenOnSmall,
  tableColumnClassHiddenOnSmall,
  tableColumnClassHiddenOnSmall,
  tableColumnClass,
  Kebab.columnClass,
];

const VMTemplateTableHeader = () =>
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
        title: 'Description',
        sortField: 'metadata.annotations.description',
        transforms: [sortable],
      },
      {
        title: 'Source',
      },
      {
        title: 'OS',
      },
      {
        title: 'Flavor',
      },
      {
        title: '',
      },
      {
        title: '',
      },
    ],
    tableColumnClasses,
  );

VMTemplateTableHeader.displayName = 'VMTemplateTableHeader';

const getCreateLink = (
  namespace: string,
  itemName: 'yaml' | 'wizard' = 'wizard',
  mode: 'template' | 'vm' = 'template',
  template?: string,
) =>
  `/k8s/ns/${namespace || 'default'}/virtualization/${
    itemName === 'yaml' ? '~new' : '~new-wizard'
  }?mode=${mode}${template ? `&template=${template}` : ''}`; // covers 'yaml', new-wizard and default

const VMTemplateTableRow: React.FC<VMTemplateTableRowProps> = ({
  obj: template,
  customData: { dataVolumeLookup },
  index,
  key,
  style,
}) => {
  const dimensify = dimensifyRow(tableColumnClasses);
  const os = getTemplateOperatingSystems([template])[0];

  return (
    <TableRow id={template.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={dimensify()}>
        <VMTemplateLink
          name={getName(template)}
          namespace={getNamespace(template)}
          uid={getUID(template)}
        />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink
          kind="Namespace"
          name={getNamespace(template)}
          title={getNamespace(template)}
        />
      </TableData>
      <TableData className={dimensify()}>
        {_.get(template.metadata, 'annotations.description', DASH)}
      </TableData>
      <TableData className={dimensify()}>
        <TemplateSource template={template} dataVolumeLookup={dataVolumeLookup} />
      </TableData>
      <TableData className={dimensify()}>{os ? os.name || os.id : DASH}</TableData>
      <TableData className={dimensify()}>{getTemplateFlavors([template])[0]}</TableData>
      <TableData className={dimensify()}>
        <Link
          to={getCreateLink(getNamespace(template), 'wizard', 'vm', getName(template))}
          title="Create Virtual Machine"
          className="co-resource-item__resource-name"
        >
          Create Virtual Machine
        </Link>
      </TableData>
      <TableData className={dimensify(true)}>
        <ResourceKebab actions={menuActions} kind={TemplateModel.kind} resource={template} />
      </TableData>
    </TableRow>
  );
};
VMTemplateTableRow.displayName = 'VmTemplateTableRow';

type VirtualMachineTemplatesProps = {
  data: TemplateKind[];
  resources: {
    dataVolumes: FirehoseResult<V1alpha1DataVolume[]>;
  };
};

const VirtualMachineTemplates: React.FC<React.ComponentProps<typeof Table> &
  VirtualMachineTemplatesProps> = (props) => {
  return (
    <div className="kubevirt-vm-template-list">
      <Table
        {...props}
        aria-label={VM_TEMPLATE_LABEL_PLURAL}
        Header={VMTemplateTableHeader}
        Row={VMTemplateTableRow}
        virtualize
        customData={{
          dataVolumeLookup: createLookup(props.resources.dataVolumes, getName),
        }}
      />
    </div>
  );
};

const getCreateProps = ({ namespace }: { namespace: string }) => {
  const items: any = {
    wizard: 'New with Wizard',
    yaml: 'New from YAML',
  };

  return {
    items,
    createLink: (itemName) => getCreateLink(namespace, itemName),
  };
};

const WrappedVirtualMachineTemplatesPage: React.FC<VirtualMachineTemplatesPageProps &
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
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
      optional: true,
    },
  ];

  const flatten = ({ vmTemplates }) => getLoadedData(vmTemplates, []);
  const createAccessReview = skipAccessReview ? null : { model: TemplateModel, namespace };
  const modifiedProps = Object.assign({}, { mock: noProjectsAvailable }, props);

  return (
    <MultiListPage
      {...modifiedProps}
      createAccessReview={createAccessReview}
      createButtonText="Create Virtual Machine Template"
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

const VirtualMachineTemplatesPage = withStartGuide(WrappedVirtualMachineTemplatesPage);

type VMTemplateTableRowProps = {
  obj: TemplateKind;
  index: number;
  key: string;
  style: any;
  customData: {
    dataVolumeLookup: K8sEntityMap<V1alpha1DataVolume>;
  };
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
