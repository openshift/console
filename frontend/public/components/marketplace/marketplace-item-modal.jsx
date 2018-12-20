import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Button, Modal} from 'patternfly-react';
import {CatalogItemHeader, PropertiesSidePanel, PropertyItem} from 'patternfly-react-extensions';

import {k8sCreate, k8sKill} from '../../module/k8s';
import {CatalogSourceConfigModel} from '../../models/index';
import {MarkdownView} from '../operator-lifecycle-manager/clusterserviceversion';

const MARKETPLACE_CSC_NAME = 'marketplace-enabled-operators';

const getPackages = (catalogsourceconfigs) => {
  const marketplaceCSC = catalogsourceconfigs ? _.filter(catalogsourceconfigs.data, (csc) => {
    const name = _.get(csc, 'metadata.name', false);
    return name === MARKETPLACE_CSC_NAME;
  }) : [];
  if (_.isEmpty(marketplaceCSC)) {
    return '';
  }
  return _.get(marketplaceCSC[0], 'spec.packages');
};

class MarketplaceItemModal extends React.Component {
  constructor(props) {
    super(props);
  }

  enable() {
    const {item, catalogsourceconfigs, close} = this.props;
    const {name} = item;
    const previousPackages = getPackages(catalogsourceconfigs);
    const packages = previousPackages ? `${previousPackages},${name}` : `${name}`;
    const catalogSourceConfig = {
      apiVersion: `${CatalogSourceConfigModel.apiGroup}/${CatalogSourceConfigModel.apiVersion}`,
      kind: `${CatalogSourceConfigModel.kind}`,
      metadata: {
        name: `${MARKETPLACE_CSC_NAME}`,
        namespace: 'openshift-operators',
      },
      spec: {
        targetNamespace: 'openshift-operators',
        packages: `${packages}`,
      },
    };
    if (!previousPackages){
      k8sCreate(CatalogSourceConfigModel, catalogSourceConfig).then(() => close());
      return;
    }
    k8sKill(CatalogSourceConfigModel, catalogSourceConfig).then(() => k8sCreate(CatalogSourceConfigModel, catalogSourceConfig)).then(() => close()); // TODO: link to OLM subscription page
  }

  render() {
    const {item, show, close} = this.props;

    if (!item) {
      return null;
    }
    const { name, iconClass, imgUrl, provider, longDescription, description, version, certifiedLevel, healthIndex, repository, containerImage, createdAt, support, enabled } = item;
    const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;
    const MarketplaceProperty = ({label, value}) => {
      return <PropertyItem label={label} value={value || notAvailable} />;
    };

    return (
      <Modal show={show} backdrop={true} onHide={close} className="co-catalog-page__overlay right-side-modal-pf" bsSize={'lg'}>
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
              <Button bsStyle="primary" className="co-catalog-page__overlay-create" disabled={enabled} onClick={() => this.enable()} >
                  Enable
              </Button>
              <MarketplaceProperty label="Operator Version" value={version} />
              <MarketplaceProperty label="Certified Level" value={certifiedLevel} />
              <MarketplaceProperty label="Provider" value={provider} />
              <MarketplaceProperty label="Health Index" value={healthIndex} />
              <MarketplaceProperty label="Repository" value={repository} />
              <MarketplaceProperty label="Container Image" value={containerImage} />
              <MarketplaceProperty label="Created At" value={createdAt} />
              <MarketplaceProperty label="Support" value={support} />
            </PropertiesSidePanel>
            <div className="co-catalog-page__overlay-description">
              {longDescription ? (
                <MarkdownView content={longDescription} />
              ) : (
                description
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

MarketplaceItemModal.displayName = 'MarketplaceModal';

MarketplaceItemModal.propTypes = {
  item: PropTypes.object,
  size: PropTypes.string,
  show: PropTypes.bool,
  catalogsourceconfig: PropTypes.object,
};

MarketplaceItemModal.defaultProps = {
  item: null,
  size: 'default',
  show: false,
  catalogsourceconfigs: null,
};

export { MarketplaceItemModal };
