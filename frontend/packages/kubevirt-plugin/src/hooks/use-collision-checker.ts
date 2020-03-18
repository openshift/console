/* eslint-disable react-hooks/exhaustive-deps */
import * as React from 'react';

export const useCollisionChecker = <T>(
  entity: T,
  isEqual: (outdatedEntity: T, newEntity: T) => boolean,
): useCollisionCheckerValues => {
  const [initialEntity, setInitialEntity] = React.useState<T>(entity);
  const [showCollisionAlert, setCollisionAlert] = React.useState<boolean>(false);

  const onReload = React.useCallback(() => {
    setInitialEntity(entity);
    setCollisionAlert(false);
  }, [entity]);

  React.useEffect(() => {
    if (!isEqual(initialEntity, entity)) {
      setCollisionAlert(true);
    }
  }, [initialEntity, entity]);

  return [showCollisionAlert, onReload];
};

type useCollisionCheckerValues = [
  boolean, // showCollisionAlert
  () => void, // onReload
];
