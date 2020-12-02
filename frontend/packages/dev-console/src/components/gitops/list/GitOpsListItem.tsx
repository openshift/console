import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Grid, GridItem, Card, CardBody } from '@patternfly/react-core';
import { history, ResourceLink } from '@console/internal/components/utils';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import './GitOpsListItem.scss';

interface GitOpsListItemProps {
  appGroup: GitOpsAppGroupData;
}

const GitOpsListItem: React.FC<GitOpsListItemProps> = ({ appGroup }) => {
  const { t } = useTranslation();
  const handleCardClick = () => {
    history.push(`/environments/${appGroup.name}?url=${appGroup.repo_url}`);
  };

  return (
    <Card className="odc-gitops-list-item" onClick={handleCardClick} isHoverable>
      <CardBody>
        <Grid className="odc-gitops-list-item__body">
          <GridItem lg={6} md={6} sm={6}>
            <ResourceLink kind="application" name={appGroup.name} linkTo={false} />
          </GridItem>
          <GridItem lg={6} md={6} sm={6}>
            {t('devconsole~{{count, number}} Environment', {
              count: _.size(appGroup.environments),
            })}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default GitOpsListItem;
