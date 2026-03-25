import type { PipelineKind } from '../../types/pipeline';

export enum PipelineType {
  PAC = 'pac',
  PIPELINE = 'pipeline',
}
export interface PipelineData {
  enabled: boolean;
  type?: PipelineType;
  template?: PipelineKind;
}
