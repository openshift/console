import * as React from 'react';
import { Checkbox, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalTitle,
} from '@console/internal/components/factory';
import { ModalFooter } from '../modal/modal-footer';

const CustomizeSourceModal: React.FC<CustomizeSourceModalProps> = ({ close, onConfirm }) => {
  const { t } = useTranslation();
  const [doNotShow, setDoNotShow] = React.useState(false);
  // hack to close template source popup
  // programatically controlled popup is not responsive enough https://github.com/patternfly/patternfly-react/issues/4515
  const ref = React.useRef(null);
  React.useEffect(() => ref.current?.click(), []);
  return (
    <div className="modal-content" ref={ref}>
      <ModalTitle>{t('kubevirt-plugin~About boot source customization process')}</ModalTitle>
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Stack>
              <StackItem>{t('kubevirt-plugin~The customization process will:')}</StackItem>
              <StackItem>
                <b>{t('kubevirt-plugin~1. Clone the boot source')}</b>
              </StackItem>
              <StackItem>
                <b>
                  {t('kubevirt-plugin~2. Customize boot source (in a temporary virtual machine)')}
                </b>
              </StackItem>
              <StackItem>
                <b>
                  {t(
                    'kubevirt-plugin~3. Finish customization and make the new template available.',
                  )}
                </b>
              </StackItem>
            </Stack>
          </StackItem>
          <StackItem>
            {t(
              'kubevirt-plugin~The original template will be available for virtual machines creation and remain intact through the entire process except when the boot source is being cloned.',
            )}
          </StackItem>
          <StackItem>
            <Checkbox
              id="show-customization"
              label={t('kubevirt-plugin~Do not show this message again')}
              onChange={setDoNotShow}
              isChecked={doNotShow}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter
        submitButtonText={t('kubevirt-plugin~Continue')}
        onSubmit={() => {
          onConfirm(doNotShow);
          close();
        }}
        onCancel={close}
      />
    </div>
  );
};

type CustomizeSourceModalProps = {
  onConfirm: (disable: boolean) => void;
} & ModalComponentProps;

const customizeSourceModal = createModalLauncher(CustomizeSourceModal);

export default customizeSourceModal;
