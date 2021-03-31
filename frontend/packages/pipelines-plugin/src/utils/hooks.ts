import { gte } from 'semver';
import { BadgeType, getBadgeFromType } from '@console/shared';
import { usePipelineOperatorVersion } from '../components/pipelines/utils/pipeline-operator';

export const usePipelineTechPreviewBadge = (namespace: string) => {
  const operator = usePipelineOperatorVersion(namespace);
  if (!operator) return null;
  const installedGA = gte(operator.version, '1.4.0');
  return installedGA ? null : getBadgeFromType(BadgeType.TECH);
};
