import type { JSONSchema7 } from 'json-schema';
import type { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export interface HelmURLChartFormData {
  releaseName: string;
  chartURL: string;
  chartVersion: string;
  namespace: string;
  basicAuthSecretName?: string;
}

export interface HelmURLInstallFormData extends HelmURLChartFormData {
  yamlData: string;
  formData: Record<string, unknown>;
  formSchema: JSONSchema7;
  editorType: EditorType;
  chartReadme: string;
  chartName: string;
  appVersion: string;
}

export enum WizardStep {
  ChartDetails = 'chartDetails',
  ConfigureInstall = 'configureInstall',
}
