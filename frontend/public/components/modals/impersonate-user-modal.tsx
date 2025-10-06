import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Alert,
  AlertVariant,
  Popover,
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
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';

export interface ImpersonateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImpersonate: (username: string, groups: string[]) => void;
  prefilledUsername?: string;
  isUsernameReadonly?: boolean;
}

export const ImpersonateUserModal: React.FC<ImpersonateUserModalProps> = ({
  isOpen,
  onClose,
  onImpersonate,
  prefilledUsername = '',
  isUsernameReadonly = false,
}) => {
  const { t } = useTranslation();
  const [username, setUsername] = React.useState(prefilledUsername);
  const [selectedGroups, setSelectedGroups] = React.useState<string[]>([]);
  const [usernameError, setUsernameError] = React.useState('');
  const [isGroupSelectOpen, setIsGroupSelectOpen] = React.useState(false);
  const [showAllGroups, setShowAllGroups] = React.useState(false);
  const [groupSearchFilter, setGroupSearchFilter] = React.useState('');

  // Mock group options - in real implementation, these would come from API
  const availableGroups = React.useMemo(
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

  const handleClose = React.useCallback(() => {
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

  const handleGroupSelect = (_event: React.MouseEvent | undefined, value: string | number) => {
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
  React.useEffect(() => {
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
  const filteredGroups = React.useMemo(() => {
    if (!groupSearchFilter) {
      return availableGroups;
    }
    return availableGroups.filter((group) =>
      group.toLowerCase().includes(groupSearchFilter.toLowerCase()),
    );
  }, [groupSearchFilter, availableGroups]);

  const textInputGroupRef = React.useRef<HTMLDivElement>(null);

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      onClick={() => setIsGroupSelectOpen(!isGroupSelectOpen)}
      isExpanded={isGroupSelectOpen}
      style={{ width: '100%' }}
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
          aria-controls="select-typeahead-listbox"
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
    <Modal
      variant={ModalVariant.small}
      title={t('public~Impersonate user')}
      isOpen={isOpen}
      onClose={handleClose}
      actions={[
        <Button
          key="impersonate"
          variant="primary"
          onClick={handleImpersonate}
          data-test="impersonate-button"
        >
          {t('public~Impersonate')}
        </Button>,
        <Button key="cancel" variant="link" onClick={handleClose} data-test="cancel-button">
          {t('public~Cancel')}
        </Button>,
      ]}
    >
      <Form>
        <Alert
          variant={AlertVariant.warning}
          isInline
          title={t('public~Impersonating a user or group grants you their exact permissions.')}
        />

        <FormGroup
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              {t('public~Username')}
              <Popover
                headerContent={t('public~Username')}
                bodyContent={t('public~The name of the user to impersonate')}
              >
                <button
                  type="button"
                  aria-label={t('public~More info for username field')}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#6A6E73',
                    display: 'inline-flex',
                    alignItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  <HelpIcon style={{ fontSize: '14px' }} />
                </button>
              </Popover>
            </span>
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
            <div style={{ color: '#C9190B', fontSize: '14px', marginTop: '8px' }}>
              <span style={{ marginRight: '4px' }}>⚠</span>
              {usernameError}
            </div>
          )}
        </FormGroup>

        <FormGroup
          label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              {t('public~Groups')}
              <Popover
                headerContent={t('public~Groups')}
                bodyContent={t('public~The groups to impersonate the user with')}
              >
                <button
                  type="button"
                  aria-label={t('public~More info for groups field')}
                  onClick={(e) => e.preventDefault()}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#6A6E73',
                    display: 'inline-flex',
                    alignItems: 'center',
                    lineHeight: 1,
                  }}
                >
                  <HelpIcon style={{ fontSize: '14px' }} />
                </button>
              </Popover>
            </span>
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
            <SelectList id="select-typeahead-listbox">
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
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              {visibleGroups.map((group) => (
                <Label key={group} onClose={() => handleGroupRemove(group)} color="blue">
                  {group}
                </Label>
              ))}
              {!showAllGroups && remainingCount > 0 && (
                <Badge
                  isRead
                  style={{
                    backgroundColor: '#0066CC',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowAllGroups(true)}
                >
                  +{remainingCount}
                </Badge>
              )}
            </div>
          )}
        </FormGroup>
      </Form>
    </Modal>
  );
};
