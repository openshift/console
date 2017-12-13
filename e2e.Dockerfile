FROM node:8

# Install Chrome for installer gui tests
# Use Chrome beta because v60 or higher is needed for headless mode
RUN wget --quiet -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'

RUN apt-get update \
    && apt-get install --no-install-recommends -y -q \
    curl ca-certificates google-chrome-beta libnss3-tools

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.8.2/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

COPY . /opt/bridge/
WORKDIR /opt/bridge/frontend
RUN ./node_modules/.bin/webdriver-manager update
CMD ./test-e2e.sh
