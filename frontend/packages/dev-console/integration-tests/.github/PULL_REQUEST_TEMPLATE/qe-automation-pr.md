**Description:**
<!-- PR description-->

**Jira Id:**
<!-- For e.g User story Jira Id : https://issues.redhat.com/browse/ODC-XXX -->
<!-- For Epic related gherkin scripts, e.g Epic Jira Id : https://issues.redhat.com/browse/ODC-XXX -->

**Pre-conditions/setup:**
<!-- If any setup required while performing epic validation [which is not mentioned in Back ground section], mention the details -->

**Checks for approving Epic scenarios Automation PR:**
<!-- Below criteria should met before approving the pr, use [x] -->
- [ ] Execute the @to-do tagged gherkin scripts manually
- [ ] Convert the @to-do gherkin scripts to cypress automation scripts
- [ ] Once scripts are automated, replace tag @to-do with @epic-number
- [ ] Execute the scripts in Remote cluster

**Refactoring criteria for approving Automation PR:**
<!-- Below criteria should met before approving the pr, use [x] -->
- [ ] update the test cases count in [Automation status confluence Report](https://docs.jboss.org/display/ODC/Automation+Status+Report)

**Execution Commands:**
Example:
```
    export NO_HEADLESS=true && export CHROME_VERSION=$(/usr/bin/google-chrome-stable --version)
    BRIDGE_KUBEADMIN_PASSWORD=YH3jN-PRFT2-Q429c-5KQDr
    BRIDGE_BASE_ADDRESS=https://console-openshift-console.apps.dev-svc-4.8-042801.devcluster.openshift.com
    export BRIDGE_KUBEADMIN_PASSWORD
    export BRIDGE_BASE_ADDRESS
    oc login -u kubeadmin -p $BRIDGE_KUBEADMIN_PASSWORD
    oc apply -f ./frontend/integration-tests/data/htpasswd-secret.yaml
    oc patch oauths cluster --patch "$(cat ./frontend/integration-tests/data/patch-htpasswd.yaml)" --type=merge
    ./test-cypress.sh -p dev-console
```

**Screen shots**:
<!--   -->

**Browser conformance**:
<!-- To mark tested browsers, use [x] -->
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
