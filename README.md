HyperCloud Console 4.2
=========================
**HyperCloud - Cluster Console 코드 프로젝트 입니다.**
- [설치 가이드](https://github.com/tmax-cloud/hypercloud-console/blob/hc-dev/install-yaml/hypercloud_console_install.md)
- openshift console 코드 원본 [GIT](https://github.com/openshift/console/tree/release-3.11)
- HyperCloud - Service Catalog, Application Console UI코드는 [다른 프로젝트](https://gitlab.ck:10080/pk3/HyperCloud-ogl)에서 관리 됩니다.
- 메인 작업은 **dev** Branch에서 진행 됩니다.
---
### 개발 전 체크사항
- nodeJs >= 10.17 & yarn >= 1.3.2 & go >= 1.13 & python......
- (비고) nodeJs의 버전은  ">=8.x <=10.x" 에서 build.sh 가 실행 됨, nvm (node버전 관리툴)을 이용해 nodeJS 버전 맞춰주세요. [참고 블로그](http://hong.adfeel.info/backend/nodejs/window%EC%97%90%EC%84%9C-nvmnode-version-manager-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0/)
  - nvm 명령어 
    - Node 버전 설치: nvm install $version ex) nvm install 10.17.0 // 설치된 Node 목록 확인: nvm ls // 사용할 Node 설정: nvm use $version
  - python 설치, error MSB3428 문제 해결: 
    - python 설치 되어있을 시, "프로그램 추가, 제거"에서 파이썬 제거 
    - 관리자 관한으로 power shell 실행 
    - npm install --global --production windows-build-tools@4.0.0 
    - npm install -g --production windows-build-tools (완료까지 시간이 걸림)
- clone시에 C:\Users\USER_NAME\go\src\github.com\openshift\console에 파일이 담기도록 합시다. (빌드시 안돌아가는 스크립트들이 있음)
---
### 빌드

```
./build.sh
```

build 후, ./frontend/public/dist 폴더에 파일들이 생성되며, 이 파일들로 이미징 작업을 하게 됩니다.

### 실행 

#### 순정 kubernetes 

$GOPATH/github.com/openshift/console 경로에서 
./example/run-bridge.sh 실행 

(사용되지않음)
- kubernetes 인증서 파일 필요 
  - kubernetes가 설치 된 node의 ```/root/.kube/config ``` 를 console 노드의 ``` /root/.kube/``` 에 config 파일 저장 
```
export KUBECONFIG=/root/.kube/config 
source ./contrib/environment.sh
./bin/bridge
```

