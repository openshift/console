import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { INSTALLED_OPERATORS_PATH } from '@console/operator-lifecycle-manager/src/const';
import { MultiTabListPage } from '@console/shared/src/components/multi-tab-list/MultiTabListPage';

type InstalledOperatorsTabbedPageProps = {
  activeTab?: string;
};

/**
 * Installed operators split across a Next-Gen (OLMv1) and a Classic (OLMv0) tab. Each plugin
 * contributes its tab through `console.tab` and gates it on its own API flag.
 */
export const InstalledOperatorsTabbedPage: FC<InstalledOperatorsTabbedPageProps> = ({
  activeTab,
}) => {
  const { t } = useTranslation('olm-v1');
  const { ns } = useParams<{ ns?: string }>();
  const namespaceSegment = ns ? `ns/${ns}` : 'all-namespaces';
  const basePath = `${INSTALLED_OPERATORS_PATH}/${namespaceSegment}`;

  return (
    <>
      <NamespaceBar />
      <MultiTabListPage
        activeTab={activeTab}
        basePath={basePath}
        contextId="installed-operators"
        pages={[]}
        title={t('Installed Operators')}
        telemetryPrefix="Installed Operators"
      />
    </>
  );
};
