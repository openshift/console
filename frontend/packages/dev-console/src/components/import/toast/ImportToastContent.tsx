import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteLinkAndCopy } from '@console/internal/components/routes';
import { K8sResourceKind, RouteKind } from '@console/internal/module/k8s';

interface ImportToastContentProps {
  deployedResources: K8sResourceKind[];
  route?: RouteKind;
}

const ImportToastContent: React.FC<ImportToastContentProps> = ({
  deployedResources = [],
  route,
}) => {
  const { t } = useTranslation();
  if (!deployedResources || deployedResources.length === 0) {
    return null;
  }
  return (
    <>
      {deployedResources.length &&
        t('devconsole~{{kind}} created successfully.', { kind: deployedResources[0].kind })}
      {route && (
        <p>
          <RouteLinkAndCopy route={route} />
        </p>
      )}
    </>
  );
};

export default ImportToastContent;
