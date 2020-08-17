Feature: Operators
    As a user I want to install or uninstall the operators

Background:
   Given user is at admin perspecitve


@regression
Scenario: OpenShift Pipeline operator subscription page : P-01-TC01
   Given user is at Operator Hub page with the header name "OperatorHub"
   When user searches for "OpenShift Pipelines Operator"
   And clicks OpenShift Pipelines Operator card on Operator Hub page
   And click install button present on the right side pane
   Then OpenShift Pipeline operator subscription page will be displayed


@regression, @smoke
Scenario: Install the Pipeline Operator from Operator Hub page : P-01-TC02
   Given user is at OpenShift Pipeline Operator subscription page
   When user installs the pipeline operator with default values
   Then user will see a modal with title "OpenShift Pipelines Operator"
   And user will see a View Operator button


@regression
Scenario: Uninstall the Pipeline Operator from Operator Hub page : P-013-TC01, P-013-TC02
   Given user is at Operator Hub page with the header name "OperatorHub"
   When user uninstalls the pipeline operator from right side pane
   And clicks on Unistall button present in popup with header message Uninstall Operator?
   Then user redirects to Installed operators page
   And Installed operators page will not contain "OpenShift Pipelines Operator"


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
   And user logged into the cluster via cli
   When user executes "kubectl apply -f https://github.com/knative/eventing-contrib/releases/download/v0.14.1/github.yaml"
   And user navigates to Add page
   And user clicks on Event sources page
   Then user redirects to Event Sources page
   And GitHub Source is displayed in Types section


Scenario: Uninstall the Knative serverless operator from Operator Hub page 
   Given user is at OpenShift Serverless Operator subscription page


@regression, @smoke
Scenario: Install the Che Operator from Operator Hub page : CRW-01-TC01
   Given user is at Eclipse che Operator subscription page
   When user installs the Eclipse che operator with default values
   Then user will see a modal with title "Eclipse Che"
   And user will see a View Operator button
