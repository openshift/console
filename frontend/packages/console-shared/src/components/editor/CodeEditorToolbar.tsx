import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { MagicIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { action } from 'typesafe-actions';
import { CodeEditorToolbarProps } from '@console/dynamic-plugin-sdk';
import { ActionType } from '@console/internal/reducers/ols';
import { useOLSConfig } from '../../hooks/ols-hook';

export const AskOpenShiftLightspeedButton: React.FC = () => {
  const { t } = useTranslation('console-shared');
  const openOLS = () => action(ActionType.OpenOLS);
  const showLightspeedButton = useOLSConfig();
  const dispatch = useDispatch();

  return showLightspeedButton ? (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        dispatch(openOLS());
      }}
      icon={<MagicIcon />}
    >
      {t('console-shared~Ask OpenShift Lightspeed')}
    </Button>
  ) : null;
};

export const CodeEditorToolbar: React.FC<CodeEditorToolbarProps> = ({
  showShortcuts,
  toolbarLinks,
}) => {
  if (!showShortcuts && !toolbarLinks?.length) return null;
  return (
    <>
      <AskOpenShiftLightspeedButton />

      <Flex className="pf-v6-u-ml-xs" alignItems={{ default: 'alignItemsCenter' }}>
        {toolbarLinks &&
          toolbarLinks.map((link, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <FlexItem key={`${index}`}>{link}</FlexItem>
          ))}
      </Flex>
    </>
  );
};
export default CodeEditorToolbar;
