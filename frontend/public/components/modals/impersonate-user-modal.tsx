import { useState, useEffect, useMemo, useCallback, useRef, FC, Ref, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  AlertVariant,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
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
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { FieldLevelHelp } from '../utils/field-level-help';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { GroupModel } from '../../models';
import { GroupKind } from '../../module/k8s';

const SELECT_ALL_KEY = '__select_all__';
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
  const { t } = useTranslation();
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

  // Extract group names from the API response
  const availableGroups = useMemo(() => {
    if (!groupsLoaded || groupsLoadError) {
      return [];
    }
    return groups.map((group) => group.metadata.name).sort();
  }, [groups, groupsLoaded, groupsLoadError]);

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
    [selectedGroups, handleSelectAll],
  );

  const handleGroupRemove = (groupToRemove: string) => {
    setSelectedGroups(selectedGroups.filter((g) => g !== groupToRemove));
  };

  const validateForm = (): boolean => {
    if (!username.trim()) {
      setUsernameError(t('public~Username is required'));
      return false;
    }
    return true;
  };

  const handleImpersonate = () => {
    if (validateForm()) {
      handleClose();
      onImpersonate(username.trim(), selectedGroups);
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
          autoComplete="off"
          innerRef={textInputGroupRef}
          placeholder={t('public~Enter groups')}
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
              aria-label="Clear input"
            >
              <TimesIcon aria-hidden />
            </Button>
          )}
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  );

  return (
    <Modal variant={ModalVariant.small} isOpen={isOpen} onClose={handleClose}>
      <ModalHeader title={t('public~Impersonate')} />
      <ModalBody>
        <Form>
          <Alert
            variant={AlertVariant.warning}
            isInline
            title={t('public~Impersonating a user or group grants you their exact permissions.')}
          />

          {groupsLoadError && (
            <Alert variant={AlertVariant.danger} isInline title={t('public~Failed to load groups')}>
              {groupsLoadError.message}
            </Alert>
          )}

          <FormGroup
            label={
              <>
                {t('public~Username')}
                <FieldLevelHelp>{t('public~The name of the user to impersonate')}</FieldLevelHelp>
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
              placeholder={t('public~Enter a username')}
              data-test="username-input"
              validated={usernameError ? 'error' : 'default'}
              aria-label={t('public~Username to impersonate')}
              aria-describedby="username-help-text"
            />
            {usernameError && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error" icon={<ExclamationCircleIcon />}>
                    {usernameError}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup
            label={
              <>
                {t('public~Groups')}
                <FieldLevelHelp>
                  {t('public~The groups to impersonate the user with')}
                </FieldLevelHelp>
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
              aria-label={t('public~Select groups to impersonate')}
              aria-describedby="groups-help-text"
            >
              <SelectList id="impersonate-groups-listbox">
                {filteredGroups.length === 0 ? (
                  <SelectOption isDisabled>{t('public~No results found')}</SelectOption>
                ) : (
                  <>
                    <SelectOption
                      key={SELECT_ALL_KEY}
                      value={SELECT_ALL_KEY}
                      isSelected={areAllFilteredGroupsSelected}
                    >
                      {t('public~Select all')}
                    </SelectOption>
                    {filteredGroups.map((group) => (
                      <SelectOption
                        key={group}
                        value={group}
                        isSelected={selectedGroups.includes(group)}
                      >
                        {group}
                      </SelectOption>
                    ))}
                  </>
                )}
              </SelectList>
            </Select>

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
          {t('public~Impersonate')}
        </Button>
        <Button key="cancel" variant="link" onClick={handleClose} data-test="cancel-button">
          {t('public~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
