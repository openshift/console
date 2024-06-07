import * as React from 'react';
import { withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { DroppableFileInput } from '.';

class SSHAuthSubformWithTranslation extends React.Component<
  SSHAuthSubformProps & WithT,
  SSHAuthSubformState
> {
  constructor(props) {
    super(props);
    this.state = {
      'ssh-privatekey': this.props.stringData['ssh-privatekey'] || '',
    };
    this.changeData = this.changeData.bind(this);
    this.onFileChange = this.onFileChange.bind(this);
  }
  changeData(event) {
    this.setState(
      {
        'ssh-privatekey': event.target.value.endsWith('\n')
          ? event.target.value
          : `${event.target.value}\n`,
      },
      () => this.props.onChange(this.state),
    );
  }
  onFileChange(fileData) {
    this.setState(
      {
        'ssh-privatekey': fileData.endsWith('\n') ? fileData : `${fileData}\n`,
      },
      () => this.props.onChange(this.state),
    );
  }
  render() {
    const { t } = this.props;
    return (
      <DroppableFileInput
        onChange={this.onFileChange}
        inputFileData={this.state['ssh-privatekey']}
        id="ssh-privatekey"
        label={t('public~SSH private key')}
        inputFieldHelpText={t(
          'public~Drag and drop file with your private SSH key here or browse to upload it.',
        )}
        textareaFieldHelpText={t('public~Private SSH key file for Git authentication.')}
        isRequired={true}
      />
    );
  }
}

export const SSHAuthSubform = withTranslation()(SSHAuthSubformWithTranslation);

type SSHAuthSubformState = {
  'ssh-privatekey': string;
};

type SSHAuthSubformProps = {
  onChange: Function;
  stringData: {
    [key: string]: string;
  };
};
