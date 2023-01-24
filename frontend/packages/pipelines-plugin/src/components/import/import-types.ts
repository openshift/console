import { PipelineKind } from '../../types';

export enum PipelineType {
  PAC = 'pac',
  PIPELINE = 'pipeline',
}
export interface PipelineData {
  enabled: boolean;
  type?: PipelineType;
  template?: PipelineKind;
}
