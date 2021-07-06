import * as React from 'react';
import {
  DrawerPanelContent,
  DrawerPanelBody,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  Title,
} from '@patternfly/react-core';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '@console/internal/components/utils';
import { useScrollShadows, Shadows } from '@console/shared';
import { QuickStart } from './utils/quick-start-types';
import './QuickStartPanelContent.scss';

type HandleClose = () => void;

type QuickStartPanelContentProps = {
  quickStarts: QuickStart[];
  activeQuickStartID: string;
  handleClose: HandleClose;
};

const QuickStartPanelContent: React.FC<QuickStartPanelContentProps> = ({
  quickStarts = [],
  handleClose,
  activeQuickStartID,
}) => {
  const { t } = useTranslation();
  const [contentRef, setContentRef] = React.useState<HTMLDivElement>();
  const shadows = useScrollShadows(contentRef);

  const quickStart = quickStarts.find((qs) => qs.metadata.name === activeQuickStartID);
  const nextQuickStarts: QuickStart[] = quickStarts.filter((qs: QuickStart) =>
    quickStart?.spec.nextQuickStart?.includes(qs.metadata.name),
  );

  const headerClasses = classNames({
    'pf-u-box-shadow-sm-bottom': shadows === Shadows.top || shadows === Shadows.both,
  });

  const footerClass = classNames({
    'pf-u-box-shadow-sm-top': shadows === Shadows.bottom || shadows === Shadows.both,
  });

  return quickStart ? (
    <DrawerPanelContent isResizable data-test="quickstart drawer">
      <div className={`co-quick-start-panel-content-head ${headerClasses}`}>
        <DrawerHead>
          <div className="co-quick-start-panel-content__title">
            <Title
              headingLevel="h1"
              size="xl"
              style={{ marginRight: 'var(--pf-global--spacer--md)' }}
            >
              {quickStart?.spec.displayName}{' '}
              <small className="co-quick-start-panel-content__duration text-secondary">
                {t('console-app~{{duration, number}} minutes', {
                  duration: quickStart?.spec.durationMinutes,
                })}
              </small>
            </Title>
          </div>
          <DrawerActions>
            <DrawerCloseButton onClick={handleClose} />
          </DrawerActions>
        </DrawerHead>
      </div>
      <DrawerPanelBody
        hasNoPadding
        className="co-quick-start-panel-content__body"
        data-test="content"
      >
        <AsyncComponent
          loader={() => import('./QuickStartController').then((c) => c.default)}
          quickStart={quickStart}
          nextQuickStarts={nextQuickStarts}
          footerClass={footerClass}
          contentRef={setContentRef}
        />
      </DrawerPanelBody>
    </DrawerPanelContent>
  ) : null;
};

export default QuickStartPanelContent;
