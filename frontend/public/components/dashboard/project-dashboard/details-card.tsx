import * as _ from 'lodash';
import * as React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardLink from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import { getName, getRequester, GreenCheckCircleIcon } from '@console/shared';
import { LabelList, resourcePathFromModel } from '../../utils';
import { ProjectModel } from '../../../models';
import { ProjectDashboardContext } from './project-dashboard-context';

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
    <DashboardCard data-test-id="details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('public~Details')}</DashboardCardTitle>
        <DashboardCardLink to={detailsLink}>{t('public~View all')}</DashboardCardLink>
      </DashboardCardHeader>
      <DashboardCardBody>
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
                <DashboardCardLink to={detailsLink}>{t('public~View all')}</DashboardCardLink>
              )}
            </div>
          </DetailItem>
          <DetailItem isLoading={!obj} title={t('public~Description')}>
            <span
              className={cx({
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
      </DashboardCardBody>
    </DashboardCard>
  );
};
