import type { FC, MouseEvent } from 'react';
import { useMemo } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { resourcePath } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { JobModel, PodModel } from '@console/internal/models';
import type { PodKind, JobKind } from '@console/internal/module/k8s';
import { isModifiedEvent } from '@console/shared';
import { EXPORT_JOB_PREFIX } from '../../const';

interface ExportViewLogButtonProps {
  name: string;
  namespace: string;
  onViewLog?: () => void;
}

const ExportViewLogButton: FC<ExportViewLogButtonProps> = ({ name, namespace, onViewLog }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [job, jobLoaded] = useK8sWatchResource<JobKind>({
    kind: JobModel.kind,
    name: EXPORT_JOB_PREFIX + name,
    namespace,
    isList: false,
  });

  const podResource = useMemo(
    () =>
      jobLoaded && job?.metadata
        ? {
            kind: PodModel.kind,
            isList: false,
            namespace: job.metadata.namespace,
            selector: job.spec.selector,
          }
        : null,
    [job, jobLoaded],
  );

  const [podData, podLoaded] = useK8sWatchResource<PodKind>(podResource);

  const path =
    podLoaded &&
    podData?.kind === PodModel?.kind &&
    podData?.metadata &&
    `${resourcePath(PodModel.kind, podData?.metadata.name, podData?.metadata.namespace)}/logs`;

  const viewLog = (e: MouseEvent<HTMLButtonElement>) => {
    if (isModifiedEvent(e)) {
      return;
    }
    e.preventDefault();
    navigate(path);
    onViewLog?.();
  };

  const linkedButton = (
    <Button
      component="a"
      variant="link"
      data-test="export-view-log-btn"
      href={path}
      onClick={viewLog}
    >
      {t('topology~View Logs')}
    </Button>
  );
  const disabledButton = (
    <Tooltip content={t('topology~Logs not available yet')}>
      <Button component="a" variant="link" data-test="export-view-log-btn" isAriaDisabled>
        {t('topology~View Logs')}
      </Button>
    </Tooltip>
  );

  return path ? linkedButton : disabledButton;
};

export default ExportViewLogButton;
