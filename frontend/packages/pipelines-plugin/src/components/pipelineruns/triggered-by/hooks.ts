import { merge } from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useSelector } from 'react-redux';
import { getUser } from '@console/dynamic-plugin-sdk';
import { KebabAction, Kebab } from '@console/internal/components/utils';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { PipelineRunKind } from '../../../types';
import { StartedByAnnotation } from '../../pipelines/const';

type AnnotationMap = { [annotationKey: string]: string };

const mergeAnnotationsWithResource = (annotations: AnnotationMap, resource: K8sResourceCommon) => {
  return merge({}, resource, { metadata: { annotations }, spec: {} });
};

export const useUserAnnotationForManualStart = (): AnnotationMap => {
  const user = useSelector(getUser);

  if (!user?.metadata?.name) {
    return {};
  }

  return {
    [StartedByAnnotation.user]: user.metadata.name,
  };
};

export const usePipelineRunWithUserAnnotation = (plr: PipelineRunKind): PipelineRunKind => {
  const annotations = useUserAnnotationForManualStart();

  return plr && mergeAnnotationsWithResource(annotations, plr);
};

export const useMenuActionsWithUserAnnotation = (menuActions: KebabAction[]): KebabAction[] => {
  const annotations = useUserAnnotationForManualStart();

  return menuActions.map((kebabAction) => {
    if (Object.values(Kebab.factory).includes(kebabAction)) {
      return kebabAction;
    }
    return (kind, resource, ...rest) =>
      kebabAction(kind, mergeAnnotationsWithResource(annotations, resource), ...rest);
  });
};
