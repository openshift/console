import { Pipeline } from '../../../utils/pipeline-augment';
import { RouteTemplate } from '../utils/triggers';

export type PipelineDetailsTabProps = {
  obj: Pipeline;
  customData: {
    templateNames: RouteTemplate[];
    queryPrefix: string;
  };
};
