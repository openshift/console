import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';

export type SupportedMetricTypes = 'cpu' | 'memory';

export type HPAFormValues = {
  showCanUseYAMLMessage: boolean;
  disabledFields: {
    cpuUtilization: boolean;
    memoryUtilization: boolean;
  };
  editorType: EditorType;
  formData: HorizontalPodAutoscalerKind;
  yamlData: string;
};
