import { Button, Tooltip } from '@patternfly/react-core';
import { MagicIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { action } from 'typesafe-actions';
import { CodeEditorToolbarProps } from '@console/dynamic-plugin-sdk';
import { ActionType } from '@console/internal/reducers/ols';
import { useOLSConfig } from '@console/shared/src/hooks/ols-hook';
import { useIsFullscreen } from '@console/shared/src/hooks/useFullscreen';

export const AskOpenShiftLightspeedButton: React.FCC = () => {
  const { t } = useTranslation('console-shared');
  const openOLS = () => action(ActionType.OpenOLS);
  const showLightspeedButton = useOLSConfig();
  const dispatch = useDispatch();
  const isFullscreen = useIsFullscreen();

  return showLightspeedButton ? (
    <Tooltip content={t('Ask OpenShift Lightspeed')}>
      <Button
        isDisabled={isFullscreen}
        variant="plain"
        onClick={() => dispatch(openOLS())}
        aria-label={t('Ask OpenShift Lightspeed')}
        icon={<MagicIcon />}
      />
    </Tooltip>
  ) : null;
};

export const CodeEditorToolbar: React.FCC<CodeEditorToolbarProps> = ({ toolbarLinks }) => {
  if (!toolbarLinks?.length) return null;

  return (
    <>
      <AskOpenShiftLightspeedButton />
      {toolbarLinks}
    </>
  );
};
export default CodeEditorToolbar;
