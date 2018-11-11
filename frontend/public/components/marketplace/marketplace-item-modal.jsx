import * as React from 'react';
import PropTypes from 'prop-types';
import {Button} from 'patternfly-react/dist/esm/components/Button';
import {Modal} from 'patternfly-react/dist/esm/components/Modal';
import {CatalogItemHeader} from 'patternfly-react-extensions/dist/esm/components/CatalogItemHeader';
import {PropertiesSidePanel, PropertyItem} from 'patternfly-react-extensions/dist/esm/components/PropertiesSidePanel';

const MarketplaceItemModal = (props) => {
  const { item, close /* openSubscribe */ } = props;
  const { name, iconClass, imgUrl, provider, description, version, certifiedLevel, healthIndex, repository, containerImage, createdAt, support } = item;
  const notAvailable = <span className="properties-side-panel-pf-property-label">N/A</span>;
  const MarketplaceProperty = ({label, value}) => {
    return <PropertyItem label={label} value={value || notAvailable} />;
  };
  return (
    <Modal show={true} backdrop={true} onHide={close} className="co-catalog-page__overlay right-side-modal-pf" bsSize={'lg'}>
      <Modal.Header>
        <Modal.CloseButton onClick={close} />
        <CatalogItemHeader
          iconClass={iconClass}
          iconImg={imgUrl}
          title={name}
          vendor={<span> {provider}</span>}
        />
      </Modal.Header>
      <Modal.Body>
        <div className="co-catalog-page__overlay-body">
          <PropertiesSidePanel>
            <Button bsStyle="primary" className="co-catalog-page__overlay-create" /* onClick={ openSubscribe }*/ >
                Subscribe
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
            {description}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
MarketplaceItemModal.propTypes = {
  size: PropTypes.string,
};
MarketplaceItemModal.defaultProps = {
  size: 'default',
};
export { MarketplaceItemModal };
