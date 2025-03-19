import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ContainerSpec } from '../module/k8s';
import { Checkbox } from '@patternfly/react-core';

export const ContainerSelector: React.FC<ContainerSelectorProps> = ({
  containers,
  onChange,
  selected,
}) => {
  const { t } = useTranslation();
  return (
    <div className="pf-v6-c-form__checkbox-row">
      {containers.map((container: ContainerSpec) => (
        <Checkbox
          key={container.name}
          label={t('public~{{containerName}} from image {{containerImage}}', {
            containerName: container.name,
            containerImage: container.image,
          })}
          id={container.name}
          isChecked={selected.includes(container.name)}
          data-checked-state={selected.includes(container.name)}
          onChange={onChange}
        />
      ))}
    </div>
  );
};
export type ContainerSelectorProps = {
  containers: ContainerSpec[];
  onChange: (event: React.FormEvent<HTMLInputElement>, checked: boolean) => void;
  selected: string[];
};
