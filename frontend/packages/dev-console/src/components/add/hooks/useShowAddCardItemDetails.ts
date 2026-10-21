import type { SetStateAction, Dispatch } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const useShowAddCardItemDetails = (): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [showDetails, setShowDetails, showDetailsLoaded] = useUserPreference(
    'devconsole.addPage.showDetails',
    true,
    true,
  );
  return [showDetailsLoaded && showDetails, setShowDetails];
};
