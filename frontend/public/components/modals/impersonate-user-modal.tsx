import type { FC, Ref, MouseEvent } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { MenuToggleElement } from '@patternfly/react-core';
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
  Radio,
} from '@patternfly/react-core';
import { RhUiCloseIcon, RhUiErrorFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { GroupModel } from '../../models';
import type { GroupKind } from '../../module/k8s';
import { FieldLevelHelp } from '../utils/field-level-help';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';

const SELECT_ALL_KEY = '__select_all__';
const MAX_VISIBLE_CHIPS = 5;

type ImpersonateSubjectKind = 'User' | 'ServiceAccount';

export interface ImpersonateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (username: string, groups: string[], kind: ImpersonateSubjectKind) => void;
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
  const [impersonateKind, setImpersonateKind] = useState<ImpersonateSubjectKind>('User');
  const [username, setUsername] = useState(prefilledUsername);
  const [serviceAccountNamespace, setServiceAccountNamespace] = useState('');
  const [serviceAccountName, setServiceAccountName] = useState('');
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
    setImpersonateKind('User');
    setUsername(prefilledUsername);
    setServiceAccountNamespace('');
    setServiceAccountName('');
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
    if (impersonateKind === 'User' && !username.trim()) {
      setUsernameError(t('Username is required'));
      return false;
    }

    if (impersonateKind === 'ServiceAccount' && !serviceAccountNamespace.trim()) {
      setUsernameError(t('Service account namespace is required'));
      return false;
    }

    if (impersonateKind === 'ServiceAccount' && !serviceAccountName.trim()) {
      setUsernameError(t('Service account name is required'));
      return false;
    }
    return true;
  };

  const handleImpersonate = () => {
    if (validateForm()) {
      const impersonateUsername =
        impersonateKind === 'ServiceAccount'
          ? `system:serviceaccount:${serviceAccountNamespace.trim()}:${serviceAccountName.trim()}`
          : username.trim();
      onImpersonate(impersonateUsername, selectedGroups, impersonateKind);
      handleClose();
    }
  };

  // Reset form when modal opens with new prefilled username
  useEffect(() => {
    if (isOpen) {
      setImpersonateKind('User');
      setUsername(prefilledUsername);
      setServiceAccountNamespace('');
      setServiceAccountName('');
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

  const isImpersonateDisabled =
    impersonateKind === 'ServiceAccount'
      ? !serviceAccountNamespace.trim() || !serviceAccountName.trim()
      : !username.trim();

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

  return (
    <Modal variant={ModalVariant.small} isOpen={isOpen} onClose={handleClose}>
      <ModalHeader title={t('Impersonate')} />
      <ModalBody>
        <Form>
          <Alert
            variant={AlertVariant.warning}
            isInline
            title={t(
              'Impersonating a user or service account grants you their exact permissions. You must enter a username or service account, but you can also enter a group to simulate the permissions of a member of that group.',
            )}
          />

          <FormGroup label={t('Impersonate')} fieldId="impersonate-kind">
            <Radio
              id="impersonate-kind-user"
              name="impersonate-kind"
              label={t('User')}
              checked={impersonateKind === 'User'}
              onChange={() => {
                setImpersonateKind('User');
                setUsernameError('');
              }}
              data-test="impersonate-kind-user"
            />
            <Radio
              id="impersonate-kind-service-account"
              name="impersonate-kind"
              label={t('ServiceAccount')}
              checked={impersonateKind === 'ServiceAccount'}
              onChange={() => {
                setImpersonateKind('ServiceAccount');
                setUsernameError('');
              }}
              data-test="impersonate-kind-service-account"
            />
          </FormGroup>

          {groupsLoadError && (
            <Alert variant={AlertVariant.danger} isInline title={t('Failed to load groups')}>
              {groupsLoadError.message}
            </Alert>
          )}

          {impersonateKind === 'User' ? (
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
          ) : (
            <>
              <FormGroup
                label={t('Service account namespace')}
                fieldId="impersonate-service-account-namespace"
                isRequired
              >
                <TextInput
                  id="impersonate-service-account-namespace"
                  name="serviceAccountNamespace"
                  value={serviceAccountNamespace}
                  onChange={(_event, value) => {
                    setServiceAccountNamespace(value);
                    setUsernameError('');
                  }}
                  placeholder={t('Enter a namespace')}
                  data-test="service-account-namespace-input"
                  validated={usernameError ? 'error' : 'default'}
                  aria-label={t('Service account namespace to impersonate')}
                />
              </FormGroup>
              <FormGroup
                label={t('Service account name')}
                fieldId="impersonate-service-account-name"
                isRequired
              >
                <TextInput
                  id="impersonate-service-account-name"
                  name="serviceAccountName"
                  value={serviceAccountName}
                  onChange={(_event, value) => {
                    setServiceAccountName(value);
                    setUsernameError('');
                  }}
                  placeholder={t('Enter a service account name')}
                  data-test="service-account-name-input"
                  validated={usernameError ? 'error' : 'default'}
                  aria-label={t('Service account name to impersonate')}
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
            </>
          )}

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
              <SelectList id="impersonate-groups-listbox">
                {filteredGroups.length === 0 ? (
                  <SelectOption isDisabled>{t('No results found')}</SelectOption>
                ) : (
                  <>
                    <SelectOption
                      key={SELECT_ALL_KEY}
                      value={SELECT_ALL_KEY}
                      isSelected={areAllFilteredGroupsSelected}
                    >
                      {t('Select all')}
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
          isDisabled={isImpersonateDisabled}
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
