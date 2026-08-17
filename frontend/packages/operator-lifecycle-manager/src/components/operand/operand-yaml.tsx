import type { FC } from 'react';
import { CreateYAML } from '@console/internal/components/create-yaml';

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const OperandYAML: FC<OperandYAMLProps> = ({
  onCancel,
  onChange,
  next,
  initialYAML = '',
}) => (
  <CreateYAML
    hideHeader
    onChange={onChange}
    onCancel={onCancel}
    template={initialYAML}
    {...(next && { resourceObjPath: () => next })}
  />
);

export type OperandYAMLProps = {
  initialYAML?: string;
  onCancel?: () => void;
  onChange?: (yaml: string) => void;
  next?: string;
};
