import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorPage404 } from '@console/internal/components/error';
import { GroupVersionKind, kindForReference } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

type ModelStatusBoxProps = {
  groupVersionKind: GroupVersionKind;
};

const ModelStatusBox: React.FC<ModelStatusBoxProps> = ({ groupVersionKind, children }) => {
  const { t } = useTranslation();
  const [model, inFlight] = useK8sModel(groupVersionKind);

  if (!model && inFlight) {
    return null;
  }
  if (!model) {
    return (
      <ErrorPage404
        bodyText={t(
          "olm~The server doesn't have a resource type {{kind}}. Try refreshing the page if it was recently added.",
          { kind: kindForReference(groupVersionKind) },
        )}
      />
    );
  }
  return <>{children}</>;
};

export default ModelStatusBox;
