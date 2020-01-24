import * as React from 'react';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { VirtualMachineModel } from '../../models';

export const VMCreateYAML = (props: any) => (
  <CreateYAML
    {...(props as any)}
    kindObj={VirtualMachineModel.kind}
    plural={VirtualMachineModel.plural}
  />
);
