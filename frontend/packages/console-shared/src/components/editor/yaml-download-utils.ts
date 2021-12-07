import { saveAs } from 'file-saver';
import { load } from 'js-yaml';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const downloadYaml = (data: BlobPart) => {
  const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
  let filename = 'k8s-object.yaml';
  try {
    const obj: K8sResourceKind = load(data as string);
    if (obj.kind) {
      filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not parse YAML file:', e);
  }
  saveAs(blob, filename);
};
