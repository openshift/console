import * as React from 'react';
import { Button, Alert } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { Link } from 'react-router-dom';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { withStartGuide } from '../../../../../public/components/start-guide';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '../../../../../public/models';
import {
  AppliedClusterResourceQuotaKind,
  ResourceQuotaKind,
} from '../../../../../public/module/k8s';
import { checkQuotaLimit } from '../../../../topology/src/components/utils/checkResourceQuota';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import AddPageLayout from './AddPageLayout';

export interface AddPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

// Exported for testing
export const PageContents: React.FC<AddPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;

  const [warningMessageFlag, setWarningMessageFlag] = React.useState<boolean>();
  const [resourceQuotaName, setResourceQuotaName] = React.useState<string>('');
  const [resourceQuotaKind, setResourceQuotaKind] = React.useState<string>('');

  const [quotas, rqLoaded] = useK8sWatchResource<ResourceQuotaKind[]>({
    groupVersionKind: {
      kind: ResourceQuotaModel.kind,
      version: ResourceQuotaModel.apiVersion,
    },
    namespace,
    isList: true,
  });

  const [clusterQuotas, acrqLoaded] = useK8sWatchResource<AppliedClusterResourceQuotaKind[]>({
    groupVersionKind: {
      kind: AppliedClusterResourceQuotaModel.kind,
      version: AppliedClusterResourceQuotaModel.apiVersion,
      group: AppliedClusterResourceQuotaModel.apiGroup,
    },
    namespace,
    isList: true,
  });

  const [totalRQatQuota, quotaName, quotaKind] = checkQuotaLimit(quotas);
  const [totalACRQatQuota, clusterRQName, clusterRQKind] = checkQuotaLimit(clusterQuotas);

  let totalResourcesAtQuota = [...totalRQatQuota, ...totalACRQatQuota];
  totalResourcesAtQuota = totalResourcesAtQuota.filter((resourceAtQuota) => resourceAtQuota !== 0);

  React.useEffect(() => {
    if (totalResourcesAtQuota.length === 1) {
      setResourceQuotaName(quotaName || clusterRQName);
      setResourceQuotaKind(quotaKind || clusterRQKind);
    } else {
      setResourceQuotaName('');
      setResourceQuotaKind('');
    }
    if (totalResourcesAtQuota.length > 0) {
      setWarningMessageFlag(true);
    } else {
      setWarningMessageFlag(false);
    }
  }, [clusterRQKind, clusterRQName, totalResourcesAtQuota, quotaKind, quotaName]);

  const getRedirectLink = () => {
    if (resourceQuotaName && resourceQuotaKind === AppliedClusterResourceQuotaModel.kind) {
      return `/k8s/ns/${namespace}/${AppliedClusterResourceQuotaModel.apiGroup}~${AppliedClusterResourceQuotaModel.apiVersion}~${AppliedClusterResourceQuotaModel.kind}/${resourceQuotaName}`;
    }
    if (resourceQuotaName) {
      return `/k8s/ns/${namespace}/${ResourceQuotaModel.plural}/${resourceQuotaName}`;
    }
    return `/k8s/ns/${namespace}/${ResourceQuotaModel.plural}`;
  };

  return namespace ? (
    <>
      {warningMessageFlag && rqLoaded && acrqLoaded ? (
        <Alert variant="warning" title={t('devconsole~Resource quota reached')} isInline>
          <Link to={getRedirectLink()}>
            {t('devconsole~{{count}} resource reached quota', {
              count: totalResourcesAtQuota.reduce((a, b) => a + b, 0),
            })}
          </Link>
        </Alert>
      ) : null}
      <AddPageLayout title={t('devconsole~Add')} />
    </>
  ) : (
    <CreateProjectListPage title={t('devconsole~Add')}>
      {(openProjectModal) => (
        <Trans t={t} ns="devconsole">
          Select a Project to start adding to it or{' '}
          <Button isInline variant="link" onClick={openProjectModal}>
            create a Project
          </Button>
          .
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

const AddPage: React.FC<AddPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const nsVariant = namespace ? null : NamespacedPageVariants.light;

  return (
    <>
      <Helmet>
        <title data-test-id="page-title">{`+${t('devconsole~Add')}`}</title>
      </Helmet>
      <NamespacedPage variant={nsVariant} hideApplications>
        <PageContentsWithStartGuide match={match} />
      </NamespacedPage>
    </>
  );
};

export default AddPage;
