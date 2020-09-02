import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { ExternalLink, HintBlock, Timestamp } from '@console/internal/components/utils';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '@console/shared';
import { MarkdownView } from '../clusterserviceversion';
import { OperatorHubItem } from './index';

const CapabilityLevel: React.FC<CapabilityLevelProps> = ({ capabilityLevel }) => {
  const levels = [
    'Basic Install',
    'Seamless Upgrades',
    'Full Lifecycle',
    'Deep Insights',
    'Auto Pilot',
  ];
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
                title="Checked"
              />
            )}
            {level}
          </li>
        );
      })}
    </ul>
  );
};

type CapabilityLevelProps = {
  capabilityLevel: string;
};

export const OperatorHubItemDetails: React.SFC<OperatorHubItemDetailsProps> = ({
  item,
  namespace,
}) => {
  if (!item) {
    return null;
  }
  const {
    installed,
    provider,
    providerType,
    longDescription,
    description,
    version,
    repository,
    containerImage,
    createdAt,
    support,
    capabilityLevel,
    marketplaceSupportWorkflow,
    infraFeatures,
    validSubscription,
  } = item;
  const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;
  const created = Date.parse(createdAt) ? <Timestamp timestamp={createdAt} /> : createdAt;

  const getHintBlock = () => {
    if (installed) {
      return (
        <HintBlock className="co-catalog-page__hint" title="Installed Operator">
          <p>
            This Operator has been installed on the cluster.{' '}
            <Link
              to={`/k8s/${namespace ? `ns/${namespace}` : 'all-namespaces'}/clusterserviceversions`}
            >
              View it here.
            </Link>
          </p>
        </HintBlock>
      );
    }

    if (providerType === 'Community') {
      return (
        <HintBlock className="co-catalog-page__hint" title="Community Operator">
          <p>
            This is a community provided operator. These are operators which have not been vetted or
            verified by Red Hat. Community Operators should be used with caution because their
            stability is unknown. Red Hat provides no support for Community Operators.
          </p>
          {RH_OPERATOR_SUPPORT_POLICY_LINK && (
            <span className="co-modal-ignore-warning__link">
              <ExternalLink
                href={RH_OPERATOR_SUPPORT_POLICY_LINK}
                text="Learn more about Red Hat’s third party software support policy"
              />
            </span>
          )}
        </HintBlock>
      );
    }

    if (providerType === 'Marketplace') {
      return (
        <HintBlock title="Marketplace Operator">
          <p>
            This Operator is purchased through Red Hat Marketplace. After completing the purchase
            process, you can install the Operator on this or other OpenShift clusters. Visit Red Hat
            Marketplace for more details and to track your usage of this application.
          </p>
          <p>
            <ExternalLink
              href="https://marketplace.redhat.com/en-us?utm_source=openshift_console"
              text="Learn more about the Red Hat Marketplace"
            />
          </p>
        </HintBlock>
      );
    }

    return null;
  };

  const mappedData = (data) =>
    Array.isArray(data) ? data.map((d) => <div key={d}>{d}</div>) : notAvailable;

  const mappedInfraFeatures = mappedData(infraFeatures);
  const mappedValidSubscription = mappedData(validSubscription);

  let supportWorkflowUrl = marketplaceSupportWorkflow;
  try {
    const url = new URL(supportWorkflowUrl);
    url.searchParams.set('utm_source', 'openshift_console');
    supportWorkflowUrl = url.toString();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }

  return (
    <div className="modal-body modal-body-border">
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              <PropertyItem label="Operator Version" value={version || notAvailable} />
              <PropertyItem
                label="Capability Level"
                value={
                  capabilityLevel ? (
                    <CapabilityLevel capabilityLevel={capabilityLevel} />
                  ) : (
                    notAvailable
                  )
                }
              />
              <PropertyItem label="Provider Type" value={providerType || notAvailable} />
              <PropertyItem label="Provider" value={provider || notAvailable} />
              {infraFeatures && (
                <PropertyItem label="Infrastructure Features" value={mappedInfraFeatures} />
              )}
              {validSubscription && (
                <PropertyItem label="Valid Subscriptions" value={mappedValidSubscription} />
              )}
              <PropertyItem label="Repository" value={repository || notAvailable} />
              <PropertyItem label="Container Image" value={containerImage || notAvailable} />
              <PropertyItem label="Created At" value={created || notAvailable} />
              <PropertyItem
                label="Support"
                value={
                  supportWorkflowUrl ? (
                    <ExternalLink href={supportWorkflowUrl} text="Get support" />
                  ) : (
                    support || notAvailable
                  )
                }
              />
            </PropertiesSidePanel>
            <div className="co-catalog-page__overlay-description">
              {getHintBlock()}
              {longDescription ? <MarkdownView content={longDescription} /> : description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};

export type OperatorHubItemDetailsProps = {
  namespace?: string;
  item: OperatorHubItem;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
