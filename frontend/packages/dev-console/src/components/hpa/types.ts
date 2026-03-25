import type { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import type { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export type SupportedMetricTypes = 'cpu' | 'memory';

export type HPAFormValues = {
  showCanUseYAMLMessage: boolean;
  disabledFields: {
    name: boolean;
  };
  editorType: EditorType;
  formData: HorizontalPodAutoscalerKind;
  yamlData: string;
};
