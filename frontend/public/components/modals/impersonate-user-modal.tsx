import type { FC, KeyboardEvent, Ref, MouseEvent } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
import {
  Alert,
  AlertVariant,
  Button,
  Form,
  FormGroup,
  TextInput,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  Label,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { RhUiCloseIcon, RhUiErrorFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { GroupModel } from '../../models';
import type { GroupKind } from '../../module/k8s';
import { FieldLevelHelp } from '../utils/field-level-help';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';

const SELECT_ALL_KEY = '__select_all__';
const CREATE_KEY = '__create__';
const MAX_VISIBLE_CHIPS = 5;

export interface ImpersonateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (username: string, groups: string[]) => void;
  prefilledUsername?: string;
  isUsernameReadonly?: boolean;
}

export const ImpersonateUserModal: FC<ImpersonateUserModalProps> = ({
  isOpen,
  onClose,
  onImpersonate,
  prefilledUsername = '',
  isUsernameReadonly = false,
}) => {
  const { t } = useTranslation('public');
  const [username, setUsername] = useState(prefilledUsername);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState('');
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [groupSearchFilter, setGroupSearchFilter] = useState('');

  // Fetch available groups from the cluster
  const [groups, groupsLoaded, groupsLoadError] = useK8sWatchResource<GroupKind[]>({
    groupVersionKind: {
      group: GroupModel.apiGroup,
      version: GroupModel.apiVersion,
      kind: GroupModel.kind,
    },
    isList: true,
  });

  // Whether groups are available from the API (model exists and loaded successfully)
  const groupsAvailable = groupsLoaded && !groupsLoadError;

  // Extract group names from the API response
  const availableGroups = useMemo(() => {
    if (!groupsAvailable) {
      return [];
    }
    return groups.map((group) => group.metadata.name).sort();
  }, [groups, groupsAvailable]);

  const handleClose = useCallback(() => {
    setUsername(prefilledUsername);
    setSelectedGroups([]);
    setUsernameError('');
    onClose();
  }, [prefilledUsername, onClose]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (usernameError) {
      setUsernameError('');
    }
  };

  // Filter groups based on search input
  const filteredGroups = useMemo(() => {
    if (!groupSearchFilter) {
      return availableGroups;
    }
    return availableGroups.filter((group) =>
      group.toLowerCase().includes(groupSearchFilter.toLowerCase()),
    );
  }, [groupSearchFilter, availableGroups]);

  // Check if typed text can be created as a new group entry
  const isCreatableGroup = useMemo(() => {
    const trimmed = groupSearchFilter.trim();
    if (!trimmed) {
      return false;
    }
    // Don't show "Create" if it exactly matches an existing available group or is already selected
    const alreadyExists = availableGroups.some(
      (g) => g.toLowerCase() === trimmed.toLowerCase(),
    );
    return !alreadyExists && !selectedGroups.includes(trimmed);
  }, [groupSearchFilter, availableGroups, selectedGroups]);

  // Add a free-form group name
  const handleCreateGroup = useCallback(
    (groupName: string) => {
      const trimmed = groupName.trim();
      if (trimmed && !selectedGroups.includes(trimmed)) {
        setSelectedGroups([...selectedGroups, trimmed]);
        setGroupSearchFilter('');
      }
    },
    [selectedGroups],
  );

  const handleSelectAll = useCallback(() => {
    if (selectedGroups.length === filteredGroups.length) {
      // If all filtered groups are selected, deselect all
      setSelectedGroups(selectedGroups.filter((g) => !filteredGroups.includes(g)));
    } else {
      // Select all filtered groups (merge with existing selections from other filters)
      const newSelections = new Set([...selectedGroups, ...filteredGroups]);
      setSelectedGroups(Array.from(newSelections));
    }
  }, [selectedGroups, filteredGroups]);

  const handleGroupSelect = useCallback(
    (_event: MouseEvent | undefined, value: string | number) => {
      const group = value as string;

      // Handle "Create" option
      if (group === CREATE_KEY) {
        handleCreateGroup(groupSearchFilter);
        return;
      }

      // Handle "Select all" option
      if (group === SELECT_ALL_KEY) {
        handleSelectAll();
        return;
      }

      if (selectedGroups.includes(group)) {
        // Deselect if already selected
        setSelectedGroups(selectedGroups.filter((g) => g !== group));
      } else {
        // Add to selection
        setSelectedGroups([...selectedGroups, group]);
      }
      // Keep dropdown open - don't call setIsGroupSelectOpen(false)
    },
    [selectedGroups, handleSelectAll, handleCreateGroup, groupSearchFilter],
  );

  const handleGroupRemove = (groupToRemove: string) => {
    setSelectedGroups(selectedGroups.filter((g) => g !== groupToRemove));
  };

  // Handle Enter key to add free-form group
  const handleGroupInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const trimmed = groupSearchFilter.trim();
      if (trimmed && !selectedGroups.includes(trimmed)) {
        handleCreateGroup(trimmed);
      }
    }
  };

  const validateForm = (): boolean => {
    if (!username.trim()) {
      setUsernameError(t('Username is required'));
      return false;
    }
    return true;
  };

  const handleImpersonate = () => {
    if (validateForm()) {
      onImpersonate(username.trim(), selectedGroups);
      handleClose();
    }
  };

  // Reset form when modal opens with new prefilled username
  useEffect(() => {
    if (isOpen) {
      setUsername(prefilledUsername);
      setSelectedGroups([]);
      setUsernameError('');
      setGroupSearchFilter('');
      setShowAllGroups(false);
    }
  }, [isOpen, prefilledUsername]);

  // Reset showAllGroups when selected groups drop to or below MAX_VISIBLE_CHIPS
  useEffect(() => {
    if (selectedGroups.length <= MAX_VISIBLE_CHIPS) {
      setShowAllGroups(false);
    }
  }, [selectedGroups.length]);

  const visibleGroups = showAllGroups ? selectedGroups : selectedGroups.slice(0, MAX_VISIBLE_CHIPS);
  const remainingCount = selectedGroups.length - MAX_VISIBLE_CHIPS;

  // Check if all filtered groups are selected
  const areAllFilteredGroupsSelected = useMemo(() => {
    if (filteredGroups.length === 0) {
      return false;
    }
    return filteredGroups.every((group) => selectedGroups.includes(group));
  }, [filteredGroups, selectedGroups]);

  const textInputGroupRef = useRef<HTMLDivElement>(null);

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => setIsGroupSelectOpen(!isGroupSelectOpen)}
      isExpanded={isGroupSelectOpen}
      isFullWidth
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={groupSearchFilter}
          onClick={() => setIsGroupSelectOpen(!isGroupSelectOpen)}
          onChange={(_event, value) => {
            setGroupSearchFilter(value);
            if (!isGroupSelectOpen) {
              setIsGroupSelectOpen(true);
            }
          }}
          onKeyDown={handleGroupInputKeyDown}
          autoComplete="off"
          innerRef={textInputGroupRef}
          placeholder={t('Enter groups')}
          role="combobox"
          isExpanded={isGroupSelectOpen}
          aria-controls="impersonate-groups-listbox"
        />
        <TextInputGroupUtilities>
          {groupSearchFilter && (
            <Button
              variant="plain"
              onClick={() => {
                setGroupSearchFilter('');
                textInputGroupRef?.current?.focus();
              }}
              aria-label={t('Clear input')}
            >
              <RhUiCloseIcon aria-hidden />
            </Button>
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  // Build the dropdown options list
  const renderSelectOptions = () => {
    const options: JSX.Element[] = [];

    // Show "Select all" only when API groups are available and there are filtered results
    if (filteredGroups.length > 0) {
      options.push(
        <SelectOption
          key={SELECT_ALL_KEY}
          value={SELECT_ALL_KEY}
          isSelected={areAllFilteredGroupsSelected}
        >
          {t('Select all')}
        </SelectOption>,
      );

      filteredGroups.forEach((group) => {
        options.push(
          <SelectOption key={group} value={group} isSelected={selectedGroups.includes(group)}>
            {group}
          </SelectOption>,
        );
      });
    }

    // Show "Create" option for free-form entry when typed text is new
    if (isCreatableGroup) {
      options.push(
        <SelectOption key={CREATE_KEY} value={CREATE_KEY} data-test="create-group-option">
          {t('Create "{{groupName}}"', { groupName: groupSearchFilter.trim() })}
        </SelectOption>,
      );
    }

    // Show hint when no options and no creatable text
    if (options.length === 0) {
      if (groupSearchFilter.trim()) {
        // Text is typed but it's already selected
        options.push(
          <SelectOption key="already-added" isDisabled>
            {t('Group already added')}
          </SelectOption>,
        );
      } else {
        options.push(
          <SelectOption key="hint" isDisabled>
            {groupsAvailable ? t('No results found') : t('Type a group name and press Enter')}
          </SelectOption>,
        );
      }
    }

    return options;
  };

  return (
    <Modal variant={ModalVariant.small} isOpen={isOpen} onClose={handleClose}>
      <ModalHeader title={t('Impersonate')} />
      <ModalBody>
        <Form>
          <Alert
            variant={AlertVariant.warning}
            isInline
            title={t(
              'Impersonating a user grants you their exact permissions. You must enter username, but you can also enter a group to simulate the permissions of a member of that group.',
            )}
          />

          <FormGroup
            label={
              <>
                {t('Username')}
                <FieldLevelHelp>{t('The name of the user to impersonate')}</FieldLevelHelp>
              </>
            }
            fieldId="impersonate-username"
            isRequired
          >
            <TextInput
              id="impersonate-username"
              name="username"
              value={username}
              onChange={(_event, value) => handleUsernameChange(value)}
              readOnly={isUsernameReadonly}
              placeholder={t('Enter a username')}
              data-test="username-input"
              validated={usernameError ? 'error' : 'default'}
              aria-label={t('Username to impersonate')}
              aria-describedby="username-help-text"
            />
            {usernameError && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error" icon={<RhUiErrorFillIcon />}>
                    {usernameError}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup
            label={
              <>
                {t('Groups')}
                <FieldLevelHelp>{t('The groups to impersonate the user with')}</FieldLevelHelp>
              </>
            }
            fieldId="impersonate-groups"
          >
            <Select
              id="impersonate-groups"
              isOpen={isGroupSelectOpen}
              onOpenChange={setIsGroupSelectOpen}
              onSelect={handleGroupSelect}
              toggle={toggle}
              isScrollable
              maxMenuHeight="300px"
              popperProps={{
                enableFlip: false,
                direction: 'down',
              }}
              aria-label={t('Select groups to impersonate')}
              aria-describedby="groups-help-text"
            >
              <SelectList id="impersonate-groups-listbox">{renderSelectOptions()}</SelectList>
            </Select>

            {!groupsAvailable && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    {t('Type group names manually. Press Enter to add each group.')}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}

            {selectedGroups.length > 0 && (
              <Flex spaceItems={{ default: 'spaceItemsSm' }} className="pf-v6-u-mt-sm">
                {visibleGroups.map((group) => (
                  <FlexItem key={group}>
                    <Label onClose={() => handleGroupRemove(group)} color="blue">
                      {group}
                    </Label>
                  </FlexItem>
                ))}
                {!showAllGroups && remainingCount > 0 && (
                  <FlexItem>
                    <Label color="grey" isClickable onClick={() => setShowAllGroups(true)}>
                      +{remainingCount}
                    </Label>
                  </FlexItem>
                )}
              </Flex>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="impersonate"
          variant="primary"
          onClick={handleImpersonate}
          isDisabled={!username.trim()}
          data-test="impersonate-button"
        >
          {t('Impersonate')}
        </Button>
        <Button key="cancel" variant="link" onClick={handleClose} data-test="cancel-button">
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
