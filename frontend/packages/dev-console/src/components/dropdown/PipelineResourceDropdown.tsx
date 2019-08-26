import * as React from 'react';
import * as _ from 'lodash-es';
import { Firehose } from '@console/internal/components/utils';
import { PipelineResourceModel } from '../../models';
import ResourceDropdown from './ResourceDropdown';

interface PipelineResourceDropdownProps {
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

  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        autoSelect
        placeholder="Select Pipeline Resource"
        dataSelector={['metadata', 'name']}
        resourceFilter={resourceFilter}
        transformLabel={(resource) =>
          `${_.defaultTo(_.get(_.find(resource.spec.params, ['name', 'url']), 'value'), '')} (${
            resource.metadata.name
          })`
        }
      />
    </Firehose>
  );
};

export default PipelineResourceDropdown;
