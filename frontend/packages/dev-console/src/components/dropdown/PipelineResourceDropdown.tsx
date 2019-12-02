import * as React from 'react';
import * as _ from 'lodash';
import { ResourceDropdown } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineResourceModel } from '../../models';

export interface PipelineResourceDropdownProps {
  dropDownClassName?: string;
  menuClassName?: string;
  namespace?: string;
  actionItems?: {
    actionTitle: string;
    actionKey: string;
  }[];
  selectedKey: string;
  onChange?: (key: string, name: string, isListEmpty?: boolean) => void;
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
      kind: referenceForModel(PipelineResourceModel),
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
