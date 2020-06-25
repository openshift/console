import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { connect } from 'react-redux';
import { history, PageHeading, useAccessReview } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk';
import { RootState } from '@console/internal/redux';
import { isAddAction, AddAction } from '../extensions/add-actions';
import GuidedTourAddAction from './GuidedTourAddAction';
import './EmptyState.scss';
import { ALL_NAMESPACES_KEY } from '@console/shared';

const navigateTo = (e: React.SyntheticEvent, url: string) => {
  history.push(url);
  e.preventDefault();
};

interface ItemProps {
  action: AddAction;
  namespace: string;
}

const Item: React.FC<ItemProps> = ({
  action: {
    properties: { id, label, description, icon, iconClass, url, accessReview },
  },
  namespace,
}) => {
  const access =
    !accessReview ||
    // Defined extensions are immutable. This check will be consistent.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    accessReview.map((descriptor) => useAccessReview({ namespace, ...descriptor })).every((x) => x);
  if (namespace === ALL_NAMESPACES_KEY && url.match(/:namespace\b/)) {
    // URL expects namespace scope
    return null;
  }
  const resolvedUrl = url.replace(/:namespace\b/g, namespace);
  return access ? (
    <GalleryItem>
      <CatalogTile
        data-test-id={id}
        className="odc-empty-state__tile"
        onClick={(e: React.SyntheticEvent) => navigateTo(e, resolvedUrl)}
        href={resolvedUrl}
        title={label}
        iconImg={typeof icon === 'string' ? icon : undefined}
        iconClass={iconClass}
        icon={React.isValidElement(icon) ? icon : undefined}
        description={description}
      />
    </GalleryItem>
  ) : null;
};

interface StateProps {
  activeNamespace: string;
}

interface EmptySProps {
  title: string;
  hintBlock?: React.ReactNode;
}

type Props = EmptySProps & StateProps;

const ODCEmptyState: React.FC<Props> = ({
  title,
  activeNamespace,
  hintBlock = 'Select a way to create an application, component or service from one of the options.',
}) => {
  const addActionExtensions = useExtensions<AddAction>(
    isAddAction,
  ).filter(({ properties: { hide } }) => (hide ? hide() : true));
  return (
    <>
      <div className="odc-empty-state__title">
        <PageHeading title={title} />
        {hintBlock && (
          <div className="co-catalog-page__description odc-empty-state__hint-block">
            {hintBlock}
          </div>
        )}
      </div>
      <div className="odc-empty-state__content">
        <Gallery className="co-catalog-tile-view" hasGutter>
          <GuidedTourAddAction />
          {addActionExtensions.map((action) => (
            <Item key={action.properties.id} namespace={activeNamespace} action={action} />
          ))}
        </Gallery>
      </div>
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export default connect<StateProps>(mapStateToProps)(ODCEmptyState);
