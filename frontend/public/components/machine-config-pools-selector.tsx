import * as React from 'react';
import { Checkbox } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { isMCPWorker, MachineConfigPoolKind, NodeTypeNames } from '../module/k8s';
import { NodeModel } from '../models';

export const MachineConfigPoolsSelector: React.FC<MachineConfigPoolsSelectorProps> = ({
  machineConfigPools,
  onChange,
  selected,
}) => {
  const { t } = useTranslation();
  return (
    <div className="form-group">
      <label id="version-label">
        {t('public~Select {{resource}} to pause', { resource: NodeModel.labelPlural })}
      </label>
      {machineConfigPools.map((mcp: MachineConfigPoolKind) => (
        <Checkbox
          key={mcp.metadata.uid}
          label={`${isMCPWorker(mcp) ? NodeTypeNames.Worker : mcp.metadata.name} ${
            NodeModel.labelPlural
          }`}
          id={mcp.metadata.name}
          isChecked={selected.includes(mcp.metadata.name)}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

export type MachineConfigPoolsSelectorProps = {
  machineConfigPools: MachineConfigPoolKind[];
  onChange: (checked: boolean, event: React.FormEvent<HTMLInputElement>) => void;
  selected: string[];
};
