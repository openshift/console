import * as React from 'react';
import { Routes, Route } from 'react-router-dom-v5-compat';
import { CreateVMWizardPage } from '../create-vm-wizard/create-vm-wizard';
import { CreateVM } from '../create-vm/create-vm';
import { CreateFromTemplate } from '../vm-templates/instantiate-template/CreateFromTemplate';
import { VMCreateYAML } from '../vms/vm-create-yaml';

const VirtualizationWizardNavigator = (props) => {
  return (
    <Routes>
      <Route path="instantiate-template/*" {...props} element={<CreateFromTemplate />} />
      <Route path="wizard/*" {...props} element={<CreateVM />} />
      <Route path="customize/*" {...props} element={<CreateVMWizardPage />} />
      <Route path="*" {...props} element={<VMCreateYAML />} />
    </Routes>
  );
};

export default VirtualizationWizardNavigator;
