import * as _ from 'lodash';
import * as React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, CardTitle, CardActions, Button } from '@patternfly/react-core';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { OverviewDetailItem } from '@openshift-console/plugin-shared/src';
import { getName, getRequester, GreenCheckCircleIcon } from '@console/shared';
import { useActiveCluster } from '@console/shared/src/hooks/useActiveCluster';
import { LabelList, resourcePathFromModel } from '../../utils';
import { ProjectModel } from '../../../models';
import { ProjectDashboardContext } from './project-dashboard-context';
import { Link } from 'react-router-dom';

export const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  const [cluster] = useActiveCluster();
  const keys = _.keys(obj.metadata.labels).sort();
  const labelsSubset = _.take(keys, 3);
  const firstThreelabels = _.pick(obj.metadata.labels, labelsSubset);
  const description = obj.metadata.annotations?.['openshift.io/description'];
  const detailsLink = `${resourcePathFromModel(
    ProjectModel,
    obj.metadata.name,
    undefined,
    cluster,
  )}/details`;
  const serviceMeshEnabled = obj.metadata?.labels?.['maistra.io/member-of'];
  const { t } = useTranslation();
  return (
    <Card data-test-id="details-card">
      <CardHeader>
        <CardTitle>{t('public~Details')}</CardTitle>
        <CardActions className="co-overview-card__actions">
          <Link to={detailsLink} data-test="details-card-view-all">
            {t('public~View all')}
          </Link>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DetailsBody>
          <OverviewDetailItem isLoading={!obj} title={t('public~Name')}>
            {getName(obj)}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('public~Requester')}>
            {getRequester(obj) || <span className="text-muted">{t('public~No requester')}</span>}
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('public~Labels')}>
            <div className="co-project-dashboard__details-labels">
              <LabelList kind={ProjectModel.kind} labels={firstThreelabels} />
              {keys.length > 3 && (
                <Button variant="link">
                  <Link to={detailsLink}>{t('public~View all')}</Link>
                </Button>
              )}
            </div>
          </OverviewDetailItem>
          <OverviewDetailItem isLoading={!obj} title={t('public~Description')}>
            <span
              className={cx({
                'text-muted': !description,
                'co-project-dashboard-details-card__description': description,
              })}
            >
              {description || t('public~No description')}
            </span>
          </OverviewDetailItem>
          {serviceMeshEnabled && (
            <OverviewDetailItem isLoading={!obj} title={t('public~Service mesh')}>
              <GreenCheckCircleIcon /> {t('public~Service mesh enabled')}
            </OverviewDetailItem>
          )}
        </DetailsBody>
      </CardBody>
    </Card>
  );
};
