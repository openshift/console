import type { FC, KeyboardEvent, ReactNode } from 'react';
import { useId, useMemo, useState } from 'react';
import {
  Content,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  TextInputGroup,
  TextInputGroupMain,
} from '@patternfly/react-core';
import { RhUiSearchIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import {
  getAPIVersionForModel,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
import { COMMAND_GROUPS } from './command-groups';
import { searchCommands } from './search-commands';
import type { CommandPaletteCommand, CommandPaletteCommandType } from './types';
import { useCommandPaletteCommands } from './useCommandPaletteCommands';
import { useRunCommand } from './useRunCommand';

const INPUT_ID = 'co-command-palette-input';

type CommandDetails = {
  description?: ReactNode;
  icon?: ReactNode;
};

type CommandPaletteModalProps = {
  onClose: () => void;
};

export const CommandPaletteModal: FC<CommandPaletteModalProps> = ({ onClose }) => {
  const { t } = useTranslation('console-app');
  const idPrefix = useId();
  const [activePerspective] = useActivePerspective();
  const [activeNamespace] = useActiveNamespace();
  const perspectives = usePerspectives();
  const { commands, isProjects } = useCommandPaletteCommands(perspectives);
  const runCommand = useRunCommand();
  const [query, setQuery] = useState('');
  const [activeCommandId, setActiveCommandId] = useState<string>();

  const groups = useMemo(
    () => searchCommands(commands, query, activePerspective),
    [commands, query, activePerspective],
  );

  const visibleCommands = useMemo(() => groups.flatMap((group) => group.commands), [groups]);

  const groupTitles = useMemo(
    () => new Map(COMMAND_GROUPS.map(({ type, getTitle }) => [type, getTitle(t, isProjects)])),
    [t, isProjects],
  );

  const perspectiveNames = useMemo(
    () => new Map(perspectives.map(({ properties }) => [properties.id, properties.name])),
    [perspectives],
  );

  const activeIndex = Math.max(
    visibleCommands.findIndex((command) => command.id === activeCommandId),
    0,
  );

  const activeCommand = visibleCommands[activeIndex];

  const getOptionId = (index: number) => `${idPrefix}-option-${index}`;

  const getListId = (type: CommandPaletteCommandType) => `${idPrefix}-${type}`;

  const placeholder = isProjects
    ? t('Search pages, resource types, and projects')
    : t('Search pages, resource types, and namespaces');

  const run = (command: CommandPaletteCommand) => {
    runCommand(command);
    onClose();
  };

  const moveActiveCommand = (offset: number) => {
    if (visibleCommands.length === 0) {
      return;
    }

    const nextIndex = (activeIndex + offset + visibleCommands.length) % visibleCommands.length;

    setActiveCommandId(visibleCommands[nextIndex].id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActiveCommand(1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        moveActiveCommand(-1);
        break;

      case 'Enter':
        event.preventDefault();

        if (activeCommand) {
          run(activeCommand);
        }
        break;

      default:
        break;
    }
  };

  const getPageDescription = (perspective: string, section?: string): string | undefined => {
    if (perspective === activePerspective) {
      return section;
    }

    const perspectiveName = perspectiveNames.get(perspective);

    return section
      ? t('{{section}}, {{perspective}} perspective', { section, perspective: perspectiveName })
      : t('{{perspective}} perspective', { perspective: perspectiveName });
  };

  const getCommandDetails = (command: CommandPaletteCommand): CommandDetails => {
    switch (command.type) {
      case 'page':
        return { description: getPageDescription(command.perspective, command.section) };

      case 'resource':
        return {
          description: getAPIVersionForModel(command.model),
          icon: (
            <span aria-hidden="true">
              <ResourceIcon groupVersionKind={getGroupVersionKindForModel(command.model)} />
            </span>
          ),
        };

      case 'namespace':
        if (command.namespace !== activeNamespace) {
          return {};
        }

        return { description: isProjects ? t('Current project') : t('Current namespace') };

      default:
        return {};
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      position="top"
      variant="medium"
      aria-label={t('Search')}
      elementToFocus={`#${INPUT_ID}`}
    >
      <ModalBody>
        <TextInputGroup>
          <TextInputGroupMain
            inputId={INPUT_ID}
            icon={<RhUiSearchIcon />}
            value={query}
            onChange={(_event, value) => {
              setQuery(value);
              setActiveCommandId(undefined);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            role="combobox"
            isExpanded={groups.length > 0}
            aria-controls={groups.map((group) => getListId(group.type)).join(' ') || undefined}
            aria-activedescendant={activeCommand ? getOptionId(activeIndex) : undefined}
            inputProps={{
              onKeyDown,
              'aria-autocomplete': 'list',
              autoComplete: 'off',
              spellCheck: false,
            }}
          />
        </TextInputGroup>
        <div aria-live="polite">
          {groups.length === 0 && <Content component="p">{t('No results found')}</Content>}
        </div>
        {groups.length > 0 && (
          <Menu role="listbox" isPlain isScrollable>
            <MenuContent maxMenuHeight="60vh">
              {groups.map((group) => (
                <MenuGroup
                  key={group.type}
                  label={groupTitles.get(group.type)}
                  labelHeadingLevel="h2"
                  titleId={`${getListId(group.type)}-title`}
                >
                  <MenuList
                    id={getListId(group.type)}
                    aria-labelledby={`${getListId(group.type)}-title`}
                  >
                    {group.commands.map((command) => {
                      const index = visibleCommands.indexOf(command);
                      const { description, icon } = getCommandDetails(command);

                      return (
                        <MenuItem
                          key={command.id}
                          itemId={command.id}
                          id={getOptionId(index)}
                          isFocused={index === activeIndex}
                          description={description}
                          icon={icon}
                          onClick={() => run(command)}
                        >
                          {command.title}
                        </MenuItem>
                      );
                    })}
                  </MenuList>
                </MenuGroup>
              ))}
            </MenuContent>
          </Menu>
        )}
      </ModalBody>
    </Modal>
  );
};
