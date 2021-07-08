import * as React from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { BuildConfigModel, BuildModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace, useToast, getOwnedResources } from '@console/shared';

export const useUploadJarFormToast = () => {
  const toast = useToast();
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const buildsResource: WatchK8sResource = React.useMemo(
    () => ({
      kind: BuildModel.kind,
      namespace,
      isList: true,
    }),
    [namespace],
  );
  const [builds] = useK8sWatchResource<K8sResourceKind[]>(buildsResource);

  return React.useCallback(
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
            callback: () => history.push(link),
          },
        ],
      });
    },
    [builds, namespace, t, toast],
  );
};
