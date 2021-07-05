import { EditorType } from '@console/dynamic-plugin-sdk/src/shared/components/synced-editor/editor-toggle';
import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';

export type SupportedMetricTypes = 'cpu' | 'memory';

export type HPAFormValues = {
  showCanUseYAMLMessage: boolean;
  disabledFields: {
    name: boolean;
    cpuUtilization: boolean;
    memoryUtilization: boolean;
  };
  editorType: EditorType;
  formData: HorizontalPodAutoscalerKind;
  yamlData: string;
};
