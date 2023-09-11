// IMPORTANT: This code is orphaned, but it was using xml2js,
// which was a subdependency of selenium-webdriver and webdriver-manager.
// With the removal of Protractor, selenium-webdriver and webdriver-manager
// are no longer installed, and, as a result, xml2js is no longer available.
// Given this code is orphaned, I am just commenting out the xml2js code. (rhamilto)

import * as React from 'react';
import { DropEvent, FileUpload, Text, TextVariants } from '@patternfly/react-core';
// import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
// import { useDispatch } from 'react-redux';
// import xml from 'xml2js';
// import { SysprepActions, SysprepActionsNames } from '../../../../../redux/actions/sysprep-actions';
import { ValidatedOptions } from '../../../../../utils/validations/common';

export type SysprepFile = {
  isLoading: boolean;
  fileName: string;
  validated: ValidatedOptions;
  value: string;
};

type SysprepFileFieldProps = {
  id: string;
};

const SysprepFileField: React.FC<SysprepFileFieldProps> = ({ id }) => {
  const { t } = useTranslation();
  // const dispatch = useDispatch();
  const [data, setData] = React.useState<SysprepFile>({
    validated: ValidatedOptions.default,
    fileName: '',
    value: '',
    isLoading: false,
  });

  const onChange = React.useCallback(async (_event: DropEvent, file: File) => {
    const { name } = file;
    const value = await file.text();

    setData((currentSysprepFile) => ({
      ...currentSysprepFile,
      validated: ValidatedOptions.default,
      value,
      name,
    }));

    // xml.parseString(value, (parseError) => {
    //   dispatch(
    //     SysprepActions[SysprepActionsNames.updateValue]({
    //       [id]: !parseError && !isEmpty(value) ? value : null,
    //     }),
    //   );
    //   setData((currentSysprepFile) => ({
    //     ...currentSysprepFile,
    //     validated: parseError ? ValidatedOptions.error : ValidatedOptions.default,
    //   }));
    // });
  }, []);
  return (
    <>
      <FileUpload
        id={`sysprep-${id}-input`}
        data-test={`sysprep-${id.toLowerCase().replace('.', '-')}-input`}
        type="text"
        value={data.value}
        filename={data.fileName}
        onFileInputChange={onChange}
        onReadStarted={() =>
          setData((currentData: SysprepFile) => ({ ...currentData, isLoading: true }))
        }
        onReadFinished={() =>
          setData((currentData: SysprepFile) => ({ ...currentData, isLoading: false }))
        }
        isLoading={data.isLoading}
        validated={data.validated}
        allowEditingUploadedText
        isReadOnly={false}
      />
      {data.validated === ValidatedOptions.error && (
        <Text component={TextVariants.p} className="kv-sysprep--error">
          {t('kubevirt-plugin~XML structure is not valid')}
        </Text>
      )}
    </>
  );
};

export default SysprepFileField;
