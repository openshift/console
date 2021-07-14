import * as React from 'react';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExternalLink, HintBlock, Timestamp } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import { DefaultCatalogSource } from '../../const';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, SubscriptionKind } from '../../types';
import { MarkdownView } from '../clusterserviceversion';
import { OperatorHubItem } from './index';

// t('olm~Basic Install'),
// t('olm~Seamless Upgrades'),
// t('olm~Full Lifecycle'),
// t('olm~Deep Insights'),
// t('olm~Auto Pilot'),
const levels = [
  'Basic Install',
  'Seamless Upgrades',
  'Full Lifecycle',
  'Deep Insights',
  'Auto Pilot',
];

const CapabilityLevel: React.FC<CapabilityLevelProps> = ({ capabilityLevel }) => {
  const { t } = useTranslation();
  const capabilityLevelIndex = _.indexOf(levels, capabilityLevel);

  return (
    <ul className="properties-side-panel-pf-property-value__capability-levels">
      {levels.map((level, i) => {
        const active = capabilityLevelIndex >= i;
        return (
          <li
            className={classNames('properties-side-panel-pf-property-value__capability-level', {
              'properties-side-panel-pf-property-value__capability-level--active': active,
            })}
            key={level}
          >
            {active && (
              <CheckCircleIcon
                color="var(--pf-global--primary-color--100)"
                className="properties-side-panel-pf-property-value__capability-level-icon"
                title={t('olm~Checked')}
              />
            )}
            {t(`olm~${level}`)}
          </li>
        );
      })}
    </ul>
  );
};

type CapabilityLevelProps = {
  capabilityLevel: string;
};

const InstalledHintBlock: React.FC<OperatorHubItemDetailsHintBlockProps> = ({
  latestVersion,
  namespace,
  subscription,
}) => {
  const { t } = useTranslation();
  const [installedCSV] = useK8sWatchResource<ClusterServiceVersionKind>({
    kind: referenceForModel(ClusterServiceVersionModel),
    name: subscription?.status?.installedCSV,
    namespace: subscription?.metadata?.namespace,
    isList: false,
    namespaced: true,
  });
  const nsPath = `/k8s/${namespace ? `ns/${namespace}` : 'all-namespaces'}`;
  const to = installedCSV
    ? `${nsPath}/clusterserviceversions/${installedCSV?.metadata?.name ?? ''}`
    : `${nsPath}/subscriptions/${subscription.metadata.name ?? ''}`;
  const installedVersion = installedCSV?.spec?.version;
  return (
    <HintBlock className="co-catalog-page__hint" title={t('olm~Installed Operator')}>
      <p>
        {installedVersion !== latestVersion ? (
          <span>
            <Trans ns="olm">
              Version <strong>{{ installedVersion }}</strong> of this Operator has been installed on
              the cluster.
            </Trans>
          </span>
        ) : (
          t('olm~This Operator has been installed on the cluster.')
        )}
        &nbsp;
        <Link to={to}>{t('olm~View it here.')}</Link>
      </p>
    </HintBlock>
  );
};

const InstallingHintBlock: React.FC<OperatorHubItemDetailsHintBlockProps> = ({
  namespace,
  subscription,
}) => {
  const { t } = useTranslation();
  const [installedCSV] = useK8sWatchResource<ClusterServiceVersionKind>(
    subscription?.status?.installedCSV
      ? {
          kind: referenceForModel(ClusterServiceVersionModel),
          name: subscription?.status?.installedCSV,
          namespace: subscription?.metadata?.namespace,
          isList: false,
          namespaced: true,
        }
      : null,
  );
  const nsPath = `/k8s/${namespace ? `ns/${namespace}` : 'all-namespaces'}`;
  const to = installedCSV
    ? `${nsPath}/clusterserviceversions/${installedCSV?.metadata?.name}/subscription`
    : `${nsPath}/subscriptions/${subscription.metadata.name ?? ''}`;
  return (
    <HintBlock className="co-catalog-page__hint" title={t('olm~Installing Operator')}>
      <p>
        <span>
          <Trans ns="olm">This Operator is being installed on the cluster.</Trans>
        </span>
        &nbsp;
        <Link to={to}>{t('olm~View it here.')}</Link>
      </p>
    </HintBlock>
  );
};

const OperatorHubItemDetailsHintBlock: React.FC<OperatorHubItemDetailsHintBlockProps> = (props) => {
  const { t } = useTranslation();
  const { installed, isInstalling, catalogSource } = props;
  if (isInstalling) {
    return <InstallingHintBlock {...props} />;
  }

  if (installed) {
    return <InstalledHintBlock {...props} />;
  }

  if (catalogSource === DefaultCatalogSource.CommunityOperators) {
    return (
      <HintBlock className="co-catalog-page__hint" title={t('olm~Community Operator')}>
        <p>
          {t(
            'olm~This is a community provided Operator. These are Operators which have not been vetted or verified by Red Hat. Community Operators should be used with caution because their stability is unknown. Red Hat provides no support for community Operators.',
          )}
        </p>
        {RH_OPERATOR_SUPPORT_POLICY_LINK && (
          <span className="co-modal-ignore-warning__link">
            <ExternalLink
              href={RH_OPERATOR_SUPPORT_POLICY_LINK}
              text={t('olm~Learn more about Red Hat’s third party software support policy')}
            />
          </span>
        )}
      </HintBlock>
    );
  }

  if (catalogSource === DefaultCatalogSource.RedHatMarketPlace) {
    return (
      <HintBlock title={t('olm~Marketplace Operator')}>
        <p>
          {t(
            'olm~This Operator is purchased through Red Hat Marketplace. After completing the purchase process, you can install the Operator on this or other OpenShift clusters. Visit Red Hat Marketplace for more details and to track your usage of this application.',
          )}
        </p>
        <p>
          <ExternalLink
            href="https://marketplace.redhat.com/en-us?utm_source=openshift_console"
            text={t('olm~Learn more about the Red Hat Marketplace')}
          />
        </p>
      </HintBlock>
    );
  }

  return null;
};

export const OperatorHubItemDetails: React.FC<OperatorHubItemDetailsProps> = ({
  item,
  namespace,
}) => {
  const { t } = useTranslation();
  const {
    capabilityLevel,
    catalogSource,
    catalogSourceDisplayName,
    containerImage,
    createdAt,
    description,
    infraFeatures,
    installed,
    isInstalling,
    longDescription,
    marketplaceSupportWorkflow,
    provider,
    repository,
    subscription,
    support,
    validSubscription,
    version,
  } = item;
  const notAvailable = (
    <span className="properties-side-panel-pf-property-label">{t('olm~N/A')}</span>
  );
  const created = Date.parse(createdAt) ? <Timestamp timestamp={createdAt} /> : createdAt;

  const mappedData = (data) => data?.map?.((d) => <div key={d}>{d}</div>) ?? notAvailable;

  const mappedInfraFeatures = mappedData(infraFeatures);
  const mappedValidSubscription = mappedData(validSubscription);

  const supportWorkflowUrl = React.useMemo(() => {
    if (marketplaceSupportWorkflow) {
      try {
        const url = new URL(marketplaceSupportWorkflow);
        url.searchParams.set('utm_source', 'openshift_console');
        return url.toString();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      }
    }
    return null;
  }, [marketplaceSupportWorkflow]);

  return item ? (
    <div className="modal-body modal-body-border">
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              <PropertyItem label={t('olm~Latest version')} value={version || notAvailable} />
              <PropertyItem
                label={t('olm~Capability level')}
                value={
                  capabilityLevel ? (
                    <CapabilityLevel capabilityLevel={capabilityLevel} />
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem
                label={t('olm~Source')}
                value={catalogSourceDisplayName || notAvailable}
              />
              <PropertyItem label={t('olm~Provider')} value={provider || notAvailable} />
              {!_.isEmpty(infraFeatures) && (
                <PropertyItem
                  label={t('olm~Infrastructure features')}
                  value={mappedInfraFeatures}
                />
              )}
              {validSubscription && (
                <PropertyItem
                  label={t('olm~Valid Subscriptions')}
                  value={mappedValidSubscription}
                />
              )}
              <PropertyItem
                label={t('olm~Repository')}
                value={
                  repository ? <ExternalLink href={repository} text={repository} /> : notAvailable
                }
              />
              <PropertyItem
                label={t('olm~Container image')}
                value={
                  containerImage ? (
                    <div className="co-break-all co-select-to-copy">{containerImage}</div>
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem label={t('olm~Created at')} value={created || notAvailable} />
              <PropertyItem
                label={t('olm~Support')}
                value={
                  supportWorkflowUrl ? (
                    <ExternalLink href={supportWorkflowUrl} text={t('olm~Get support')} />
                  ) : (
                    support || notAvailable
                  )
                }
              />
            </PropertiesSidePanel>
            <div className="co-catalog-page__overlay-description">
              <OperatorHubItemDetailsHintBlock
                installed={installed}
                isInstalling={isInstalling}
                latestVersion={version}
                namespace={namespace}
                catalogSource={catalogSource}
                subscription={subscription}
              />
              {longDescription ? <MarkdownView content={longDescription} /> : description}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};
type OperatorHubItemDetailsHintBlockProps = {
  installed: boolean;
  isInstalling: boolean;
  latestVersion: string;
  namespace: string;
  catalogSource: string;
  subscription: SubscriptionKind;
};

export type OperatorHubItemDetailsProps = {
  namespace?: string;
  item: OperatorHubItem;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
