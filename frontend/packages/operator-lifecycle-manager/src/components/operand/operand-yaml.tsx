import type { FC } from 'react';
import { CreateYAML } from '@console/internal/components/create-yaml';

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const OperandYAML: FC<OperandYAMLProps> = ({ onChange, next, initialYAML = '' }) => {
  return (
    <CreateYAML
      hideHeader
      onChange={onChange}
      template={initialYAML}
      {...(next && { resourceObjPath: () => next })}
    />
  );
};

export type OperandYAMLProps = {
  initialYAML?: string;
  onChange?: (yaml: string) => void;
  next?: string;
};
