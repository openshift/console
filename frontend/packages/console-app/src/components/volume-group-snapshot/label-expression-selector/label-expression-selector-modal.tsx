import * as React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalVariant,
  FormGroup,
  Form,
  ButtonVariant,
} from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { MatchExpression } from '@console/internal/module/k8s';
import { LazyLabelExpressionSelector } from './label-expression-selector';

type LabelExpressionSelectorModalProps = {
  labels: {
    [key: string]: string[];
  };
  onSubmit?: (expressions: MatchExpression[]) => void;
  isOpen?: boolean;
  onClose?: () => void;
  buttonText?: string;
};

export const LabelExpressionSelectorModal: React.FC<LabelExpressionSelectorModalProps> = ({
  labels,
  onSubmit,
  isOpen,
  onClose,
  buttonText,
}) => {
  const [internalIsModalOpen, setInternalIsModalOpen] = React.useState(false);
  const isModalOpen = isOpen !== undefined ? isOpen : internalIsModalOpen;

  const [selectedLabels, setSelectedLabels] = React.useState<MatchExpression[]>([]);
  const { t } = useTranslation();

  const handleModalToggle = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
    }
  };

  const handleLabelsChange = (expressions: MatchExpression[]) => {
    setSelectedLabels(expressions);
  };

  const handleConfirm = () => {
    if (onSubmit) {
      onSubmit(selectedLabels);
    }
    handleModalToggle();
  };

  return (
    <>
      {isOpen === undefined && (
        <Button variant={ButtonVariant.link} onClick={() => setInternalIsModalOpen(true)}>
          {buttonText || t('console-app~Filter PVCs by Label')} <CogIcon />
        </Button>
      )}

      <Modal
        variant={ModalVariant.medium}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        title={t('console-app~Filter PVCs by Label')}
        aria-labelledby="volume-group-snapshot-labels-selector"
        aria-describedby="volume-group-snapshot-labels-selector"
      >
        <ModalHeader title="Label Selectors" />
        <ModalBody id="volume-group-snapshot-labels-selector">
          <Form>
            <FormGroup fieldId="volume-group-snapshot-labels">
              <LazyLabelExpressionSelector
                selectedExpressions={selectedLabels}
                labels={labels}
                expandString={t('Expand to edit label selector')}
                addExpressionString={t('Add label selector')}
                isValidationEnabled
                onChange={handleLabelsChange}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button key="confirm" variant="primary" onClick={handleConfirm}>
            {t('Filter PVCs')}
          </Button>
          <Button key="cancel" variant="link" onClick={handleModalToggle}>
            {t('Cancel')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};
