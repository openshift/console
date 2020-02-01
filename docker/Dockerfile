FROM centos:7

RUN curl -sL https://rpm.nodesource.com/setup_10.x | bash -
RUN curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo
RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl
RUN chmod +x ./kubectl
RUN mv ./kubectl /usr/local/bin/kubectl
RUN yum install -y \
                     git \
                     nodejs \
                     yarn \
                     gcc \
                     epel-release
RUN yum install -y   jq
RUN echo && git --version && echo && node --version && echo && yarn --version && echo && kubectl && echo
RUN curl -O https://dl.google.com/go/go1.13.4.linux-amd64.tar.gz
RUN tar -xvf go1.13.4.linux-amd64.tar.gz
RUN mv go /usr/local/
RUN mkdir -p ~/go/src/hello && cd ~/go/src/
RUN export PATH=$PATH:/usr/local/go/bin
ENV PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/go/bin
RUN echo export PATH=$PATH:/usr/local/go/bin >> ~/.bashrc
RUN source ~/.bashrc
RUN echo && echo && /usr/local/go/bin/go version && echo && echo
RUN git clone https://github.com/openshift/console.git
WORKDIR /console
RUN git checkout release-4.6
RUN ./build.sh
ENV KUBECONFIG=/config
RUN echo source /console/contrib/environment.sh > /console/startup.sh && echo /console/bin/bridge >> /console/startup.sh
RUN chmod +x /console/startup.sh
