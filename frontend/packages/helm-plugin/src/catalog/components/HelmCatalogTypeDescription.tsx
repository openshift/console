import * as React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { ProjectHelmChartRepositoryModel } from '../../models';

const LinkToCreatePHCR: React.FC = () => {
  const [namespace] = useActiveNamespace();
  const [isAllowed] = useAccessReview({
    group: ProjectHelmChartRepositoryModel.apiGroup,
    resource: ProjectHelmChartRepositoryModel.plural,
    verb: 'create',
    namespace,
  });

  const createPHCR = (
    <>
      {' '}
      <Trans ns="helm-plugin">
        Alternatively, developers can{' '}
        <Link to={`/ns/${namespace}/helmchartrepositories/~new/form?actionOrigin=catalog`}>
          try to configure their own custom Helm Chart repository
        </Link>
        .
      </Trans>
    </>
  );

  return isAllowed ? createPHCR : null;
};

const HelmCatalogTypeDescription: React.FC = () => {
  return (
    <>
      <Trans ns="helm-plugin">
        Browse for charts that help manage complex installations and upgrades. Cluster
        administrators can customize the content made available in the catalog.
        <LinkToCreatePHCR />
      </Trans>
    </>
  );
};

export default HelmCatalogTypeDescription;
