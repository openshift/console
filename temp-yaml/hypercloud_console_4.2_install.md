# HyperCloud Console 설치 가이드라인
hypercloud-console:4.2.0.0부터 적용되는 가이드입니다.<br>
최근 업데이트: ***2020/10/06***

- IP Range Validation을 테스트하기 위해서는 Load Balancer 서비스와 LoadBalancer Public IP를 사용해야 합니다.<br>
LB yaml의 spec에는 "externalTrafficPolicy: Local"이 추가되어야 하고,<br>
deployment yaml의 template spec에는 "serviceAccountName: @@NAME_NS@@-admin"가 추가되어야 합니다.

## 1. 서론 및 사전준비
- UI console 설치 과정은 다음과 같다.
  1. Namespace, Quota, Role 등 생성
  2. Secret 생성 (https 통신을 위함)
  3. Service 생성 (cluster 외부에서 접근하기 위함)
  4. Deploymenet, Pod 생성
- kubernetes master node의 아무 경로에 작업용 폴더를 생성하고, 다음 파일들을 위치시킨다.<br>
  (이 파일들은 hypercloud-console의 hc-dev 또는 hc-release 브랜치의 install-yaml 폴더 안에 들어있다.)<br>
  최근 업데이트: ***2020/10/06***
  - `1.initialization.yaml` (필수)
  - `1.job-createSecret.yaml` (필수)
  - `2.svc-lb.yaml` 또는 `2.svc-np.yaml` (적어도 하나 필수)
  - `3.deployment.yaml` (필수)
- 일반적 루틴 : 이미 설치를 완료한 적이 있고 Namespace/Secret/Service를 바꾸지 않아도 되는 경우, 아래의 작업만 하면 충분하다.
  - `kubectl apply -f 3.deployment.yaml`

## 2. kubectl tool을 이용한 설치 

#### 2-1. Namespace, Quota, Role 등 생성
- 1.initialization.yaml의 @@NAME_NS@@ 문자열을 적절한 값으로 바꾼다. ('console-system' 권장 )
- `kubectl apply -f 1.initialization.yaml`을 실행한다.
  - 이미 완료한 적이 있고 설정을 바꿀 필요가 없다면 생략한다.
  - 설정을 바꿔야 한다면 
    - `vi 1.initialization.yaml` vi editor로 설정값 변경한다. 
    - `kubectl appy -f 1.initialization.yaml` 실행한다.

#### 2-2. Secret 생성
- 1.job-createSecret.yaml의 @@NAME_NS@@ 문자열을 적잘한 값으로 바꾼다. ('console-system' 권장)
- `kubectl apply -f 1.job-createSecret.yaml`을 실행한다.
- 이미 완료한 적이 있고 바꿀 필요가 없다면 생략한다.

#### 2-3. Service 생성
- 2.svc-lb.yaml, 2.svc-np.yaml의 @@NAME_NS@@, @@NODE_PORT@@ 문자열을 적절한 값으로 바꾼다.
- `kubectl create -f 2.svc-lb.yaml` 또는 `kubectl create -f 2.svc-np.yaml`을 실행한다. (둘 다 해도 무방)
  - 이미 완료한 적이 있고 설정을 바꿀 필요가 없다면 생략한다.
  - 설정을 바꿔야 한다면 `vi 2.xxxxx.yaml`로 값 변경 후 `kubectl apply -f 2.xxxxxxxx.yaml`를 먼저 실행한다.

#### 2-4. Deployment, Pod 생성
- 3.deployment.yaml 파일 이용 시 (권장) 
  - `vi 3.deployment.yaml`으로 yaml 파일에 필수 값들을 기입 (@@name@@ 형식으로 되어 있음)
  - console 서버와 동일한 cluster 내에 존재하는 서비스에 대해선 `해당 서비스 이름.네임스페이스.svc:서비스포트번호`를 기입한다. (3.deployment.yaml 파일 참고)
- 공통 기입사항 
  - @@VER@@ 부분에 도커 이미지의 버전 기입. 예: `4.2.0.0` (https://hub.docker.com/r/tmaxcloudck/hypercloud-console/tags?page=1&ordering=last_updated 에서 최신 버전 확인)
- `kubectl apply -f 3.deployment-pod.yaml`을 실행한다.
  - 기존에 이미 실행 중인 것이 있다면 수정 후 `kubectl apply -f 3.deployment-pod.yaml`을 먼저 실행한다.

## 3. 접속 방법
- LoadBalancer: `https://<LB_IP>`
- NodePort: `https://<NODE_IP>:<NODE_PORT>`
