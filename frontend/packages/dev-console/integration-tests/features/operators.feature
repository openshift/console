Feature: Operators
    As a user I want to install or uninstall the operators

Background:
   Given user is at administrator perspective


@regression
Scenario: OpenShift Pipeline operator subscription page : P-01-TC01
   Given user is at Operator Hub page with the header name "OperatorHub"
   When user searches for "OpenShift Pipelines Operator"
   And user clicks OpenShift Pipelines Operator card on Operator Hub page
   And user clicks install button present on the right side bar
   Then OpenShift Pipeline operator subscription page will be displayed


@regression, @smoke
Scenario: Install the Pipeline Operator from Operator Hub page : P-01-TC02
   Given user executed command "oc apply -f https://gist.githubusercontent.com/nikhil-thomas/f6069b00b0e3b0359ae1cbdb929a04d6/raw/7b19be0c52355d041bf3d6a883db06b578f15f0d/openshift-pipelines-early-release-catalog-source.yaml"
   And user is at OpenShift Pipeline Operator subscription page
   When user installs the pipeline operator with default values
   Then user will see a modal with title "OpenShift Pipelines Operator"
   And user will see a View Operator button


@regression, @smoke
Scenario: Install the Serverless Operator from Operator Hub page : Kn-01-TC01, Kn-01-TC02
   Given user is at OpenShift Serverless Operator subscription page
   When user installs the OpenShift Serverless operator with default values
   Then user will see a modal with title "OpenShift Serverless Operator"
   And user will see a View Operator button
   And user will see serverless option on left side navigation menu


@regression, @smoke
Scenario: Install the knative eventing operator : Kn-07-TC01, Kn-07-TC02
   Given user has installed OpenShift Serverless Operator
   And user is on the knative-eventing namespace
   When user navigates to installed operators page in Admin perspecitve
   And user clicks knative eventing provided api pressent in knative serverless operator
   And user clicks Create knative Eventing button present in knative Eventing tab
   And user clicks create button
   Then Event sources card display in Add page in dev perspecitve


@regression, @smoke
Scenario: Install the knative apache camel operator : Kn-08-TC01
   Given user has installed OpenShift Serverless and eventing operator
   And user is at Operator Hub page with the header name "OperatorHub"
   When user search and installs the knative Camel operator with default values
   Then user will see a modal with title "knative Apache Camel Operator"
   And user will see a View Operator button


@regression, @smoke
Scenario: Install the dynamic event operator : Kn-09-TC01, Kn-09-TC02
   Given user has installed OpenShift Serverless Operator
   When user executes commands from cli as "kubectl apply -f https://github.com/knative/eventing-contrib/releases/download/v0.14.1/github.yaml"
   And user navigates to Add page
   And user clicks on "Event source" card
   Then user will be redirected to Event Sources page
   And GitHub Source is displayed in types section


@regression, @smoke
Scenario: Install the Che Operator from Operator Hub page : CRW-01-TC01
   Given user is at Eclipse che Operator subscription page
   When user installs the Eclipse che operator with default values
   Then user will see a modal with title "Eclipse Che"
   And user will see a View Operator button


@regression, @smoke
Scenario: Install OpenShift Virtualization Operator: VM-01-TC01
    Given user is at Operator Hub page with the header name "OperatorHub" 
    And user has selected namespace "openshift-cnv"
    When user searches for "OpenShift Virtualization"
    And user clicks on the OpenShift Virtualization Operator card
    And user clicks install button present on the right side bar
    And user installs the OpenShift Virtualization operator with default values
    Then user will see a modal with title "OpenShift Virtualization"
    And user will see a View Operator button


@regression, @smoke
Scenario: Create HyperConverged Cluster: VM-01-TC02
    Given user has selected namespace "openshift-cnv"
    And user is at Installed Operator page
    When user clicks on OpenShift Virtualization Operator
    And user clicks on CNV Operator Deployment tab
    And user clicks on the Create HyperConverged Cluster button
    And user clicks on Create button
    Then user will see a HyperConverged Cluster created
    And user will see Virtualization item under Workloads


@regression
Scenario: Uninstall the Pipeline Operator from Operator Hub page : P-013-TC01, P-013-TC02
   Given user is at Operator Hub page with the header name "OperatorHub"
   When user uninstalls the pipeline operator from right side bar
   And user clicks unistall button present in modal with header message Uninstall Operator?
   Then user will be redirected to Installed operators page
   And Installed operators page will not contain "OpenShift Pipelines Operator"


Scenario: Uninstall the knative serverless operator from Operator Hub page 
   Given user is at OpenShift Serverless Operator subscription page
