/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import {Button, Modal} from 'patternfly-react';
import {CatalogItemHeader, PropertiesSidePanel, PropertyItem} from 'patternfly-react-extensions';

import {K8sResourceKind} from '../../module/k8s';
import {MarkdownView} from '../operator-lifecycle-manager/clusterserviceversion';
import {history} from '../utils';
import { OPERATOR_HUB_CSC_NAME } from './index';
import { SubscriptionKind } from '../operator-lifecycle-manager';

export const OperatorHubItemModal: React.SFC<OperatorHubItemModalProps> = (props) => {
  const {item, show, close} = props;

  if (!item) {
    return null;
  }
  const { name, iconClass, imgUrl, provider, longDescription, description, version, certifiedLevel, healthIndex, repository, containerImage, createdAt, support } = item;
  const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;

  return <Modal show={show} backdrop={true} onHide={close} className="co-catalog-page__overlay right-side-modal-pf" bsSize={'lg'}>
    <Modal.Header>
      <Modal.CloseButton onClick={close} />
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
            disabled={!_.isEmpty(props.subscription)}
            onClick={() => history.push(`/operatorhub/subscribe?pkg=${item.name}&catalog=${OPERATOR_HUB_CSC_NAME}&catalogNamespace=${'openshift-operators'}`)}>
            Enable
          </Button>
          <PropertyItem label="Operator Version" value={version || notAvailable} />
          <PropertyItem label="Certified Level" value={certifiedLevel || notAvailable} />
          <PropertyItem label="Provider" value={provider || notAvailable} />
          <PropertyItem label="Health Index" value={healthIndex || notAvailable} />
          <PropertyItem label="Repository" value={repository || notAvailable} />
          <PropertyItem label="Container Image" value={containerImage || notAvailable} />
          <PropertyItem label="Created At" value={createdAt || notAvailable} />
          <PropertyItem label="Support" value={support || notAvailable} />
        </PropertiesSidePanel>
        <div className="co-catalog-page__overlay-description">
          { longDescription
            ? <MarkdownView content={longDescription} />
            : description }
        </div>
      </div>
    </Modal.Body>
  </Modal>;
};

OperatorHubItemModal.defaultProps = {
  item: null,
  size: 'default',
  show: false,
  catalogSourceConfig: null,
};

export type OperatorHubItemModalProps = {
  item: any;
  size?: string;
  show: boolean;
  close: () => void;
  catalogSourceConfig?: K8sResourceKind;
  subscription?: SubscriptionKind;
};

OperatorHubItemModal.displayName = 'OperatorHubItemModal';
