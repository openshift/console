/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Button, HintBlock, Modal } from 'patternfly-react';
import { CatalogItemHeader, PropertiesSidePanel, PropertyItem } from 'patternfly-react-extensions';

import { MarkdownView } from '../operator-lifecycle-manager/clusterserviceversion';
import { history, ExternalLink } from '../utils';
import { RH_OPERATOR_SUPPORT_POLICY_LINK } from '../../const';
import { Link } from 'react-router-dom';

export const OperatorHubItemDetails: React.SFC<OperatorHubItemDetailsProps> = ({item, closeOverlay, namespace}) => {
  if (!item) {
    return null;
  }
  const {
    name,
    installed,
    iconClass,
    imgUrl,
    provider,
    providerType,
    longDescription,
    description,
    version,
    repository,
    containerImage,
    createdAt,
    support,
    catalogSource,
    catalogSourceNamespace,
  } = item;
  const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;

  const getHintBlock = () => {
    if (installed) {
      const filterName = _.get(item.obj, 'status.channels[0].currentCSV', item.obj.metadata.name);
      return (
        <HintBlock
          title="Installed Operator"
          body={
            <span>
              This Operator has been installed on the cluster.{' '}
              <Link to={`/k8s/${namespace ?
                `ns/${namespace}` :
                'all-namespaces'}/clusterserviceversions?rowFilter-clusterserviceversion-status=Copied%2CInstallSucceeded&name=${filterName}`}>
                View it here.
              </Link>
            </span>
          }
        />
      );
    }

    if (providerType === 'Community') {
      return (
        <HintBlock
          title="Community Operator"
          body={
            <span>
              This is a community provided operator. These are operators which have not been vetted or verified by Red Hat.
              Community Operators should be used with caution because their stability is unknown.
              Red Hat provides no support for Community Operators.
              {RH_OPERATOR_SUPPORT_POLICY_LINK && (
                <span className="co-modal-ignore-warning__link">
                  <ExternalLink href={RH_OPERATOR_SUPPORT_POLICY_LINK} text="Learn more about Red Hat’s third party software support policy" />
                </span>
              )}
            </span>
          }
        />
      );
    }

    return null;
  };

  const createLink = `/operatorhub/subscribe?pkg=${item.obj.metadata.name}&catalog=${catalogSource}&catalogNamespace=${catalogSourceNamespace}&targetNamespace=${namespace}`;

  return <React.Fragment>
    <Modal.Header>
      <Modal.CloseButton onClick={closeOverlay} />
      <CatalogItemHeader
        iconClass={iconClass}
        iconImg={imgUrl}
        title={name}
        vendor={`${version} provided by ${provider}`}
      />
    </Modal.Header>
    <Modal.Body>
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              <Button
                bsStyle="primary"
                className="co-catalog-page__overlay-create"
                disabled={installed}
                title={installed ? 'This Operator has been installed on the cluster.' : null}
                onClick={() => !installed ? history.push(createLink) : null}>
                Install
              </Button>
              <PropertyItem label="Operator Version" value={version || notAvailable} />
              <PropertyItem label="Provider Type" value={providerType || notAvailable} />
              <PropertyItem label="Provider" value={provider || notAvailable} />
              <PropertyItem label="Repository" value={repository || notAvailable} />
              <PropertyItem label="Container Image" value={containerImage || notAvailable} />
              <PropertyItem label="Created At" value={createdAt || notAvailable} />
              <PropertyItem label="Support" value={support || notAvailable} />
            </PropertiesSidePanel>
            <div className="co-catalog-page__overlay-description">
              {getHintBlock()}
              {longDescription
                ? <MarkdownView content={longDescription} outerScroll={true} />
                : description}
            </div>
          </div>
        </div>
      </div>
    </Modal.Body>
  </React.Fragment>;
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};

export type OperatorHubItemDetailsProps = {
  namespace?: string;
  item: any;
  closeOverlay: () => void;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
