import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary, ExternalLink } from '@console/internal/components/utils';
import { getGitProviderIcon } from './repository-utils';
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
                  {getGitProviderIcon(spec?.url)} {spec?.url}
                </ExternalLink>
              </dd>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoryDetails;
