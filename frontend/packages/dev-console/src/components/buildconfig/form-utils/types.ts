import type { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import type { EnvironmentVariablesSectionFormData } from '../sections/EnvironmentVariablesSection';
import type { HooksSectionFormData } from '../sections/HooksSection';
import type { ImagesSectionFormData } from '../sections/ImagesSection';
import type { NameSectionFormData } from '../sections/NameSection';
import type { PolicySectionFormData } from '../sections/PolicySection';
import type { SecretsSectionFormData } from '../sections/SecretsSection';
import type { SourceSectionFormData } from '../sections/SourceSection';
import type { TriggersSectionFormData } from '../sections/TriggersSection';

export { BuildStrategyType } from '@console/internal/components/utils/build-utils';

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
