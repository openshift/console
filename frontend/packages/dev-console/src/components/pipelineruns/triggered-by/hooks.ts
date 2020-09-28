import { merge } from 'lodash';
// FIXME react-redux types are 6.x while react-redux is 7.x
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { KebabAction } from '@console/internal/components/utils';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { StartedByAnnotation } from '../../pipelines/const';

type AnnotationMap = { [annotationKey: string]: string };

const mergeAnnotationsWithResource = (annotations: AnnotationMap, resource: K8sResourceCommon) => {
  return merge({}, resource, { metadata: { annotations } });
};

export const useUserAnnotationForManualStart = (): AnnotationMap => {
  const user = useSelector((state) => state.UI.get('user'));

  return {
    [StartedByAnnotation.user]: user.metadata.name,
  };
};

export const usePipelineRunWithUserAnnotation = (plr: PipelineRun): PipelineRun => {
  const annotations = useUserAnnotationForManualStart();

  return plr && mergeAnnotationsWithResource(annotations, plr);
};

export const useMenuActionsWithUserAnnotation = (menuActions: KebabAction[]): KebabAction[] => {
  const annotations = useUserAnnotationForManualStart();

  return menuActions.map((kebabAction) => {
    return (kind, resource, ...rest) =>
      kebabAction(kind, mergeAnnotationsWithResource(annotations, resource), ...rest);
  });
};
