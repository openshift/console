import * as React from 'react';
import * as _ from 'lodash-es';
import {
  Divider,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectGroup,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { ContainerModel } from '@console/internal/models';
import { ContainerSpec } from '@console/internal/module/k8s';
import { ResourceName } from './resource-icon';

export const ContainerLabel: React.FC<ContainerLabelProps> = ({ name }) => (
  <ResourceName name={name} kind={ContainerModel.kind} />
);

const ContainerSelectOptions: React.FC<ContainerSelectOptionsProps> = ({ containers }) => (
  <>
    {Object.values(containers ?? {}).map(({ name }) => (
      <SelectOption key={name} value={name}>
        <ContainerLabel name={name} />
      </SelectOption>
    ))}
  </>
);

export const ContainerSelect: React.FC<ContainerSelectProps> = ({
  containers,
  currentKey,
  initContainers,
  onChange,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string>(
    currentKey || Object.values(containers ?? {})?.[0]?.name,
  );
  const { t } = useTranslation();

  if (_.isEmpty(containers)) {
    return null;
  }

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };
  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string) => {
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
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
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
