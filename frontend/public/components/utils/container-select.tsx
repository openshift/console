import * as _ from 'lodash-es';
import { FC, Ref, useState } from 'react';
import {
  Divider,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
  SelectProps,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { ContainerModel } from '@console/internal/models';
import { ContainerSpec } from '@console/internal/module/k8s';
import { ResourceName } from './resource-icon';

export const ContainerLabel: FC<ContainerLabelProps> = ({ name }) => (
  <ResourceName name={name} kind={ContainerModel.kind} />
);

const ContainerSelectOptions: FC<ContainerSelectOptionsProps> = ({ containers }) => (
  <>
    {Object.values(containers ?? {}).map(({ name }) => (
      <SelectOption key={name} value={name} data-test-dropdown-menu={name}>
        <ContainerLabel name={name} />
      </SelectOption>
    ))}
  </>
);

export const ContainerSelect: FC<ContainerSelectProps> = ({
  containers,
  currentKey,
  initContainers,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string>(
    currentKey || Object.values(containers ?? {})?.[0]?.name,
  );
  const { t } = useTranslation();

  if (_.isEmpty(containers)) {
    return null;
  }

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };
  const onSelect: SelectProps['onSelect'] = (_event, value: string) => {
    onChange(value);
    setSelected(value);
    setIsOpen(false);
  };

  return (
    <Select
      isOpen={isOpen}
      selected={selected}
      onSelect={onSelect}
      onOpenChange={(open) => setIsOpen(open)}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggleClick}
          isExpanded={isOpen}
          data-test="container-select"
        >
          <ContainerLabel name={selected} />
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
      popperProps={{ appendTo: 'inline' }}
    >
      {!_.isEmpty(initContainers) ? (
        <>
          <SelectGroup label={t('public~Containers')}>
            <SelectList>
              <ContainerSelectOptions containers={containers} />
            </SelectList>
          </SelectGroup>
          <Divider />
          <SelectGroup label={t('public~Init containers')}>
            <SelectList>
              <ContainerSelectOptions containers={initContainers} />
            </SelectList>
          </SelectGroup>
        </>
      ) : (
        <SelectList>
          <ContainerSelectOptions containers={containers} />
        </SelectList>
      )}
    </Select>
  );
};

type Containers = { [key: string]: ContainerSpec };

type ContainerLabelProps = {
  name: string;
};

type ContainerSelectOptionsProps = {
  containers: Containers;
};

type ContainerSelectProps = {
  containers: Containers;
  currentKey?: string;
  initContainers?: Containers;
  onChange: (value: string) => void;
};
