import * as React from 'react';
import { AddActionGroup, ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk/src';
import { getAddGroups, getSortedExtensionItems } from '../../utils/add-page-utils';
import { AddGroup } from '../types';
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

const AddCardSection: React.FC<AddCardSectionProps> = ({
  namespace,
  addActionExtensions,
  addActionGroupExtensions,
  extensionsLoaded,
  loadingFailed,
  accessCheckFailed,
}) => {
  if (loadingFailed || accessCheckFailed) {
    return <AddCardSectionEmptyState accessCheckFailed={!loadingFailed && accessCheckFailed} />;
  }
  const getAddCards = (): React.ReactElement[] => {
    if (!extensionsLoaded) {
      return [];
    }
    const sortedActionGroup: LoadedExtension<AddActionGroup>[] = getSortedExtensionItems<
      LoadedExtension<AddActionGroup>
    >(addActionGroupExtensions);

    const addGroups: AddGroup[] = getAddGroups(addActionExtensions, sortedActionGroup);

    return addGroups.map(({ id, name, items }) => (
      <AddCard key={id} id={id} title={name} items={items} namespace={namespace} />
    ));
  };

  return (
    <div data-test="add-cards">
      <MasonryLayout
        columnWidth={COLUMN_WIDTH}
        loading={!extensionsLoaded}
        LoadingComponent={AddCardSectionSkeleton}
      >
        {getAddCards()}
      </MasonryLayout>
    </div>
  );
};
export default AddCardSection;
