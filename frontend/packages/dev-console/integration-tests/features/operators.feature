Feature: Operators
    As a user I want to install or uninstall the operators

Background:
   Given user is at administrator perspective


@regression
Scenario: OpenShift Pipeline operator subscription page : P-01-TC01
   Given user is at Operator Hub page with the header name "OperatorHub"
   When user searches for "OpenShift Pipelines Operator"
   And clicks OpenShift Pipelines Operator card on Operator Hub page
   And clicks install button present on the right side bar
   Then OpenShift Pipeline operator subscription page will be displayed


@regression, @smoke
Scenario: Install the Pipeline Operator from Operator Hub page : P-01-TC02
   Given user is at OpenShift Pipeline Operator subscription page
   When user installs the pipeline operator with default values
   Then user will see a modal with title "OpenShift Pipelines Operator"
   And user will see a View Operator button


@regression, @smoke
Scenario: Install the Serverless Operator from Operator Hub page : Kn-01-TC01, Kn-01-TC02
   Given user is at OpenShift Serverless Operator subscription page
   When user installs the Serverless operator with default values
   Then user will see a modal with title "OpenShift Serverless Operator"
   And user will see a View Operator button
   And user will see serverless option on left side navigation menu


@regression, @smoke
Scenario: Install the knative eventing operator : Kn-07-TC01, Kn-07-TC02
   Given cluster is installed with kantive serverless operator
   And user is on the knative-eventing namespace
   When user navigates to installed operators page in Admin perspecitve
   And clicks kantive eventing provided api pressent in kantive serverless operator
   And click Create Kantive Eventing button present in kantive Eventing tab
   And click on create button
   Then Event sources card display in Add page in dev perspecitve


@regression, @smoke
Scenario: Install the knative apache camel operator : Kn-08-TC01
   Given cluster is installed with knative serverless and eventing operators
   And user is at Operator Hub page with the header name "OperatorHub"
   When user search and installs the kantive Camel operator with default values
   Then user will see a modal with title "Knative Apache Camel Operator"
   And user will see a View Operator button


@regression, @smoke, @manual
Scenario: Install the dynamic event operator : Kn-09-TC01, Kn-09-TC02
   Given cluster is installed with kantive serverless operator
   When user executes commands from cli as "kubectl apply -f https://github.com/knative/eventing-contrib/releases/download/v0.14.1/github.yaml"
   And user navigates to Add page
   And user clicks on "Event sources" card
   Then user will be redirected to Event Sources page
   And GitHub Source is displayed in enters section


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
    And clicks on the OpenShift Virtualization Operator card
    And clicks install button present on the right side bar
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
   And clicks on Unistall button present in popup with header message Uninstall Operator?
   Then user will be redirected to Installed operators page
   And Installed operators page will not contain "OpenShift Pipelines Operator"


Scenario: Uninstall the Knative serverless operator from Operator Hub page 
   Given user is at OpenShift Serverless Operator subscription page
