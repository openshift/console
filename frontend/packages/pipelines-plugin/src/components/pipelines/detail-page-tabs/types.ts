import { PipelineKind } from 'packages/pipelines-plugin/src/types';
import { RouteTemplate } from '../utils/triggers';

export type PipelineDetailsTabProps = {
  obj: PipelineKind;
  customData: {
    templateNames: RouteTemplate[];
    queryPrefix: string;
  };
};
