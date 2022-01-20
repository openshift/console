import * as React from 'react';
import { DropdownItem, Dropdown, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { VMWizardMode, VMWizardName } from '../../constants/vm';
import { getVMWizardCreateLink } from '../../utils/url';
import MigrationTool from './migration-tool/MigrationTool';

const vmMenuItems = (t: TFunction) => [
  {
    test: 'vm-wizard',
    wizardName: VMWizardName.BASIC,
    mode: VMWizardMode.VM,
    label: t('kubevirt-plugin~With Wizard'),
  },
  {
    test: 'vm-yaml',
    wizardName: VMWizardName.YAML,
    mode: VMWizardMode.VM,
    label: t('kubevirt-plugin~With YAML'),
  },
];

const VirtualMachinesPageActions: React.FC<VirtualMachinesPageActionsProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = React.useState(false);

  const getMenuItem = React.useCallback(
    ({ test, wizardName, mode, label }) => (
      <DropdownItem
        key={label}
        component={
          <Link
            data-test-id={test}
            to={getVMWizardCreateLink({
              namespace,
              wizardName,
              mode,
            })}
          >
            {label}
          </Link>
        }
      />
    ),
    [namespace],
  );

  return (
    <div className="co-actions" data-test-id="details-actions">
      <MigrationTool />
      <Dropdown
        data-test-id="item-create"
        onSelect={() => setOpen(false)}
        toggle={
          <DropdownToggle onToggle={setOpen} isPrimary>
            {t('kubevirt-plugin~Create')}
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={[vmMenuItems(t).map(getMenuItem)]}
        isGrouped
        position={DropdownPosition.right}
      />
    </div>
  );
};

type VirtualMachinesPageActionsProps = {
  namespace?: string;
};

export { VirtualMachinesPageActions };
