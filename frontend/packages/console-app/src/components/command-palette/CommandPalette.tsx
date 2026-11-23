import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { RhUiSearchIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { isModalOpen } from '@console/internal/components/modals/is-modal-open';
import {
  getCommandPaletteShortcutLabel,
  isCommandPaletteShortcut,
  isMacUserAgent,
} from './command-palette-shortcut';
import { CommandPaletteModal } from './CommandPaletteModal';

const isAnotherModalOpen = (): boolean =>
  isModalOpen() ||
  Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
    (element) => !element.closest('[hidden]'),
  );

export const CommandPalette: FC = () => {
  const { t } = useTranslation('console-app');
  const [isOpen, setIsOpen] = useState(false);
  const isMac = isMacUserAgent(window.navigator.userAgent);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isCommandPaletteShortcut(event, isMac) || (!isOpen && isAnotherModalOpen())) {
        return;
      }

      event.preventDefault();
      setIsOpen(!isOpen);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMac, isOpen]);

  return (
    <>
      <Tooltip
        content={t('Search ({{shortcut}})', {
          shortcut: getCommandPaletteShortcutLabel(isMac),
        })}
        position="bottom"
      >
        <Button
          icon={<RhUiSearchIcon />}
          variant="plain"
          aria-label={t('Search')}
          aria-haspopup="dialog"
          aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
          onClick={open}
          className="co-masthead-button"
          data-test="command-palette-button"
        />
      </Tooltip>
      {isOpen && <CommandPaletteModal onClose={close} />}
    </>
  );
};
