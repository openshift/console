import * as React from 'react';
let timerID = 0;
let expTime = 0;

// TODO: Typescript 변환, 함수형 컴포넌트로 변경

export class ExpTimer extends React.Component {
  state = {
    expText: null,
    modalShow: false,
  };
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    const curTime = new Date();
    const { keycloak } = this.props;
    const tokenExpTime = new Date((keycloak.idTokenParsed.exp + keycloak.timeSkew) * 1000);
    const logoutTime = (tokenExpTime.getTime() - curTime.getTime()) / 1000;
    expTime = logoutTime;
    timerID = window.setInterval(() => this.tick(), 1000);
  }
  tokRefresh() {
    const curTime = new Date();
    const { keycloak } = this.props;
    const tokenExpTime = new Date((keycloak.idTokenParsed.exp + keycloak.timeSkew) * 1000);
    const logoutTime = (tokenExpTime.getTime() - curTime.getTime()) / 1000;
    expTime = logoutTime;
  }
  closeModal() {
    this.setState({ modalShow: false });
  }
  componentWillUnmount() {
    // 타이머 등록 해제
    window.clearInterval(timerID);
  }

  expFormat() {
    let temp = Math.floor(expTime);
    const sec = temp % 60;
    temp = Math.floor(temp / 60);
    const min = temp % 60;
    temp = Math.floor(temp / 60);
    const hour = temp % 24;
    temp = Math.floor(temp / 24);
    const day = temp;
    const expText = (!!day ? day + 'day(s) ' : '') + (!!hour ? (hour < 10 ? '0' + hour : hour) + ':' : '') + (min < 10 ? '0' + min : min) + ':' + (sec < 10 ? '0' + sec : sec);
    this.setState({ expText: expText });
  }
  tick() {
    if (expTime > 0) {
      expTime -= 1;
    }
    if (Math.floor(expTime) === 20) {
      // TODO: 모달 띄우기
      // NoticeExpirationModal_({ logout: this.props.logout, tokenRefresh: this.props.tokenRefresh, time: expTime });
    }
    this.expFormat();
  }
  render() {
    const { expText } = this.state;
    return (
      <div className="exp-timer">
        <span className="co-masthead__timer__span">
          <span>{expText}</span>
        </span>
      </div>
    );
  }
}
