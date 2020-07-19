import * as React from 'react';
import { HorizontalPodAutoscalerKind, k8sList } from '@console/internal/module/k8s';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';

export const useRelatedHPA = (
  workloadAPI: string,
  workloadKind: string,
  workloadName: string,
  workloadNamespace: string,
): [HorizontalPodAutoscalerKind, string] => {
  const [errorMessage, setErrorMessage] = React.useState<string>(null);
  const [hpa, setHPA] = React.useState<HorizontalPodAutoscalerKind>(null);

  React.useEffect(() => {
    k8sList(HorizontalPodAutoscalerModel, { ns: workloadNamespace })
      .then((hpaList: HorizontalPodAutoscalerKind[]) => {
        const matchingHPA = hpaList.find((thisHPA: HorizontalPodAutoscalerKind) => {
          const ref = thisHPA.spec.scaleTargetRef;
          return (
            ref.apiVersion === workloadAPI && ref.kind === workloadKind && ref.name === workloadName
          );
        });
        if (!matchingHPA) {
          setErrorMessage(`No matching ${HorizontalPodAutoscalerModel.label} found.`);
          return;
        }
        setHPA({
          apiVersion: `${HorizontalPodAutoscalerModel.apiGroup}/${HorizontalPodAutoscalerModel.apiVersion}`,
          kind: HorizontalPodAutoscalerModel.kind,
          ...matchingHPA,
        });
      })
      .catch((error) => {
        setErrorMessage(
          error?.message || `No matching ${HorizontalPodAutoscalerModel.label} found.`,
        );
      });
  }, [workloadAPI, workloadKind, workloadName, workloadNamespace]);

  return [hpa, errorMessage];
};
