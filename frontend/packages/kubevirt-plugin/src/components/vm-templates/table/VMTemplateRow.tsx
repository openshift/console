import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RowFunction, TableData, TableRow } from '@console/internal/components/factory';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { NamespaceModel, TemplateModel } from '@console/internal/models';
import { dimensifyRow } from '@console/shared';
import { useCustomizeSourceModal } from '../../../hooks/use-customize-source-modal';
import { useSupportModal } from '../../../hooks/use-support-modal';
import { getTemplateName, getTemplateProvider } from '../../../selectors/vm-template/basic';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { TemplateItem } from '../../../types/template';
import { menuActionsCreator } from '../menu-actions';
import { getTemplateOSIcon } from '../os-icons';
import { TemplateSource } from '../vm-template-source';
import { VMTemplateCommnunityLabel } from '../VMTemplateCommnunityLabel';
import RowActions from './RowActions';
import { VMTemplateRowProps } from './types';
import { tableColumnClasses } from './utils';

import './vm-template-table.scss';

const VMTemplateRow: RowFunction<TemplateItem, VMTemplateRowProps> = ({
  obj,
  customData: { dataVolumes, pvcs, pods, namespace, loaded, togglePin, isPinned, sourceLoadError },
  index,
  key,
  style,
}) => {
  const { t } = useTranslation();
  const [template] = obj.variants;
  const dimensify = dimensifyRow(tableColumnClasses(!namespace));
  const sourceStatus = getTemplateSourceStatus({ template, pvcs, dataVolumes, pods });
  const provider = getTemplateProvider(t, template);
  const pinned = isPinned(obj);
  const withSupportModal = useSupportModal();
  const withCustomizeModal = useCustomizeSourceModal();
  return (
    <TableRow
      className="kv-vm-template__row"
      id={template.metadata.uid}
      index={index}
      trKey={key}
      style={style}
    >
      <TableData className={dimensify()}>
        <Button
          className={pinned ? 'kv-pin-remove-btn' : 'kv-pin-btn'}
          variant="plain"
          aria-label="pin-templte-action"
          onClick={() => togglePin(obj)}
        >
          <StarIcon />
        </Button>
      </TableData>
      <TableData className={dimensify()}>
        <img src={getTemplateOSIcon(template)} alt="" className="kubevirt-vm-template-logo" />
        <Link
          to={`/k8s/ns/${template.metadata.namespace}/vmtemplates/${template.metadata.name}`}
          title={template.metadata.uid}
          data-test-id={template.metadata.name}
          className="co-resource-item__resource-name"
        >
          {getTemplateName(template)}
        </Link>
      </TableData>
      <TableData data-test="template-provider" className={dimensify()}>
        {provider} <VMTemplateCommnunityLabel template={template} />
      </TableData>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={NamespaceModel.kind}
          name={template.metadata.namespace}
          title={template.metadata.namespace}
        />
      </TableData>
      <TableData className={dimensify()} data-test="template-source">
        <TemplateSource
          loadError={sourceLoadError}
          loaded={loaded}
          template={template}
          sourceStatus={sourceStatus}
          detailed
        />
      </TableData>
      <TableData className={dimensify()}>
        <RowActions template={template} sourceStatus={sourceStatus} namespace={namespace} />
      </TableData>
      <TableData className={dimensify(true)}>
        <Kebab
          options={menuActionsCreator(TemplateModel, obj, null, {
            togglePin,
            pinned,
            namespace,
            withSupportModal,
            sourceStatus,
            sourceLoaded: true,
            sourceLoadError,
            withCustomizeModal,
          })}
          key={`kebab-for-${template.metadata.uid}`}
          id={`kebab-for-${template.metadata.uid}`}
        />
      </TableData>
    </TableRow>
  );
};

export default VMTemplateRow;
