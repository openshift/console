import type { SetStateAction, Dispatch } from 'react';
import { useUserSettings } from '@console/shared';

export const useShowAddCardItemDetails = (): [
  boolean,
  Dispatch<SetStateAction<boolean>>,
] => {
  const [showDetails, setShowDetails, showDetailsLoaded] = useUserSettings(
    'devconsole.addPage.showDetails',
    true,
    true,
  );
  return [showDetailsLoaded && showDetails, setShowDetails];
};
