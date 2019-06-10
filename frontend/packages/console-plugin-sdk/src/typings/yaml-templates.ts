import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface YAMLTemplate {
    /** Model associated with the template. */
    model: K8sKind;
    /** The YAML template to use. */
    template: string;
    /** The name of the template. If not specified, use the `default` value. */
    templateName?: string;
  }
}

export interface YAMLTemplate extends Extension<ExtensionProperties.YAMLTemplate> {
  type: 'YAMLTemplate';
}

export function isYAMLTemplate(e: Extension<any>): e is YAMLTemplate {
  return e.type === 'YAMLTemplate';
}
