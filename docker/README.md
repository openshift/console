# OKD local docker container

When using Native Kubernetes, some projects specifically in the RedHat ecosystem have made architectural decisions to tie their UIs more closely to okd. To enable the non okd cluster runer to adapt this docker container with everything needed to run the okd bridge has been developed.

## Quick Start
```
#Not sure if RedHat will want to host this in the future but until then you can pull the container from my personal github
docker pull mjschmidt/okd-ui:release-4.6
docker run -it \
           -v ~/.kube/config:/config \
           -v /root/.minikube/:/root/.minikube/  \
           -p 9000:9000 \
           --name okd-ui mjschmidt/okd-ui:release-4.6 bash;
```

Once you have your container running run the startup.sh
```
./startup.sh
```

You will then be able to access the okd-ui via [localhost:9000](http://localhost:9000)

## Building the Container
```
# I have included the Dockerfile used to build this container in this folde
docker build -t [your_image_name:tag] .
```

## Follow on Work

[ ] Create Small Kubernetes Deployment to deploy okd front end
[ ] Create Small Helm Chart to deploy okd front end

## Adding the Operator Dashboards

Follow the directions on [this page](https://github.com/operator-framework/operator-marketplace)

You will need Operator Lifecycle Manager also installed and [found here](https://github.com/operator-framework/operator-lifecycle-manager/blob/master/doc/install/install.md#install-the-latest-released-version-of-olm-for-upstream-kubernetes)
