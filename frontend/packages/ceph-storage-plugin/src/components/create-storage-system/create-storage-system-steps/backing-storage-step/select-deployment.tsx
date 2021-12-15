import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  FormGroup,
  Select,
  SelectOption,
  SelectProps,
  SelectVariant,
} from '@patternfly/react-core';

import { DeploymentType } from '../../../../constants/create-storage-system';
import { WizardDispatch, WizardState } from '../../reducer';
import './backing-storage-step.scss';

const options = [DeploymentType.FULL, DeploymentType.MCG];

const optionsDescription = (t: TFunction) => ({
  [DeploymentType.MCG]: t(
    'ceph-storage-plugin~Deploys MultiCloud Object Gateway without block and file services.',
  ),
  [DeploymentType.FULL]: t(
    'ceph-storage-plugin~Deploys OpenShift Data Foundation with block, shared fileSystem and object services.',
  ),
});

export const SelectDeployment: React.FC<SelectDeploymentProps> = ({ deployment, dispatch }) => {
  const { t } = useTranslation();
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const descriptions = optionsDescription(t);

  const handleSelection: SelectProps['onSelect'] = (_, value) => {
    dispatch({
      type: 'backingStorage/setDeployment',
      // 'value' on SelectProps['onSelect'] is string hence does not match with payload of type "DeploymentType"
      payload: value as DeploymentType,
    });
    setIsSelectOpen(false);
  };

  const handleToggling: SelectProps['onToggle'] = (isExpanded: boolean) =>
    setIsSelectOpen(isExpanded);

  const selectOptions = options.map((option) => (
    <SelectOption key={option} value={option} description={descriptions[option]} />
  ));

  return (
    <FormGroup label={t('ceph-storage-plugin~Deployment type')} fieldId="deployment-type">
      <Select
        className="odf-backing-storage__selection--width"
        variant={SelectVariant.single}
        onToggle={handleToggling}
        onSelect={handleSelection}
        selections={deployment}
        isOpen={isSelectOpen}
      >
        {selectOptions}
      </Select>
    </FormGroup>
  );
};

type SelectDeploymentProps = {
  dispatch: WizardDispatch;
  deployment: WizardState['backingStorage']['deployment'];
};
