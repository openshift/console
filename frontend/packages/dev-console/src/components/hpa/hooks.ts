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
): [HorizontalPodAutoscalerKind, boolean, string] => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
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
        setLoaded(true);
        if (!matchingHPA) {
          return;
        }
        setHPAName(matchingHPA.metadata.name);
      })
      .catch((error) => {
        setLoaded(true);
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
  const [hpa, hpaWatchLoaded, error] = useK8sWatchResource<HorizontalPodAutoscalerKind>(resource);

  const hpaLoaded = loaded && hpaWatchLoaded;
  const returnHPA = !error && hpa && hpaLoaded ? hpa : null;
  const hpaError = error || errorMessage;
  return [returnHPA, hpaLoaded, hpaError];
};
