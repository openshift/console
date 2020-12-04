import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { coFetchJSON } from '@console/internal/co-fetch';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type HelmReadmeLoaderProps = {
  chartURL: string;
};

const HelmReadmeLoader: React.FC<HelmReadmeLoaderProps> = ({ chartURL }) => {
  const { t } = useTranslation();
  const [readme, setReadme] = React.useState<string>();
  const [loaded, setLoaded] = React.useState<boolean>(false);

  React.useEffect(() => {
    let unmounted = false;

    const fetchReadme = async () => {
      let chartData;

      try {
        chartData = await coFetchJSON(`/api/helm/chart?url=${chartURL}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Error fetching helm chart details for readme', e);
      }

      const readmeFile = chartData?.files?.find((file) => file.name === 'README.md');
      const readmeData = readmeFile?.data && atob(readmeFile?.data);

      if (!unmounted) {
        setLoaded(true);
        readmeData && setReadme(t('helm-plugin~## README\n{{readmeData}}', { readmeData }));
      }
    };

    fetchReadme();

    return () => {
      unmounted = true;
    };
  }, [chartURL, t]);

  if (!loaded) return <div className="loading-skeleton--table" />;

  return <SyncMarkdownView content={readme} emptyMsg={t('helm-plugin~README not available')} />;
};

export default HelmReadmeLoader;
