import * as React from 'react';
import { ClipboardCopy } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  SectionHeading,
  ResourceSummary,
  ExternalLink,
  ResourceLink,
  DetailsItem,
} from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { usePacInfo } from './hooks/pac-hook';
import { getGitProviderIcon } from './repository-utils';
import { RepositoryKind } from './types';

export interface RepositoryDetailsProps {
  obj: RepositoryKind;
}

const RepositoryDetails: React.FC<RepositoryDetailsProps> = ({ obj: repository }) => {
  const { t } = useTranslation();
  const { spec } = repository;
  const [pac, loaded] = usePacInfo();

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={t('pipelines-plugin~Repository details')} />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={repository} />
        </div>
        <div className="col-sm-6">
          <dl>
            {spec?.url && (
              <DetailsItem
                label={t('pipelines-plugin~Repository')}
                obj={repository}
                path="spec.url"
                data-test="pl-repository-customdetails"
              >
                <ExternalLink href={spec?.url}>
                  {getGitProviderIcon(spec?.url)} {spec?.url}
                </ExternalLink>
              </DetailsItem>
            )}
            {spec?.git_provider?.user && (
              <DetailsItem
                label={t('pipelines-plugin~Username')}
                obj={repository}
                path="spec.git_provider.user"
                data-test="git-provider-username"
              >
                {spec?.git_provider?.user}
              </DetailsItem>
            )}
            {spec?.git_provider?.secret?.name && (
              <DetailsItem
                label={t('pipelines-plugin~Git access token')}
                obj={repository}
                path="spec.git_provider.secret.name"
                data-test="git-provider-secret-name"
              >
                <ResourceLink
                  kind={SecretModel.kind}
                  name={spec?.git_provider?.secret?.name}
                  namespace={repository.metadata.namespace}
                />
              </DetailsItem>
            )}
            {spec?.git_provider?.webhook_secret?.name && pac && loaded && (
              <DetailsItem
                label={t('pipelines-plugin~Webhook URL')}
                obj={repository}
                data-test="webhook-url"
              >
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" style={{ flex: '1' }}>
                  {pac.data['controller-url']}
                </ClipboardCopy>
              </DetailsItem>
            )}
            {spec?.git_provider?.webhook_secret?.name && (
              <DetailsItem
                label={t('pipelines-plugin~Webhook Secret')}
                obj={repository}
                path="spec.git_provider.webhook_secret.name"
                data-test="git-provider-webhook-secret-name"
              >
                <ResourceLink
                  kind={SecretModel.kind}
                  name={spec?.git_provider?.webhook_secret?.name}
                  namespace={repository.metadata.namespace}
                />
              </DetailsItem>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default RepositoryDetails;
