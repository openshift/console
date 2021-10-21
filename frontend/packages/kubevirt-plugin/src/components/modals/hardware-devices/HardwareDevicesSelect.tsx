/* eslint-disable array-callback-return, consistent-return */
import * as React from 'react';
import { Select, SelectGroup, SelectOption, SelectVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { useHyperconvergedCR } from '../../../hooks/use-hyperconverged-resource';

export type HardwareDevicesSelectProps = {
  selected?: string;
  setSelected?: React.Dispatch<React.SetStateAction<string>>;
};

const HardwareDevicesSelect: React.FC<HardwareDevicesSelectProps> = ({ selected, setSelected }) => {
  const { t } = useTranslation();

  const [hc, loaded] = useHyperconvergedCR();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const pciDevices = hc?.spec?.permittedHostDevices?.pciHostDevices;
  const medDevices = hc?.spec?.permittedHostDevices?.mediatedDevices;

  let groups = [<LoadingInline />];

  if (loaded) {
    groups = [
      <SelectGroup label={t('kubevirt-plugin~PCI host devices')} key="pci">
        {pciDevices?.map((device, index) => (
          <SelectOption key={index} value={device?.resourceName} />
        ))}
      </SelectGroup>,
      <SelectGroup label={t('kubevirt-plugin~Mediated devices')} key="mediated">
        {medDevices?.map((device, index) => (
          <SelectOption key={index} value={device?.resourceName} />
        ))}
      </SelectGroup>,
    ];
  }

  const onToggle = () => {
    setIsOpen((prevState) => {
      return !prevState;
    });
  };

  const onSelect = (event, selection) => {
    setIsOpen(false);
    setSelected(selection);
  };

  const onFilter = (_, textInput) => {
    if (textInput === '') {
      return groups;
    }

    const filteredGroups = groups
      .map((group) => {
        const filteredGroup = React.cloneElement(group, {
          children: group.props.children.filter((item) => {
            return item.props.value.toLowerCase().includes(textInput.toLowerCase());
          }),
        });
        if (filteredGroup.props.children.length > 0) {
          return filteredGroup;
        }
      })
      .filter(Boolean);

    return filteredGroups;
  };

  return (
    <Select
      variant={SelectVariant.single}
      onToggle={onToggle}
      onSelect={(event, selection) => onSelect(event, selection)}
      selections={selected}
      isOpen={isOpen}
      placeholderText={t('kubevirt-plugin~Select resource name')}
      onFilter={onFilter}
      isGrouped
      hasInlineFilter
      inlineFilterPlaceholderText={t('kubevirt-plugin~Filter by resource name..')}
    >
      {groups}
    </Select>
  );
};

export default HardwareDevicesSelect;
