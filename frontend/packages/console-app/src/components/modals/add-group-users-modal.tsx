import * as React from 'react';
import { Modal, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ListInput } from '@console/internal/components/utils';
import { GroupModel } from '@console/internal/models';
import { GroupKind, K8sKind } from '@console/internal/module/k8s';

type AddGroupUsersModalProps = {
  group: GroupKind;
  closeOverlay: () => void;
};

const AddGroupUsersModal: React.FC<AddGroupUsersModalProps> = ({ group, closeOverlay }) => {
  const { t } = useTranslation();
  const [values, setValues] = React.useState<string[]>(['']);
  const [inProgress, setInProgress] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setInProgress(true);
    setErrorMessage('');
    try {
      const patch = group.users
        ? values.map((value: string) => ({ op: 'add', path: '/users/-', value }))
        : [{ op: 'add', path: '/users', value: values }];
      await k8sPatchResource({
        model: (GroupModel as unknown) as K8sKind,
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
    <Modal isOpen onClose={closeOverlay} title={t('public~Add Users')} variant="small">
      <form onSubmit={onSubmit} name="form">
        <div className="pf-v6-c-modal__body">
          <p>{t('public~Add new Users to Group {{name}}.', group.metadata)}</p>
          <ListInput
            label={t('public~Users')}
            required
            initialValues={values}
            onChange={setValues}
          />
          {errorMessage && (
            <div className="pf-v6-u-danger-color-100 pf-v6-u-mt-md">{errorMessage}</div>
          )}
        </div>
        <div className="pf-v6-c-modal__footer">
          <Button variant="secondary" onClick={closeOverlay} type="button">
            {t('public~Cancel')}
          </Button>
          <Button type="submit" variant="primary" isLoading={inProgress}>
            {t('public~Save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGroupUsersModal;
