import * as React from 'react';
import { Base64 } from 'js-base64';
import { saveAs } from 'file-saver';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import { EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CopyToClipboard, EmptyBox, SectionHeading } from './utils';
import * as ITOB from 'istextorbinary/edition-es2017';

export const MaskedData: React.FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <>
      <span className="pf-v5-u-screen-reader">{t('public~Value hidden')}</span>
      <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
    </>
  );
};

const downloadBinary = (key, value) => {
  const rawBinary = window.atob(value);
  const rawBinaryLength = rawBinary.length;
  const array = new Uint8Array(new ArrayBuffer(rawBinaryLength));
  for (let i = 0; i < rawBinaryLength; i++) {
    array[i] = rawBinary.charCodeAt(i);
  }
  const blob = new Blob([array], { type: 'data:application/octet-stream;' });
  saveAs(blob, key);
};

const DownloadBinaryButton: React.FC<DownloadBinaryButtonProps> = ({ label, value }) => {
  const { t } = useTranslation();
  return (
    <Button
      className="pf-m-link--align-left"
      type="button"
      onClick={() => downloadBinary(label, value)}
      variant="link"
    >
      {t('public~Save file')}
    </Button>
  );
};
DownloadBinaryButton.displayName = 'DownloadBinaryButton';

export const ConfigMapBinaryData: React.FC<DownloadValueProps> = ({ data }) => {
  const dl = [];
  const { t } = useTranslation();
  Object.keys(data || {})
    .sort()
    .forEach((k) => {
      const value = data[k];
      dl.push(
        <dt i18n-not-translated="true" key={`${k}-k`}>
          {k}
        </dt>,
      );
      dl.push(
        <dd key={`${k}-v`}>
          <DownloadBinaryButton label={k} value={value} />
        </dd>,
      );
    });
  return dl.length ? <dl>{dl}</dl> : <EmptyBox label={t('public~binary data')} />;
};
ConfigMapBinaryData.displayName = 'ConfigMapBinaryData';

export const ConfigMapData: React.FC<ConfigMapDataProps> = ({ data, label }) => {
  const dl = [];
  Object.keys(data || {})
    .sort()
    .forEach((k) => {
      const value = data[k];
      dl.push(
        <dt i18n-not-translated="true" key={`${k}-k`}>
          {k}
        </dt>,
      );
      dl.push(
        <dd key={`${k}-v`}>
          <CopyToClipboard value={value} />
        </dd>,
      );
    });
  return dl.length ? <dl>{dl}</dl> : <EmptyBox label={label} />;
};
ConfigMapData.displayName = 'ConfigMapData';

export const SecretValue: React.FC<SecretValueProps> = ({ value, reveal, encoded = true, id }) => {
  const { t } = useTranslation();
  if (!value) {
    return <span className="text-muted">{t('public~No value')}</span>;
  }

  const decodedValue = encoded ? Base64.decode(value) : value;
  const visibleValue = reveal ? decodedValue : <MaskedData />;
  return <CopyToClipboard value={decodedValue} visibleValue={visibleValue} id={id} />;
};
SecretValue.displayName = 'SecretValue';

const SecretDataRevealButton: React.FC<SecretDataRevealButtonProps> = ({ reveal, onClick }) => {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="link"
      className="pf-m-link--align-right"
      data-test="reveal-values"
    >
      {reveal ? (
        <>
          <EyeSlashIcon className="co-icon-space-r" />
          {t('public~Hide values')}
        </>
      ) : (
        <>
          <EyeIcon className="co-icon-space-r" />
          {t('public~Reveal values')}
        </>
      )}
    </Button>
  );
};

export const SecretData: React.FC<SecretDataProps> = ({ data }) => {
  const [reveal, setReveal] = React.useState(false);
  const [hasRevealableContent, setHasRevealableContent] = React.useState(false);
  const { t } = useTranslation();

  const dataDescriptionList = React.useMemo(() => {
    return data
      ? Object.keys(data)
          .sort()
          .map((k) => {
            const isBinary = ITOB.isBinary(k, Buffer.from(data[k], 'base64'));
            if (!isBinary && data[k]) {
              setHasRevealableContent(hasRevealableContent || !isBinary);
            }
            return (
              <React.Fragment key={k}>
                <dt i18n-not-translated="true" data-test="secret-data-term">
                  {k}
                </dt>
                <dd>
                  {isBinary ? (
                    <DownloadBinaryButton label={k} value={data[k]} />
                  ) : (
                    <SecretValue value={data[k]} reveal={reveal} id={k} />
                  )}
                </dd>
              </React.Fragment>
            );
          })
      : [];
  }, [data, reveal]);

  return (
    <>
      <SectionHeading text={t('public~Data')}>
        {dataDescriptionList.length && hasRevealableContent ? (
          <SecretDataRevealButton reveal={reveal} onClick={() => setReveal(!reveal)} />
        ) : null}
      </SectionHeading>
      {dataDescriptionList.length ? (
        <dl data-test="secret-data">{dataDescriptionList}</dl>
      ) : (
        <EmptyBox label={t('public~Data')} />
      )}
    </>
  );
};
SecretData.displayName = 'SecretData';

type KeyValueData = {
  [key: string]: string;
};

type DownloadBinaryButtonProps = {
  value: string;
  label: string;
};

type ConfigMapDataProps = {
  data: KeyValueData;
  label: string;
};

type DownloadValueProps = {
  data: KeyValueData;
};

type SecretValueProps = {
  value: string;
  encoded?: boolean;
  reveal: boolean;
  id?: string;
};

type SecretDataRevealButtonProps = {
  reveal: boolean;
  onClick: () => void;
};

type SecretDataProps = {
  data: KeyValueData;
};
