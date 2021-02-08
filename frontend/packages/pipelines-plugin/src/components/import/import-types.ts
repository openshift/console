import { PipelineKind } from '../../types';

export interface PipelineData {
  enabled: boolean;
  template?: PipelineKind;
}
