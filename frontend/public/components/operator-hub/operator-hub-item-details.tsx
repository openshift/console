/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Button, HintBlock, Icon, Modal } from 'patternfly-react';
import { CatalogItemHeader, PropertiesSidePanel, PropertyItem } from 'patternfly-react-extensions';

import { MarkdownView } from '../operator-lifecycle-manager/clusterserviceversion';
import { history } from '../utils';
import { OPERATOR_HUB_CSC_NAME, RH_OPERATOR_SUPPORT_POLICY_LINK } from '../../const';

export const OperatorHubItemDetails: React.SFC<OperatorHubItemDetailsProps> = ({item, closeOverlay}) => {
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
  } = item;
  const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;

  const getHintBlock = () => {
    if (installed) {
      return (
        <HintBlock
          title="Installed Operator"
          body={
            <span>
              This Operator has been installed on the cluster.
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
                  <a href={RH_OPERATOR_SUPPORT_POLICY_LINK}>Learn more about Red Hat’s third party software support policy<Icon type="fa" name="external-link" /></a>
                </span>
              )}
            </span>
          }
        />
      );
    }

    return null;
  };

  const onActionClick = () => {
    if (!installed) {
      history.push(`/operatorhub/subscribe?pkg=${item.name}&catalog=${OPERATOR_HUB_CSC_NAME}&catalogNamespace=${'openshift-operators'}`);
      return;
    }

    // TODO: Allow for Manage button to navigate to the CSV details for the item
  };

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
      <div className="co-catalog-page__overlay-body">
        <PropertiesSidePanel>
          <Button
            bsStyle="primary"
            className="co-catalog-page__overlay-create"
            disabled={installed}
            title={installed ? 'This Operator has been installed on the cluster.' : null}
            onClick={onActionClick}>
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
    </Modal.Body>
  </React.Fragment>;
};

OperatorHubItemDetails.defaultProps = {
  item: null,
};

export type OperatorHubItemDetailsProps = {
  item: any;
  closeOverlay: () => void;
};

OperatorHubItemDetails.displayName = 'OperatorHubItemDetails';
