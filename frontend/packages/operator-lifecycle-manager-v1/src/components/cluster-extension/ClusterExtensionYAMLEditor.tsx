import type { FC } from 'react';
import { CreateYAML } from '@console/internal/components/create-yaml';

export const ClusterExtensionYAMLEditor: FC<ClusterExtensionYAMLEditorProps> = ({
  initialYAML = '',
  onChange,
}) => {
  return <CreateYAML hideHeader onChange={onChange} template={initialYAML} />;
};

export type ClusterExtensionYAMLEditorProps = {
  initialYAML?: string;
  onChange?: (yaml: string) => void;
};
