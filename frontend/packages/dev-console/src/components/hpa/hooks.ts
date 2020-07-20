import * as React from 'react';
import { HorizontalPodAutoscalerKind, k8sList } from '@console/internal/module/k8s';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { doesHpaMatch } from './hpa-utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

export const useRelatedHPA = (
  workloadAPI: string,
  workloadKind: string,
  workloadName: string,
  workloadNamespace: string,
): [HorizontalPodAutoscalerKind, string] => {
  const [errorMessage, setErrorMessage] = React.useState<string>(null);
  const [hpaName, setHPAName] = React.useState<string>(null);

  React.useEffect(() => {
    k8sList(HorizontalPodAutoscalerModel, { ns: workloadNamespace })
      .then((hpaList: HorizontalPodAutoscalerKind[]) => {
        const matchingHPA = hpaList.find(
          doesHpaMatch({
            apiVersion: workloadAPI,
            kind: workloadKind,
            metadata: { name: workloadName },
          }),
        );
        if (!matchingHPA) {
          setErrorMessage(`No matching ${HorizontalPodAutoscalerModel.label} found.`);
          return;
        }
        setHPAName(matchingHPA.metadata.name);
      })
      .catch((error) => {
        setErrorMessage(
          error?.message || `No matching ${HorizontalPodAutoscalerModel.label} found.`,
        );
      });
  }, [workloadAPI, workloadKind, workloadName, workloadNamespace]);

  const resource = React.useMemo(
    () =>
      hpaName && {
        kind: HorizontalPodAutoscalerModel.kind,
        name: hpaName,
        namespace: workloadNamespace,
      },
    [hpaName, workloadNamespace],
  );
  const [hpa, loaded, error] = useK8sWatchResource<HorizontalPodAutoscalerKind>(resource);

  return [!error && hpaName && loaded ? hpa : null, error || errorMessage];
};
