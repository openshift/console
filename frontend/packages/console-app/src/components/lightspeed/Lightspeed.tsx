import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useHideLightspeed } from '@console/app/src/components/user-preferences/lightspeed';
import './Lightspeed.scss';

const Lightspeed: React.FC = () => {
  const { t } = useTranslation();
  const [hideLightspeed] = useHideLightspeed();

  if (hideLightspeed) {
    return null;
  }

  return (
    <div aria-label={t('Red Hat OpenShift Lightspeed')} className="ols-plugin__popover-container">
      {/* {isOpen ? (
        <>
          <div
            className={`ols-plugin__popover ols-plugin__popover--${
              isExpanded ? 'expanded' : 'collapsed'
            }`}
          >
            {isExpanded ? (
              <GeneralPage onClose={close} onCollapse={collapse} />
            ) : (
              <GeneralPage onClose={close} onExpand={expand} />
            )}
          </div>
          <div className="ols-plugin__popover-button" onClick={close} />
        </>
      ) : ( */}
      <Tooltip content={t('Red Hat OpenShift Lightspeed')}>
        <Button
          variant="link"
          className="ols-plugin__popover-button"
          // onClick={() => console.log('Lightspeed button clicked')}
        />
      </Tooltip>
      {/* )} */}
    </div>
  );
};
export default Lightspeed;
