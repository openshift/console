import * as _ from 'lodash-es';
import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { DroppableFileInput } from './DropableFileInput';

class UploadConfigSubformWithTranslation extends React.Component<
  UploadConfigSubformProps & WithT,
  UploadConfigSubformState
> {
  constructor(props) {
    super(props);
    this.state = {
      configFile: _.isEmpty(this.props.stringData) ? '' : JSON.stringify(this.props.stringData),
      parseError: false,
    };
    this.changeData = this.changeData.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
  }
  changeData(event) {
    this.updateState(_.attempt(JSON.parse, event.target.value), event.target.value);
  }
  onFileChange(fileData) {
    this.updateState(_.attempt(JSON.parse, fileData), fileData);
  }
  updateState(parsedData, stringData) {
    this.setState(
      {
        configFile: stringData,
        parseError: _.isError(parsedData),
      },
      () => {
        this.props.onChange(parsedData);
        this.props.onDisable(this.state.parseError);
      },
    );
  }
  render() {
    const { t } = this.props;
    return (
      <>
        <DroppableFileInput
          onChange={this.onFileChange}
          inputFileData={this.state.configFile}
          id="docker-config"
          label={t('public~Configuration file')}
          inputFieldHelpText={t('public~Upload a .dockercfg or .docker/config.json file.')}
          textareaFieldHelpText={t(
            'public~File with credentials and other configuration for connecting to a secured image registry.',
          )}
          isRequired={true}
        />
        {this.state.parseError && (
          <div className="co-create-secret-warning">
            {t('public~Configuration file should be in JSON format.')}
          </div>
        )}
      </>
    );
  }
}

export const UploadConfigSubform = withTranslation()(UploadConfigSubformWithTranslation);

type UploadConfigSubformState = {
  parseError: boolean;
  configFile: string;
};

type UploadConfigSubformProps = {
  onChange: Function;
  onDisable: Function;
  stringData: {
    [key: string]: Object;
  };
};
