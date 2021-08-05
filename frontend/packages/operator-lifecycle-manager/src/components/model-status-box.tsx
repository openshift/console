import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorPage404 } from '@console/internal/components/error';
import { LoadingBox } from '@console/internal/components/utils';
import { GroupVersionKind, kindForReference } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

type ModelStatusBoxProps = {
  groupVersionKind: GroupVersionKind;
};

const ModelStatusBox: React.FC<ModelStatusBoxProps> = ({ groupVersionKind, children }) => {
  const { t } = useTranslation();
  const [model, modelsLoading] = useK8sModel(groupVersionKind);
  return modelsLoading ? (
    <LoadingBox />
  ) : model ? (
    <>{children}</>
  ) : (
    <ErrorPage404
      message={t(
        "olm~The server doesn't have a resource type {{kind}}. Try refreshing the page if it was recently added.",
        { kind: kindForReference(groupVersionKind) },
      )}
    />
  );
};

export default ModelStatusBox;
