import type { MouseEventHandler } from 'react';
import { useState } from 'react';
import {
  Alert,
  AlertVariant,
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ListInput } from '@console/internal/components/utils/list-input';
import { GroupModel } from '@console/internal/models';
import type { GroupKind } from '@console/internal/module/k8s';
import type { ModalComponentProps } from 'public/components/factory/modal';

type AddGroupUsersModalProps = {
  group: GroupKind;
} & ModalComponentProps;

const AddGroupUsersModal: OverlayComponent<AddGroupUsersModalProps> = ({ group, closeOverlay }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<string[]>(['']);
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const onSubmit: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (!group?.metadata?.name) {
      setErrorMessage(t('public~Selected group is unavailable'));
      return;
    }
    // Filter out empty values
    const validUsers = values.map((v) => v.trim()).filter((v) => v.length > 0);
    if (validUsers.length === 0) {
      setErrorMessage(t('public~Enter at least one user'));
      return;
    }
    setInProgress(true);
    setErrorMessage('');
    try {
      const patch = group.users
        ? validUsers.map((value: string) => ({ op: 'add', path: '/users/-', value }))
        : [{ op: 'add', path: '/users', value: validUsers }];
      await k8sPatchResource({
        model: GroupModel,
        resource: group,
        data: patch,
      });
      closeOverlay();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setInProgress(false);
    }
  };

  return (
    <Modal isOpen onClose={closeOverlay} variant="small">
      <ModalHeader title={t('public~Add Users')} labelId="add-group-users-modal-title" />
      <ModalBody>
        {!group?.metadata?.name ? (
          <Alert isInline variant={AlertVariant.danger} title={t('public~Error occurred')}>
            {t('public~Selected group is unavailable')}
          </Alert>
        ) : (
          <>
            <p className="pf-v6-u-mb-md">
              {t('public~Add new users to group {{name}}', { name: group.metadata.name })}
            </p>
            <ListInput
              label={t('public~Users')}
              required
              initialValues={values}
              onChange={setValues}
            />
            {errorMessage && (
              <Alert
                isInline
                className="pf-v6-u-mt-md"
                variant={AlertVariant.danger}
                title={t('public~Error occurred')}
              >
                {errorMessage}
              </Alert>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          type="submit"
          variant="primary"
          isLoading={inProgress}
          isDisabled={!group?.metadata?.name}
          onClick={onSubmit}
        >
          {t('public~Save')}
        </Button>
        <Button variant="link" onClick={closeOverlay} type="button">
          {t('public~Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddGroupUsersModal;
