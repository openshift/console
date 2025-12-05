import { useState, MouseEventHandler } from 'react';
import { Modal, Button, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { OverlayComponent } from '@console/dynamic-plugin-sdk/src/app/modal-support/OverlayProvider';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ListInput } from '@console/internal/components/utils/list-input';
import { GroupModel } from '@console/internal/models';
import { GroupKind } from '@console/internal/module/k8s';
import { ModalComponentProps } from 'public/components/factory/modal';

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
    setInProgress(true);
    setErrorMessage('');
    try {
      const patch = group.users
        ? values.map((value: string) => ({ op: 'add', path: '/users/-', value }))
        : [{ op: 'add', path: '/users', value: values }];
      await k8sPatchResource({
        model: GroupModel,
        resource: group,
        data: patch,
      });
      closeOverlay();
    } catch (err) {
      setErrorMessage((err as any)?.message || String(err));
    } finally {
      setInProgress(false);
    }
  };

  return (
    <Modal isOpen onClose={closeOverlay} variant="small">
      <ModalHeader title={t('public~Add Users')} labelId="add-group-users-modal-title" />
      <ModalBody>
        <div className="form-group">
          <p>{t('public~Add new Users to Group {{name}}.', group.metadata)}</p>
        </div>
        <ListInput label={t('public~Users')} required initialValues={values} onChange={setValues} />
        {errorMessage && (
          <div className="pf-v6-u-danger-color-100 pf-v6-u-mt-md">{errorMessage}</div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={closeOverlay} type="button">
          {t('public~Cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={inProgress} onClick={onSubmit}>
          {t('public~Save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddGroupUsersModal;
