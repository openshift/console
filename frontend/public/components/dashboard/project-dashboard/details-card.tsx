import * as _ from 'lodash';
import * as React from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardHeader, CardTitle, CardActions, Button } from '@patternfly/react-core';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { getName, getRequester, GreenCheckCircleIcon } from '@console/shared';
import { LabelList, resourcePathFromModel } from '../../utils';
import { ProjectModel } from '../../../models';
import { ProjectDashboardContext } from './project-dashboard-context';
import { Link } from 'react-router-dom';

export const DetailsCard: React.FC = () => {
  const { obj } = React.useContext(ProjectDashboardContext);
  const keys = _.keys(obj.metadata.labels).sort();
  const labelsSubset = _.take(keys, 3);
  const firstThreelabels = _.pick(obj.metadata.labels, labelsSubset);
  const description = obj.metadata.annotations?.['openshift.io/description'];
  const detailsLink = `${resourcePathFromModel(ProjectModel, obj.metadata.name)}/details`;
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
          <DetailItem isLoading={!obj} title={t('public~Name')}>
            {getName(obj)}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('public~Requester')}>
            {getRequester(obj) || <span className="text-muted">{t('public~No requester')}</span>}
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('public~Labels')}>
            <div className="co-project-dashboard__details-labels">
              <LabelList kind={ProjectModel.kind} labels={firstThreelabels} />
              {keys.length > 3 && (
                <Button variant="link">
                  <Link to={detailsLink}>{t('public~View all')}</Link>
                </Button>
              )}
            </div>
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('public~Description')}>
            <span
              className={classnames({
                'text-muted': !description,
                'co-project-dashboard-details-card__description': description,
              })}
            >
              {description || t('public~No description')}
            </span>
          </DetailItem>
          {serviceMeshEnabled && (
            <DetailItem isLoading={!obj} title={t('public~Service mesh')}>
              <GreenCheckCircleIcon /> {t('public~Service mesh enabled')}
            </DetailItem>
          )}
        </DetailsBody>
      </CardBody>
    </Card>
  );
};
