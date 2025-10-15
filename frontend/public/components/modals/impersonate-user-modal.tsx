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
  Badge,
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

  // TODO: Replace with actual API call to fetch available groups
  // This is temporary mock data for development/testing purposes
  const availableGroups = useMemo(
    () => [
      'developers',
      'test-group-1',
      'test-group-2',
      'test-group-3',
      'admins',
      'monitoring',
      'operators',
      'viewers',
      'editors',
      'system:authenticated',
      'system:unauthenticated',
      'system:serviceaccounts',
      'system:serviceaccounts:kube-system',
      'system:serviceaccounts:openshift-kube-apiserver',
      'system:serviceaccounts:openshift-kube-controller-manager',
      'system:serviceaccounts:openshift-kube-scheduler',
      'system:serviceaccounts:openshift-kube-proxy',
      'system:serviceaccounts:openshift-kube-router',
    ],
    [],
  );

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

  const handleGroupSelect = (_event: MouseEvent | undefined, value: string | number) => {
    const group = value as string;
    if (selectedGroups.includes(group)) {
      // Deselect if already selected
      setSelectedGroups(selectedGroups.filter((g) => g !== group));
    } else {
      // Add to selection
      setSelectedGroups([...selectedGroups, group]);
    }
    // Keep dropdown open - don't call setIsGroupSelectOpen(false)
  };

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
    }
  }, [isOpen, prefilledUsername]);

  // Show first 2 groups, then +N badge (unless expanded)
  const MAX_VISIBLE_CHIPS = 2;
  const visibleGroups = showAllGroups ? selectedGroups : selectedGroups.slice(0, MAX_VISIBLE_CHIPS);
  const remainingCount = selectedGroups.length - MAX_VISIBLE_CHIPS;

  // Filter groups based on search input
  const filteredGroups = useMemo(() => {
    if (!groupSearchFilter) {
      return availableGroups;
    }
    return availableGroups.filter((group) =>
      group.toLowerCase().includes(groupSearchFilter.toLowerCase()),
    );
  }, [groupSearchFilter, availableGroups]);

  const textInputGroupRef = useRef<HTMLDivElement>(null);

  const toggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => setIsGroupSelectOpen(!isGroupSelectOpen)}
      isExpanded={isGroupSelectOpen}
      className="pf-v6-u-w-100"
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
              onOpenChange={(open) => setIsGroupSelectOpen(open)}
              onSelect={handleGroupSelect}
              toggle={toggle}
              isScrollable
              maxMenuHeight="300px"
            >
              <SelectList id="impersonate-groups-listbox">
                {filteredGroups.length === 0 ? (
                  <SelectOption isDisabled>{t('public~No results found')}</SelectOption>
                ) : (
                  filteredGroups.map((group) => (
                    <SelectOption
                      key={group}
                      value={group}
                      isSelected={selectedGroups.includes(group)}
                    >
                      {group}
                    </SelectOption>
                  ))
                )}
              </SelectList>
            </Select>

            {selectedGroups.length > 0 && (
              <Flex spaceItems={{ default: 'spaceItemsSm' }} className="pf-v5-u-mt-sm">
                {visibleGroups.map((group) => (
                  <FlexItem key={group}>
                    <Label onClose={() => handleGroupRemove(group)} color="blue">
                      {group}
                    </Label>
                  </FlexItem>
                ))}
                {!showAllGroups && remainingCount > 0 && (
                  <FlexItem>
                    <Badge
                      isRead
                      className="pf-v5-u-cursor-pointer"
                      onClick={() => setShowAllGroups(true)}
                    >
                      +{remainingCount}
                    </Badge>
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
