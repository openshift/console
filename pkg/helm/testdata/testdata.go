package testdata

var AzureRepoYaml = `
apiVersion: v1
entries:
  aks-helloworld:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4350608-05:00"
    description: A Helm chart for Kubernetes
    digest: a9bc374461e31cb1429021a898ef83d0a650783033f3bc121ed536ad99301bbc
    name: aks-helloworld
    response:
    - https://azure-samples.github.io/helm-charts/aks-helloworld-0.1.1.tgz
    version: 0.1.1
  - apiVersion: v1
    created: "2020-03-30T16:27:13.433497-05:00"
    description: A Helm chart for Kubernetes
    digest: f4eb20e7116b24c4825861e6ff6f4303bbe83bcee4a7b2b6ea9fe6929852f34d
    name: aks-helloworld
    response:
    - https://azure-samples.github.io/helm-charts/aks-helloworld-0.1.0.tgz
    version: 0.1.0
  azure-vote:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4454224-05:00"
    description: A Helm chart for Kubernetes
    digest: ac7698878230b11c766c0fcbfce36e7a1c8ab4ab18d55eae9e6551217042c164
    name: azure-vote
    response:
    - https://azure-samples.github.io/helm-charts/azure-vote-0.1.1.tgz
    version: 0.1.1
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4436157-05:00"
    description: A Helm chart for Kubernetes
    digest: da054ba832f52ff3e8da26ffe705d6ad6c2ed0818c04588c832c716e8e8d84a7
    name: azure-vote
    response:
    - https://azure-samples.github.io/helm-charts/azure-vote-0.1.0.tgz
    version: 0.1.0
  azure-vote-osba:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4518442-05:00"
    description: A Helm chart for Kubernetes
    digest: 64f7688099208066cef552afc560bd4d0ff04a297365c4260d3116fd1af061da
    name: azure-vote-osba
    response:
    - https://azure-samples.github.io/helm-charts/azure-vote-osba-0.1.0.tgz
    version: 0.1.0
  burst-scheduler:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.455658-05:00"
    description: A Helm chart for Kubernetes
    digest: 326910e7174b98c337e508c1b2baa1e430720758e013256aa8fcbcf1551c2c13
    name: burst-scheduler
    response:
    - https://azure-samples.github.io/helm-charts/burst-scheduler-0.1.0.tgz
    version: 0.1.0
  image-pull-secret:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4592817-05:00"
    description: A Helm chart for Kubernetes
    digest: ee937e26d72c420a9eb5af8eb0ef23206260858c830b06e7b5ec37c5752fa6a3
    name: image-pull-secret
    response:
    - https://azure-samples.github.io/helm-charts/image-pull-secret-0.1.0.tgz
    version: 0.1.0
  open-service-broker-azure:
  - apiVersion: v1
    appVersion: v0.0.1
    created: "2020-03-30T16:27:13.4706997-05:00"
    dependencies:
    - condition: redis.embedded
      name: redis
      repository: https://kubernetes-charts.storage.googleapis.com/
      version: 0.10.0
    description: A Helm chart for Open Service Broker For Azure
    digest: 407ba56844a0e8ed67014ea3d7ef32d2b2e15f7f34bf691b237da6f10818e265
    home: https://github.com/azure/open-service-broker-azure
    keywords:
    - azure
    - services
    - service broker
    maintainers:
    - email: kent.rancourt@microsoft.com
      name: Kent Rancourt
    - email: jeremy.rickard@microsoft.com
      name: Jeremy Rickard
    name: open-service-broker-azure
    sources:
    - https://github.com/azure/open-service-broker-azure
    - https://hub.docker.com/r/microsoft/azure-service-broker/
    response:
    - https://azure-samples.github.io/helm-charts/open-service-broker-azure-v0.0.1.tgz
    version: v0.0.1
  osba-container-instances-demo:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4798738-05:00"
    description: A Helm chart for Kubernetes
    digest: b5f25ecf64d72644166835e48afda396b83acaff341bcb7c1e60efc12e547df6
    name: osba-container-instances-demo
    response:
    - https://azure-samples.github.io/helm-charts/osba-container-instances-demo-0.1.0.tgz
    version: 0.1.0
  osba-cosmos-mongodb-demo:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.489062-05:00"
    description: A Helm chart for Kubernetes
    digest: b581f67458cdf999ef0308786dc29f603bab6aadf5ad0a127f5fb1a816aef091
    name: osba-cosmos-mongodb-demo
    response:
    - https://azure-samples.github.io/helm-charts/osba-cosmos-mongodb-demo-0.1.0.tgz
    version: 0.1.0
  osba-mysql-demo:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.4958437-05:00"
    description: A Helm chart for Kubernetes
    digest: 034fe8960dcc4948ae28110622c6ea5b5439eb5ee35750899446da2455acf6ea
    name: osba-mysql-demo
    response:
    - https://azure-samples.github.io/helm-charts/osba-mysql-demo-0.1.0.tgz
    version: 0.1.0
  osba-storage-demo:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.5013751-05:00"
    description: A Helm chart for Kubernetes
    digest: d74b4c6a348b988e4dfa8fb2ad6873f533aeb0390ee5a1a88fedcee9fc2abc3a
    name: osba-storage-demo
    response:
    - https://azure-samples.github.io/helm-charts/osba-storage-demo-0.1.0.tgz
    version: 0.1.0
  osba-text-analytics-demo:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.5060898-05:00"
    description: A Helm chart for Kubernetes
    digest: d249a3f0926c24f448e36bc40211faee4b320927919e27c1aabe337065496db0
    name: osba-text-analytics-demo
    response:
    - https://azure-samples.github.io/helm-charts/osba-text-analytics-demo-0.1.0.tgz
    version: 0.1.0
  tweet-factory-operator:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.5104606-05:00"
    description: A Helm chart for Kubernetes
    digest: 8186cd27426d20d607f093f90ee05fe65be0e27fda7ecaeb6b98c1ee6204f11a
    name: tweet-factory-operator
    response:
    - https://azure-samples.github.io/helm-charts/tweet-factory-operator-0.1.0.tgz
    version: 0.1.0
  twitter-sentiment:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.5145249-05:00"
    description: A Helm chart for Kubernetes
    digest: 0a71fceec9bc133c4d2e7a9475e19478bb997cd10898803eaf68f3ce33ff271a
    name: twitter-sentiment
    response:
    - https://azure-samples.github.io/helm-charts/twitter-sentiment-0.1.0.tgz
    version: 0.1.0
  twitter-sentiment-cnab:
  - apiVersion: v1
    created: "2020-03-30T16:27:13.5192786-05:00"
    description: A Helm chart for Kubernetes
    digest: f6446a210a13c6f8a3b5d5feb7cd70115e3b00c8b445dc14c5186e5d2a56de2a
    name: twitter-sentiment-cnab
    response:
    - https://azure-samples.github.io/helm-charts/twitter-sentiment-cnab-0.1.0.tgz
    version: 0.1.0
generated: "2020-03-30T16:27:13.4275217-05:00"
`
