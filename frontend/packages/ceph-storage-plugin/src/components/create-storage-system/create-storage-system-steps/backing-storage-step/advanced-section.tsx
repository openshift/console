import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ExpandableSection,
  ExpandableSectionProps,
  FormGroup,
  Select,
  SelectOption,
  SelectProps,
  SelectVariant,
} from '@patternfly/react-core';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { isDefaultClass } from '@console/internal/components/storage-class';
import { DeploymentType } from '../../../../constants/create-storage-system';
import { WizardDispatch, WizardState } from '../../reducer';
import './backing-storage-step.scss';

const options = [DeploymentType.FULL, DeploymentType.MCG];

export const AdvancedSection: React.FC<AdvancedSelectionProps> = ({
  deployment,
  isAdvancedOpen,
  dispatch,
  isDisabled,
  scList,
  isValidSC,
  currentStep,
}) => {
  const { t } = useTranslation();
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);

  const handleSelection: SelectProps['onSelect'] = (_, value) => {
    if (currentStep !== 1) {
      /*
       * Reset the wizard when user has selected a new deployment flow
       * and has not visited any step other than first step.
       */
      dispatch({ type: 'wizard/setInitialState' });
    }
    const defaultSC = scList.find(isDefaultClass);
    dispatch({
      type: 'backingStorage/setIsValidSC',
      // 'value' on SelectProps['onSelect'] is string hence not matching with payload which is of "DeploymentType"
      payload: value === DeploymentType.MCG ? !!defaultSC : true,
    });
    dispatch({
      type: 'backingStorage/setDeployment',
      // 'value' on SelectProps['onSelect'] is string hence not matching with payload which is of "DeploymentType"
      payload: value as DeploymentType,
    });
    setIsSelectOpen(false);
  };

  const handleToggling: SelectProps['onToggle'] = (isExpanded: boolean) =>
    setIsSelectOpen(isExpanded);

  const handleExpanadableToggling: ExpandableSectionProps['onToggle'] = (isExpanded: boolean) => {
    dispatch({ type: 'backingStorage/setIsAdvancedOpen', payload: isExpanded });
  };

  const selectOptions = options.map((option) => <SelectOption key={option} value={option} />);

  return (
    <ExpandableSection
      toggleText={t('ceph-storage-plugin~Advanced')}
      onToggle={handleExpanadableToggling}
      isExpanded={isAdvancedOpen}
    >
      <FormGroup
        label={t('ceph-storage-plugin~Deployment type')}
        fieldId="deployment-type"
        validated={isValidSC ? 'default' : 'error'}
        helperTextInvalid={t(
          'ceph-storage-plugin~A default StorageClass is needed for deployment.',
        )}
      >
        <Select
          className="odf-backing-storage__selection--width"
          variant={SelectVariant.single}
          onToggle={handleToggling}
          onSelect={handleSelection}
          selections={deployment}
          isOpen={isSelectOpen}
          isDisabled={isDisabled}
        >
          {selectOptions}
        </Select>
      </FormGroup>
    </ExpandableSection>
  );
};

type AdvancedSelectionProps = {
  dispatch: WizardDispatch;
  deployment: WizardState['backingStorage']['deployment'];
  isAdvancedOpen: WizardState['backingStorage']['isAdvancedOpen'];
  isValidSC: WizardState['backingStorage']['isValidSC'];
  scList: StorageClassResourceKind[];
  currentStep: number;
  isDisabled: boolean;
};
