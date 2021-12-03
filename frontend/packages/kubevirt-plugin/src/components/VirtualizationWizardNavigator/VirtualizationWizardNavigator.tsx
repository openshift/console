import * as React from 'react';
import { Route, Switch } from 'react-router';
import { VirtualMachineModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { CreateVMWizardPage } from '../create-vm-wizard/create-vm-wizard';
import { CreateVM } from '../create-vm/create-vm';
import { VMCreateYAML } from '../vms/vm-create-yaml';

const VirtualizationWizardNavigator = (props) => {
  const baseUrl = `/k8s/ns/:ns/${kubevirtReferenceForModel(VirtualMachineModel)}/~new`;
  return (
    <Switch>
      <Route path={`${baseUrl}/wizard`} {...props} component={CreateVM} />
      <Route path={`${baseUrl}/customize`} {...props} component={CreateVMWizardPage} />
      <Route path={baseUrl} {...props} component={VMCreateYAML} />
    </Switch>
  );
};

export default VirtualizationWizardNavigator;
