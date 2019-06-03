import { K8sKind } from '@console/internal/module/k8s';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface YAMLTemplate {
    model: K8sKind;
    template: string;
    templateName?: string;
  }
}

export interface YAMLTemplate extends Extension<ExtensionProperties.YAMLTemplate> {
  type: 'YAMLTemplate';
}

export function isYAMLTemplate(e: Extension<any>): e is YAMLTemplate {
  return e.type === 'YAMLTemplate';
}
