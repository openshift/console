import * as React from 'react';
import { IDEntity } from '../types';

export const useIDEntities = <T extends IDEntity = IDEntity>(
  initialEntities: T[] = [],
): useIDEntitiesValues<T> => {
  const [entities, setEntities] = React.useState<T[]>(initialEntities);
  const [initialEntitiesChanged, setInitialEntitiesChanged] = React.useState<boolean>(false);

  const onEntityAdd = React.useCallback(
    (newEntity: T) => {
      setInitialEntitiesChanged(true);
      const id = entities[entities.length - 1]?.id + 1 || 0;
      setEntities([...entities, { ...newEntity, id }]);
    },
    [entities],
  );

  const onEntityChange = React.useCallback(
    (updatedEntity: T) => {
      setInitialEntitiesChanged(true);
      setEntities(
        entities.map((entity) => {
          if (entity.id === updatedEntity.id) {
            return updatedEntity;
          }
          return entity;
        }),
      );
    },
    [entities],
  );

  const onEntityDelete = React.useCallback(
    (idToDelete: number) => {
      setInitialEntitiesChanged(true);
      setEntities(entities.filter(({ id }) => id !== idToDelete));
    },
    [entities],
  );

  return [
    entities,
    setEntities,
    onEntityAdd,
    onEntityChange,
    onEntityDelete,
    initialEntitiesChanged,
  ];
};

type useIDEntitiesValues<T> = [
  T[], // Entities
  React.Dispatch<React.SetStateAction<T[]>>, // setEntities()
  (newEntity: T) => void, // addEntity()
  (updatedEntity: T) => void, // changeEntity()
  (idToDelete: number) => void, // deleteEntity()
  boolean, // initialEntitiesChanged
];
