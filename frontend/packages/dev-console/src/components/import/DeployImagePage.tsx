import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { NamespacedPageVariants } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { PageHeading, Firehose } from '@console/internal/components/utils';
import NamespacedPage from '@console/shared/src/components/projects/NamespacedPage';
import { QUERY_PROPERTIES } from '../../const';
import QueryFocusApplication from '../QueryFocusApplication';
import DeployImage from './DeployImage';

export type DeployImagePageProps = RouteComponentProps<{ ns?: string }>;

const DeployImagePage: React.FunctionComponent<DeployImagePageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const params = new URLSearchParams(location.search);

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Deploy Image')}</title>
      </Helmet>
      <PageHeading title={t('devconsole~Deploy Image')} />
      <QueryFocusApplication>
        {(desiredApplication) => (
          <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
            <DeployImage
              forApplication={desiredApplication}
              namespace={namespace}
              contextualSource={params.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
            />
          </Firehose>
        )}
      </QueryFocusApplication>
    </NamespacedPage>
  );
};

export default DeployImagePage;
