import type { FC, ReactElement } from 'react';
import { useMemo } from 'react';
import type { AddActionGroup, ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared/';
import { getAddGroups } from '../../utils/add-page-utils';
import type { AddGroup } from '../types';
import AddCard from './AddCard';
import AddCardSectionEmptyState from './AddCardSectionEmptyState';
import AddCardSectionSkeleton from './AddCardSectionSkeleton';
import { MasonryLayout } from './layout/MasonryLayout';

type AddCardSectionProps = {
  namespace: string;
  addActionExtensions: ResolvedExtension<AddAction>[];
  addActionGroupExtensions: LoadedExtension<AddActionGroup>[];
  extensionsLoaded?: boolean;
  loadingFailed?: boolean;
  accessCheckFailed?: boolean;
};

const COLUMN_WIDTH = 300;

const AddCardSection: FC<AddCardSectionProps> = ({
  namespace,
  addActionExtensions,
  addActionGroupExtensions,
  extensionsLoaded,
  loadingFailed,
  accessCheckFailed,
}) => {
  const addCards = useMemo((): ReactElement[] => {
    if (!extensionsLoaded) {
      return [];
    }
    const sortedActionGroup = orderExtensionBasedOnInsertBeforeAndAfter<
      AddActionGroup['properties']
    >(addActionGroupExtensions.map(({ properties }) => properties));

    const addGroups: AddGroup[] = getAddGroups(addActionExtensions, sortedActionGroup);

    return addGroups.map(({ id, name, items, icon }) => (
      <AddCard key={id} id={id} title={name} items={items} namespace={namespace} icon={icon} />
    ));
  }, [extensionsLoaded, addActionExtensions, addActionGroupExtensions, namespace]);

  if (loadingFailed || accessCheckFailed) {
    return <AddCardSectionEmptyState accessCheckFailed={!loadingFailed && accessCheckFailed} />;
  }

  return (
    <div data-test="add-cards">
      <MasonryLayout
        columnWidth={COLUMN_WIDTH}
        loading={!extensionsLoaded}
        LoadingComponent={AddCardSectionSkeleton}
      >
        {addCards}
      </MasonryLayout>
    </div>
  );
};
export default AddCardSection;
