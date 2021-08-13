import * as React from 'react';
import { GithubIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary, ExternalLink } from '@console/internal/components/utils';
import { RepositoryKind } from './types';

export interface RepositoryDetailsProps {
  obj: RepositoryKind;
}

const RepositoryDetails: React.FC<RepositoryDetailsProps> = ({ obj: repository }) => {
  const { t } = useTranslation();
  const { spec } = repository;

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('pipelines-plugin~Repository details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={repository} />
        </div>
        {spec?.url && (
          <div className="col-sm-6" data-test="pl-repository-customdetails">
            <dl>
              <dt>{t('pipelines-plugin~Repository')}</dt>
              <dd>
                <ExternalLink href={spec?.url}>
                  <GithubIcon title={spec?.url} /> {spec?.url}
                </ExternalLink>
              </dd>
              {spec?.branch && (
                <>
                  <dt>{t('pipelines-plugin~Branch')}</dt>
                  <dd data-test="pl-repository-branch">{spec.branch}</dd>
                </>
              )}
              {spec?.event_type && (
                <>
                  <dt>{t('pipelines-plugin~Event type')}</dt>
                  <dd data-test="pl-repository-eventtype">{spec.event_type}</dd>
                </>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetails;
