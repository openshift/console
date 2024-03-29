import * as React from 'react';
import {
  Button,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Text,
  TextVariants,
  Tooltip,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useHideLightspeed } from '@console/app/src/components/user-preferences/lightspeed';
import './Lightspeed.scss';

const Lightspeed: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [hideLightspeed] = useHideLightspeed();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement>();

  const onExpand = () => {
    drawerRef.current && drawerRef.current.focus();
  };

  const onClick = () => {
    setIsExpanded(!isExpanded);
  };

  const onCloseClick = () => {
    setIsExpanded(false);
  };

  const onResize = (
    _event: MouseEvent | TouchEvent | React.KeyboardEvent,
    newWidth: number,
    id: string,
  ) => {
    // eslint-disable-next-line no-console
    console.log(`${id} has new width of: ${newWidth}`);
  };

  if (hideLightspeed) {
    return <>{children}</>;
  }

  const title = t('console-app~Red Hat OpenShift Lightspeed');

  const panelContent = (
    <DrawerPanelContent isResizable onResize={onResize} defaultSize={'500px'} minSize={'200px'}>
      <DrawerHead>
        <Text
          component={TextVariants.h2}
          tabIndex={isExpanded ? 0 : -1}
          ref={drawerRef}
          className="lightspeed__drawer-title"
        >
          {title}
        </Text>
        <DrawerActions>
          <DrawerCloseButton onClick={onCloseClick} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>EXTENSION POINT HERE</DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <div className="lightspeed">
      <Drawer isExpanded={isExpanded} onExpand={onExpand} isInline>
        <DrawerContent panelContent={panelContent}>
          <DrawerContentBody>{children}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
      {!isExpanded && (
        <Tooltip content={title}>
          <Button variant="link" className="lightspeed__open-button" onClick={onClick} />
        </Tooltip>
      )}

      {/* <div aria-label={t('Red Hat OpenShift Lightspeed')} className="ols-plugin__popover-container"> */}
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
      {/* <Tooltip content={t('Red Hat OpenShift Lightspeed')}>
          <Button variant="link" className="ols-plugin__popover-button" onClick={onClick} />
        </Tooltip> */}
      {/* )} */}
      {/* </div> */}
    </div>
  );
};
export default Lightspeed;
