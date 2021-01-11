import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Grid, GridItem, Card, CardBody } from '@patternfly/react-core';
import { history, ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import { getArgoCDFilteredAppsURI } from '../utils/gitops-utils';
import './GitOpsListItem.scss';

interface GitOpsListItemProps {
  appGroup: GitOpsAppGroupData;
  argocdLink?: K8sResourceKind;
}

const GitOpsListItem: React.FC<GitOpsListItemProps> = ({ appGroup, argocdLink }) => {
  const { t } = useTranslation();
  const argocdLinkUrl = getArgoCDFilteredAppsURI(argocdLink.spec.href, appGroup.name);
  const handleCardClick = () => {
    history.push(`/environments/${appGroup.name}?url=${appGroup.repo_url}`);
  };

  return (
    <Card className="odc-gitops-list-item" onClick={handleCardClick} isHoverable>
      <CardBody>
        <Grid className="odc-gitops-list-item__body">
          <GridItem lg={5} md={5} sm={5}>
            <ResourceLink kind="application" name={appGroup.name} linkTo={false} />
          </GridItem>
          <GridItem lg={5} md={5} sm={5}>
            {t('gitops-plugin~{{count, number}} Environment', {
              count: _.size(appGroup.environments),
            })}
          </GridItem>
          <GridItem lg={2} md={2} sm={2}>
            {argocdLinkUrl && (
              <ExternalLink
                href={`${argocdLinkUrl}`}
                text={t('gitops-plugin~Argo CD')}
                stopPropagation
              />
            )}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default GitOpsListItem;
