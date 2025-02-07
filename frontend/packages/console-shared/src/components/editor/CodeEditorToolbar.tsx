import * as React from 'react';
import { Flex, FlexItem, Button, Divider } from '@patternfly/react-core';
import { MagicIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch } from 'react-redux';
import { action } from 'typesafe-actions';
import { ActionType } from '@console/internal/reducers/ols';
import { useOLSConfig } from '../../hooks/ols-hook';
import { isMac, ShortcutCommand } from '../shortcuts/Shortcut';

interface CodeEditorToolbarProps {
  showShortcuts?: boolean;
  toolbarLinks?: React.ReactNodeArray;
}

const CodeEditorToolbar: React.FC<CodeEditorToolbarProps> = ({ showShortcuts, toolbarLinks }) => {
  const { t } = useTranslation();
  const openOLS = () => action(ActionType.OpenOLS);
  const showLightspeedButton = useOLSConfig();
  const dispatch = useDispatch();
  if (!showShortcuts && !toolbarLinks?.length) return null;
  return (
    <Flex
      fullWidth={{ default: 'fullWidth' }}
      justifyContent={{ default: 'justifyContentSpaceBetween' }}
      className="ocs-yaml-editor-toolbar"
    >
      <Flex className="ocs-yaml-editor-toolbar__links" alignItems={{ default: 'alignItemsCenter' }}>
        {showLightspeedButton && (
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
        )}
        {toolbarLinks &&
          toolbarLinks.map((link, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${index}`} className="ocs-yaml-editor-toolbar__link">
              {(showShortcuts || index > 0) && link ? (
                <Divider
                  orientation={{
                    default: 'vertical',
                  }}
                />
              ) : null}
              {link}
            </div>
          ))}
      </Flex>

      <FlexItem className="ocs-yaml-editor-toolbar__shortcuts">
        <span>
          <ShortcutCommand>{isMac ? '⌥ Opt' : 'Alt'}</ShortcutCommand>
          <ShortcutCommand>F1</ShortcutCommand>
        </span>
        <span className="ocs-yaml-editor-shortcut__text">
          {t('console-shared~Accessibility help')}
        </span>
      </FlexItem>
    </Flex>
  );
};
export default CodeEditorToolbar;
