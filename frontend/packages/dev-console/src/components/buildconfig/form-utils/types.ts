import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EnvironmentVariablesSectionFormData } from '../sections/EnvironmentVariablesSection';
import { HooksSectionFormData } from '../sections/HooksSection';
import { ImagesSectionFormData } from '../sections/ImagesSection';
import { NameSectionFormData } from '../sections/NameSection';
import { PolicySectionFormData } from '../sections/PolicySection';
import { SecretsSectionFormData } from '../sections/SecretsSection';
import { SourceSectionFormData } from '../sections/SourceSection';
import { TriggersSectionFormData } from '../sections/TriggersSection';

export { BuildStrategyType } from '@console/internal/components/build';

export type BuildConfigFormikValues = {
  editorType: EditorType;
  yamlData: string;
  resourceVersion: string | undefined;
  formReloadCount?: number;
} & NameSectionFormData &
  SourceSectionFormData &
  ImagesSectionFormData &
  EnvironmentVariablesSectionFormData &
  TriggersSectionFormData &
  SecretsSectionFormData &
  PolicySectionFormData &
  HooksSectionFormData;
