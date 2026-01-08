import { JSONSchema7 } from 'json-schema';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export interface HelmOCIChartFormData {
  releaseName: string;
  chartURL: string;
  chartVersion: string;
  namespace: string;
}

export interface HelmOCIInstallFormData extends HelmOCIChartFormData {
  yamlData: string;
  formData: any;
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
