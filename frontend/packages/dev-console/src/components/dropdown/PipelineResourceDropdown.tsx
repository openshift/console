import * as React from 'react';
import * as _ from 'lodash';
import { Firehose } from '@console/internal/components/utils';
import { PipelineResourceModel } from '../../models';
import ResourceDropdown from './ResourceDropdown';

export interface PipelineResourceDropdownProps {
  dropDownClassName?: string;
  menuClassName?: string;
  namespace?: string;
  actionItem?: {
    actionTitle: string;
    actionKey: string;
  };
  selectedKey: string;
  onChange?: (key: string) => void;
  title?: React.ReactNode;
  id?: string;
  autoselect?: boolean;
  filterType?: string;
  disabled?: boolean;
}

const PipelineResourceDropdown: React.FC<PipelineResourceDropdownProps> = (props) => {
  const resources = [
    {
      isList: true,
      namespace: props.namespace,
      kind: PipelineResourceModel.kind,
      prop: 'pipelineresources',
    },
  ];
  const resourceFilter = (item) => {
    return item.spec.type === props.filterType;
  };
  const transformLabel = (resource) => {
    const url = _.get(_.find(resource.spec.params, ['name', 'url']), 'value', '');
    return url.trim().length > 0 ? `${url} (${resource.metadata.name})` : resource.metadata.name;
  };

  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        autoSelect
        placeholder="Select Pipeline Resource"
        dataSelector={['metadata', 'name']}
        resourceFilter={resourceFilter}
        transformLabel={transformLabel}
      />
    </Firehose>
  );
};

export default PipelineResourceDropdown;
