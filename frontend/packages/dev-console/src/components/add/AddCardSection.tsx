import * as React from 'react';
import { AddActionGroup, ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk/src';
import {
  filterNamespaceScopedUrl,
  getAddGroups,
  getSortedExtensionItems,
} from '../../utils/add-page-utils';
import { useAccessFilterExtensions } from '../../hooks/useAccessFilterExtensions';
import { AddGroup } from '../types';
import AddCard from './AddCard';
import { MasonryLayout } from './layout/MasonryLayout';

type AddCardsSectionProps = {
  namespace: string;
  addActionExtensions: ResolvedExtension<AddAction>[];
  addActionGroupExtensions: LoadedExtension<AddActionGroup>[];
};

const COLUMN_WIDTH = 300;

const AddCardsSection: React.FC<AddCardsSectionProps> = ({
  namespace,
  addActionExtensions,
  addActionGroupExtensions,
}) => {
  const filteredAddActionExtensions: ResolvedExtension<AddAction>[] = filterNamespaceScopedUrl(
    namespace,
    useAccessFilterExtensions(namespace, addActionExtensions),
  );

  const sortedActionGroup: LoadedExtension<AddActionGroup>[] = getSortedExtensionItems<
    LoadedExtension<AddActionGroup>
  >(addActionGroupExtensions);

  const addGroups: AddGroup[] = getAddGroups(filteredAddActionExtensions, sortedActionGroup);

  const addCards: React.ReactElement[] = addGroups.map(({ id, name, items }) => (
    <AddCard key={id} title={name} items={items} namespace={namespace} />
  ));

  return <MasonryLayout columnWidth={COLUMN_WIDTH}>{addCards}</MasonryLayout>;
};
export default AddCardsSection;
