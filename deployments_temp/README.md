
# Console 설치 가이드

## 구성 요소
* hypercloud-console ([tmaxcloudck/hypercloud-console](https://hub.docker.com/r/tmaxcloudck/hypercloud-console/tags))
* console-operator ([tmaxcloudck/console-operator](https://hub.docker.com/r/tmaxcloudck/console-operator/tags))
* 가이드 작성 시점(2021/03/10) 최신 버전은 아래와 같습니다. 
    * hypercloud-console:0.5.1.32
    * console-operator:5.1.0.1

## Prerequisites
* Kubernetes, HyperCloud5 Operator, hyperauth (Keycloak), Grafana, Prometheus가 설치되어 있어야 합니다.
* 온전한 화면을 위해 추가로 Istio(Kiali, Jaeger), kibana 설치가 추가로 필요합니다. 
* 설치에 필요한 모듈이 없을 시 설치 가이드 Step에 해당 주소는 0.0.0.0으로 기입합니다. 
* Kubernetes에 Public IP 여유분이 최소한 1개 있어야 합니다.

## 폐쇄망 구축 가이드
* 폐쇄망에서는 Docker Hub의 이미지를 사용할 수 없으므로, 아래의 과정을 통해 이미지를 준비하여야 합니다.
* 이 과정 이후로는 일반적인 Install Steps를 그대로 따르면 됩니다.

    * 작업 디렉토리 생성 및 환경 설정
	  ```bash
	  mkdir -p ~/console-install
      export CONSOLE_HOME=~/console-install 
      export CONSOLE_VERSION=0.5.1.30
      export OPERATOR_VERSION=5.1.0.1
      cd $CONSOLE_HOME
	  ```
	  
    * 외부 네트워크 통신이 가능한 환경에서 이미지 다운로드
	  ```bash
	  sudo docker pull  tmaxcloudck/hypercloud-console:${CONSOLE_VERSION}
	  sudo docker save tmaxcloudck/hypercloud-console:${CONSOLE_VERSION} > console_${CONSOLE_VERSION}.tar
      sudo docker pull  tmaxcloudck/console-operator:${OPERATOR_VERSION}
	  sudo docker save tmaxcloudck/hypercloud-console:${OPERATOR_VERSION} > operator_${OPERATOR_VERSION}.tar
	  ```
	  
    * tar 파일을 폐쇄망 환경으로 이동시킨 후, registry에 이미지 push
	  ```bash
      # 이미지 레지스트리 주소 
      REGISTRY=[IP:PORT]
	  sudo docker load < console_${CONSOLE_VERSION}.tar
	  sudo docker tag tmaxcloudck/hypercloud-console:${CONSOLE_VERSION} ${REGISTRY}/tmaxcloudck/hypercloud-console:${CONSOLE_VERSION}
	  sudo docker push ${REGISTRY}/tmaxcloudck/hypercloud-console:${CONSOLE_VERSION}

      sudo docker load < operator_${OPERATOR_VERSION}.tar
	  sudo docker tag tmaxcloudck/console-operator:${OPERATOR_VERSION} ${REGISTRY}/tmaxcloudck/console-operator:${OPERATOR_VERSION}
	  sudo docker push ${REGISTRY}/tmaxcloudck/console-operator:${OPERATOR_VERSION}
	  ```

## 설치 가이드
1. [CRD 생성](#step-1-CRD-생성)
2. [Namespace, ServiceAccount, ClusterRole, ClusterRoleBinding 생성](#step-2-namespace-serviceaccount-clusterrole-clusterrolebinding-생성)
3. [Secret (TLS) 생성](#step-3-Job으로-Secret-TLS-생성)
4. [Service (Load Balancer) 생성](#step-4-service-load-balancer-생성)
5. [Deployment (with Pod Template) 생성](#step-5-deployment-with-pod-template-생성)
6. [동작 확인](#step-5-동작-확인)
7. [번외. 쉘 스크립 이용](#쉘-스크립트로-설치)
8. [삭제 가이드](#삭제-가이드)

## 설치 yaml 파일 
- 설치에 필요한 yaml 파일들은 deployments 폴더에 있습니다.
## Step 1. CRD 생성 
* 목적 : console-operator 동작에 필요한 console CRD를 생성한다. 
* 순서: 
    1. deployments 폴더에 [1.crd.yaml](https://raw.githubusercontent.com/tmax-cloud/install-console/5.0/deployments/1.crd.yaml) 파일을 생성한다. 
    2. `kubectl apply -f 1.crd.yaml` 실행합니다. 
## Step 2. Namespace, ServiceAccount, ClusterRole, ClusterRoleBinding 생성
* 목적 : console에 필요한 Namespace, ResourceQuota, ServiceAccount, ClusterRole, ClusterRoleBinding을 생성한다.
* 순서 : 
    1. deployments 폴더에 [2.init.yaml](https://raw.githubusercontent.com/tmax-cloud/install-console/5.0/deployments/2.init.yaml) 파일을 생성한다. 
	    * 기본 namespace는 console-system으로 설정됩니다. 
    2. `kubectl apply -f 2.init.yaml` 을 실행합니다.

## Step 3. Job으로 Secret (TLS) 생성
* 목적 : console 웹서버가 https를 지원하게 한다.
    * Job으로 self signing 인증서를 만들어 console-https-secret 이란 이름으로 secret에 저장한다. 
    * (옵션) self signing 인증서이므로 별도의 ca 인증서로 인증을 받기 위해서 [kubernetes.io](https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/)를 참고해서 생성한다. 
* 순서 : 
    1. deployments 폴더 안의 [3.job.yaml](https://raw.githubusercontent.com/tmax-cloud/install-console/5.0/deployments/3.job.yaml) 파일을 실행한다. 
	   * `kubectl apply -f 3.job.yaml`

## Step 4. Service (Load Balancer) 생성
* 목적 : 브라우저를 통해 console에 접속할 수 있게 한다.
* 순서 : 
    1. deployments 폴더에 [4.svc-lb.yaml](https://raw.githubusercontent.com/tmax-cloud/install-console/5.0/deployments/4.svc-lb.yaml) 파일을 실행한다. (기본 서비스 이름은 console.console-system.svc로 만들어진다.)
    * `kubectl apply -f 4.svc-lb.yaml` 을 실행합니다.

## Step 5. Deployment (with Pod Template) 생성
* 목적 : console 웹서버를 호스팅할 pod를 생성한다.
* 순서 : 
    1. deployments 폴더에 [5.deploy.yaml](https://github.com/tmax-cloud/install-console/blob/5.0/deployments/5.deploy.yaml) 파일에 다음의 문자열들을 교체해줍니다.
    
    | 문자열 | 상세내용 | 형식예시 |
    | ---- | ---- | ---- |
    | `@@OPERATOR_VER@@` | hypercloud-console 이미지 태그 입력 | `5.1.x.x` |
    | `@@KIALI@@` | `kubectl get ingress -n istio-system kiali` 에서 ADDRESS와 PORT(S) 확인하여 입력 (포트는 `:` 왼쪽 값 사용) | `10.x.x.x:20001` |
    | `@@KIBANA@@` | `kubectl get svc -n efk opendistro-kibana` 에서 CLUSTER-IP와 PORT(S) 확인하여 입력 (포트는 `:` 왼쪽 값 사용) | `10.x.x.x:80` |
    | `@@REALM@@` | hyperauth이용하여 로그인 시 필요한 정보 입력 | `tmax` |
    | `@@KEYCLOAK@@` | `kubectl get svc -n hyperauth hyperauth` 에서 EXTERNAL-IP 확인하여 입력 | `10.x.x.x` |
    | `@@CLIENTID@@` | hyperauth이용하여 로그인 시 필요한 client 정보 입력 | `hypercloud5` | 
    | `@@MC_MODE@@` | Multi Cluster 모드로 설치하려는 경우 `true` 입력 (아닌 경우 행 삭제) | `true` |
    | `@@CONSOLE_VER@@` | hypercloud-console 이미지 태그 입력 | `0.5.x.x` |
    
    * `kubectl apply -f 5.deploy.yaml` 을 실행합니다.
* 비고
    * 폐쇄망에서 설치하는 경우
	    * image로 `tmaxcloudck/hypercloud-console:1.1.x.x` 대신, `(레포지토리 주소)/tmaxcloudck/hypercloud-console:1.1.x.x` 을 사용합니다.
    * Single Cluster 모드로 설치하는 경우
	    * 5.deploy.yaml 파일에서 --mc-mode=false (default)로 설정한다. 
    * Multicluster Console을 설치하는 경우
	    * 5.deploy.yaml 파일에서 --mc-mode=true 로 설정한다. 


## Step 6. 동작 확인
* 목적 : console이 정상적으로 동작하는지 확인한다.
* 순서 : 
    1. `kubectl get po -n console-system` 을 실행하여 pod가 running 상태인지 확인합니다.
    2. `kubectl get svc -n console-system` 을 실행하여 EXTERNAL-IP를 확인합니다.
    3. `https://EXTERNAL-IP` 로 접속하여 동작을 확인합니다.

## 쉘 스크립트로 설치
* 목적: install.sh를 이용하여 console을 설치한다. 
* 순서: 
    1. 쉘 스크립트 실행 시 필요한 변수 값들을 설정한다. (변수 값 설명은 [Deployment (with Pod Template) 생성](#step-5-deployment-with-pod-template-생성) 참고)
        ```sh
        export OPERATOR_VER=5.1.x.x
        export CONSOLE_VER=0.5.x.x
        export REALM=tmax
        export KEYCLOAK=hyperauth.org
        export CLIENTID=hypercloud5
        export MC_MODE=true
        ```

    2. 쉘 스크립트의 실행권한을 부여한 후 실행한다. 
        ```sh
        chmod +x install.sh
        ./install.sh
        ```

## 삭제 가이드

## 설치 리소스 제거
- 목적: `설치된 console 관련 리소스 제거` 
    - kubectl delete -f ./deployments
