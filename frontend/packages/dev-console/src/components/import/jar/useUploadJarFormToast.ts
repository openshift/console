import { useMemo, useCallback } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import type { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { BuildConfigModel, BuildModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace, useToast, getOwnedResources } from '@console/shared';

export const useUploadJarFormToast = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [namespace] = useActiveNamespace();
  const buildsResource: WatchK8sResource = useMemo(
    () => ({
      kind: BuildModel.kind,
      namespace,
      isList: true,
    }),
    [namespace],
  );
  const [builds] = useK8sWatchResource<K8sResourceKind[]>(buildsResource);

  return useCallback(
    (resp) => {
      const createdBuildConfig = resp.find((d) => d.kind === BuildConfigModel.kind);
      const ownBuilds = getOwnedResources(createdBuildConfig, builds);
      const buildName = `${createdBuildConfig.metadata.name}-${ownBuilds.length + 1}`;
      const link = `${resourcePathFromModel(BuildModel, buildName, namespace)}/logs`;
      toast.addToast({
        variant: AlertVariant.info,
        title: t('devconsole~JAR file uploading'),
        content: t(
          'devconsole~JAR file is uploading to {{namespace}}. You can view the upload progress in the build logs. This may take a few minutes. If you exit the browser while upload is in progress it may fail.',
          {
            namespace,
          },
        ),
        timeout: true,
        actions: [
          {
            dismiss: true,
            label: t('devconsole~View build logs'),
            callback: () => navigate(link),
          },
        ],
      });
    },
    [builds, namespace, navigate, t, toast],
  );
};
