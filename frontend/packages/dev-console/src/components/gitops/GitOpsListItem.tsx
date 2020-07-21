import * as React from 'react';
import * as _ from 'lodash';
import { Grid, GridItem, Card, CardBody } from '@patternfly/react-core';
import { history, ResourceLink } from '@console/internal/components/utils';
import { GitOpsAppGroupData } from './gitops-types';
import './GitOpsListItem.scss';

interface GitOpsListItemProps {
  appGroup: GitOpsAppGroupData;
}

const GitOpsListItem: React.FC<GitOpsListItemProps> = ({ appGroup }) => {
  const handleCardClick = () => {
    history.push(`/gitops/application/${appGroup.name}?url=${appGroup.repo_url}`);
  };

  return (
    <Card className="odc-gitops-list-item" onClick={handleCardClick} isHoverable>
      <CardBody>
        <Grid className="odc-gitops-list-item__body">
          <GridItem lg={6} md={6} sm={6}>
            <ResourceLink kind="application" name={appGroup.name} linkTo={false} />
          </GridItem>
          <GridItem lg={6} md={6} sm={6}>
            {`${_.size(appGroup.environments)} Environments`}
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default GitOpsListItem;
