import { safeLoad } from 'js-yaml';
import { saveAs } from 'file-saver';

export const downloadYaml = (data) => {
  const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
  let filename = 'k8s-object.yaml';
  try {
    const obj = safeLoad(data);
    if (obj.kind) {
      filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  saveAs(blob, filename);
};
