import type { FunctionComponent } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { Firehose } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { QUERY_PROPERTIES } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import QueryFocusApplication from '../QueryFocusApplication';
import DeployImage from './DeployImage';

const DeployImagePage: FunctionComponent = () => {
  const { t } = useTranslation();
  const { ns: namespace } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <DocumentTitle>{t('devconsole~Deploy Image')}</DocumentTitle>
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
