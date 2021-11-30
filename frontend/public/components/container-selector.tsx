import * as React from 'react';

import { ContainerSpec } from '../module/k8s';
import { Checkbox } from '@patternfly/react-core';

export const ContainerSelector: React.FC<ContainerSelectorProps> = ({
  containers,
  onChange,
  selected,
}) => (
  <div className="pf-c-form__checkbox-row">
    {containers.map((container: ContainerSpec) => (
      <Checkbox
        key={container.name}
        label={`${container.name} from image ${container.image}`}
        id={container.name}
        isChecked={selected.includes(container.name)}
        data-checked-state={selected.includes(container.name)}
        onChange={onChange}
      />
    ))}
  </div>
);

export type ContainerSelectorProps = {
  containers: ContainerSpec[];
  onChange: (checked: boolean, event: React.FormEvent<HTMLInputElement>) => void;
  selected: string[];
};
