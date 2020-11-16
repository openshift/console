import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { EmptyBox, LoadingBox } from '@console/internal/components/utils';
import { QuickStart } from '../utils/quick-start-types';
import { getQuickStartStatus } from '../utils/quick-start-utils';
import QuickStartTile from './QuickStartTile';
import { QuickStartContext, QuickStartContextValues } from '../utils/quick-start-context';

import './QuickStartCatalog.scss';

type QuickStartCatalogProps = {
  quickStarts: QuickStart[];
};

const QuickStartCatalog: React.FC<QuickStartCatalogProps> = ({ quickStarts }) => {
  const { t } = useTranslation();
  const { activeQuickStartID, allQuickStartStates, setActiveQuickStart } = React.useContext<
    QuickStartContextValues
  >(QuickStartContext);
  if (!quickStarts) return <LoadingBox />;
  return quickStarts.length === 0 ? (
    <EmptyBox label={t('quickstart~Quick Starts')} />
  ) : (
    <Gallery className="co-quick-start-catalog__gallery" hasGutter>
      {quickStarts.map((quickStart) => {
        const {
          metadata: { name: id },
          spec: { tasks },
        } = quickStart;

        return (
          <GalleryItem key={id}>
            <QuickStartTile
              quickStart={quickStart}
              isActive={id === activeQuickStartID}
              status={getQuickStartStatus(allQuickStartStates, id)}
              onClick={() => setActiveQuickStart(id, tasks?.length)}
            />
          </GalleryItem>
        );
      })}
    </Gallery>
  );
};

export default QuickStartCatalog;
