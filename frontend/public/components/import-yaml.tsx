import { Title } from '@console/shared/src/components/title/Title';
import { AsyncComponent } from './utils';
import { useTranslation } from 'react-i18next';
import { useQueryParams } from '@console/shared';

export const ImportYamlPage = () => {
  const { t } = useTranslation();
  const queryParams = useQueryParams();
  const title = t('public~Import YAML');

  const isCodeImportRedirect = queryParams.get('ols') === 'true';

  return (
    <>
      <Title>{title}</Title>
      <AsyncComponent
        loader={() => import('./droppable-edit-yaml').then((c) => c.DroppableEditYAML)}
        allowMultiple
        create={true}
        download={false}
        header={title}
        isCodeImportRedirect={isCodeImportRedirect}
      />
    </>
  );
};
