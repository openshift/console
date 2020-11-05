import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { history, useAccessReview } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk';
import { RootState } from '@console/internal/redux';
import { ALL_NAMESPACES_KEY, PageLayout } from '@console/shared';
import { HIDE_QUICK_START_ADD_TILE_STORAGE_KEY } from '@console/shared/src/components/quick-starts/quick-starts-catalog-card-constants';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import QuickStartsCatalogCard from '@console/shared/src/components/quick-starts/QuickStartsCatalogCard';
import { isAddAction, AddAction } from '../extensions/add-actions';

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
        className="co-catalog-tile"
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

const ODCEmptyState: React.FC<Props> = ({ title, activeNamespace, hintBlock }) => {
  const { t } = useTranslation();
  const defaultHintBlockText = t(
    'devconsole~Select a way to create an application, component or service from one of the options.',
  );
  const addActionExtensions = useExtensions<AddAction>(
    isAddAction,
  ).filter(({ properties: { hide } }) => (hide ? hide() : true));

  return (
    <PageLayout title={title} hint={hintBlock || defaultHintBlockText} isDark>
      <Gallery className="co-catalog-tile-view" hasGutter>
        <QuickStartsLoader>
          {(quickStarts) => (
            <QuickStartsCatalogCard
              quickStarts={quickStarts}
              storageKey={HIDE_QUICK_START_ADD_TILE_STORAGE_KEY}
            />
          )}
        </QuickStartsLoader>
        {addActionExtensions.map((action) => (
          <Item key={action.properties.id} namespace={activeNamespace} action={action} />
        ))}
      </Gallery>
    </PageLayout>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activeNamespace: state.UI.get('activeNamespace'),
  };
};

export default connect<StateProps>(mapStateToProps)(ODCEmptyState);
