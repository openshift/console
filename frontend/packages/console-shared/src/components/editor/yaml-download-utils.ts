import { saveAs } from 'file-saver';
import { safeLoad } from 'js-yaml';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';

export const downloadYaml = (data: BlobPart) => {
  const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
  let filename = 'k8s-object.yaml';
  try {
    const obj = safeLoad(String(data)) as K8sResourceKind;
    if (obj.kind) {
      filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Could not parse YAML file:', e);
  }
  saveAs(blob, filename);
};
