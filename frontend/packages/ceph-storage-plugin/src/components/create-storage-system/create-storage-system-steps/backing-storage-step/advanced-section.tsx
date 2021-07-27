import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Checkbox,
  CheckboxProps,
  ExpandableSection,
  ExpandableSectionProps,
  FormGroup,
} from '@patternfly/react-core';
import { DeploymentType } from '../../../../constants/create-storage-system';
import { WizardDispatch, WizardState } from '../../reducer';
import './backing-storage.scss';

export const AdvancedSection: React.FC<AdvancedSelectionProps> = ({
  deployment,
  isAdvancedOpen,
  dispatch,
}) => {
  const { t } = useTranslation();

  const handleSelection: CheckboxProps['onChange'] = (checked) => {
    dispatch({
      type: 'backingStorage/setDeployment',
      payload: checked ? DeploymentType.MCG : DeploymentType.ALL,
    });
  };
  const handleExpanadableToggling: ExpandableSectionProps['onToggle'] = (isExpanded: boolean) => {
    dispatch({ type: 'backingStorage/setIsAdvancedOpen', payload: isExpanded });
  };

  return (
    <ExpandableSection
      toggleText={t('ceph-storage-plugin~Advanced')}
      onToggle={handleExpanadableToggling}
      isExpanded={isAdvancedOpen}
    >
      <FormGroup label={t('ceph-storage-plugin~Deployment type')} fieldId="deployment-type">
        <Checkbox
          label={t('ceph-storage-plugin~Multi cloud object gateway')}
          description={t('ceph-storage-plugin~Object storage')}
          value={DeploymentType.MCG}
          isChecked={deployment === DeploymentType.MCG}
          onChange={handleSelection}
          id="deployment-type"
        />
      </FormGroup>
    </ExpandableSection>
  );
};

type AdvancedSelectionProps = {
  dispatch: WizardDispatch;
  deployment: WizardState['backingStorage']['deployment'];
  isAdvancedOpen: WizardState['backingStorage']['isAdvancedOpen'];
};
