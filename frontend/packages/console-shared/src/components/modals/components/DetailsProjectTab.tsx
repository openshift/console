import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

type DetailsProjectTabProps = {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  displayName: string;
  setDisplayName: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
};

const DetailsProjectTab: React.FC<DetailsProjectTabProps> = ({
  name,
  setName,
  displayName,
  setDisplayName,
  description,
  setDescription,
}) => {
  const { t } = useTranslation();

  const popoverText = () => {
    const nameFormat = t(
      "console-shared~A Project name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character (e.g. 'my-name' or '123-abc').",
    );
    const createNamespaceText = t(
      "console-shared~You must create a Namespace to be able to create projects that begin with 'openshift-', 'kubernetes-', or 'kube-'.",
    );
    return (
      <>
        <p>{nameFormat}</p>
        <p>{createNamespaceText}</p>
      </>
    );
  };

  return (
    <>
      <div className="form-group">
        <label htmlFor="input-name" className="control-label co-required">
          {t('console-shared~Name')}
        </label>{' '}
        <Popover aria-label={t('console-shared~Naming information')} bodyContent={popoverText}>
          <Button
            className="co-button-help-icon"
            variant="plain"
            aria-label={t('console-shared~View naming information')}
          >
            <OutlinedQuestionCircleIcon />
          </Button>
        </Popover>
        <div className="modal-body__field">
          <input
            id="input-name"
            data-test="input-name"
            name="name"
            type="text"
            className="pf-v5-c-form-control"
            onChange={(e) => setName(e.target.value)}
            value={name || ''}
            required
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="input-display-name" className="control-label">
          {t('console-shared~Display name')}
        </label>
        <div className="modal-body__field">
          <input
            id="input-display-name"
            name="displayName"
            type="text"
            className="pf-v5-c-form-control"
            onChange={(e) => setDisplayName(e.target.value)}
            value={displayName || ''}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="input-description" className="control-label">
          {t('console-shared~Description')}
        </label>
        <div className="modal-body__field">
          <textarea
            id="input-description"
            name="description"
            className="pf-v5-c-form-control pf-m-resize-both"
            onChange={(e) => setDescription(e.target.value)}
            value={description || ''}
          />
        </div>
      </div>
    </>
  );
};

export default DetailsProjectTab;
