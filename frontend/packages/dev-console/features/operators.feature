Feature: Operators
    As a user I want to install or uninstall the operators

Background:
    Given user logged into the openshift application
    And user is at admin perspecitve


@regression, @smoke
Scenario: OpenShift Pipeline operator subscription page : P-01-TC01
   Given user is at Operator Hub page with the header name "Operator Hub"
   When user searches for "OpenShift Pipelines Operator"
   And clicks "OpenShift Pipelines Operator" card on Operator Hub page
   And click install button present on the right side pane
   Then OpenShift Pipeline operator will be displayed


@regression, @smoke
Scenario: Install the Pipeline Operator from Operator Hub page : P-01-TC02
   Given user is at OpenShift Pipeline Operator subscription page
   When user installs the pipeline operator with default values
   Then page redirects to Installed operators
   And page will contain OpenShift Pipeline Operator 


@regression, @smoke
Scenario: Uninstall the Pipeline Operator from Operator Hub page : P-013-TC01, P-013-TC02
   Given user is at OpenShift Pipeline Operator subscription page
   When user uninstalls the pipeline operator from right side pane
   And clicks on Unistall button present in popup with header message "Uninstall Operator?"
   Then page redirects to Installed operators
   And OpenShift Pipeline Operator will not be displayed
   And Pipelines will not be displayed in Dev perspective


@regression, @smoke
Scenario: Install the Serverless Operator from Operator Hub page : Kn-01-TC01, Kn-01-TC02
   Given user is at OpenShift Serverless Operator subscription page
   When user installs the Serverless operator with default values
   Then page redirects to Installed operators
   And page will contain openShift serverless operator
   And serverless tab displays in navigation menu of admin page


@regression, @smoke
Scenario: Install the knative eventing operator : Kn-07-TC01, Kn-07-TC02
   Given cluster is installed with kantive serverless operator
   And user is on the knative-eventing namespace
   When user navigates to installed operators page in Admin perspecitve
   And clicks kantive eventing provided api pressent in kantive serverless operator
   And click Create Kantive Eventing button present in kantive Eventing tab
   And click on create button
   Then Event sources card display in +Add page in dev perspecitve


@regression, @smoke
Scenario: Install the knative apache camel operator : Kn-08-TC01
   Given cluster is installed with knative serverless and eventing operators
   And user is at operator hub page
   When user search and installs the kantive Camel operator with default values
   Then user redirects to Installed operators page
   And page will contain knative apache camel operator


@regression, @smoke, @manual
Scenario: Install the dynamic event operator : Kn-09-TC01, Kn-09-TC02
   Given cluster is installed with knative serverless operator
   And user logged into the cluster via cli
   When user executes "kubectl apply -f https://github.com/knative/eventing-contrib/releases/download/v0.14.1/github.yaml"
   And user navigates to Add page
   And user clicks on Event sources page
   Then user redirects to page with header "Event Sources"
   And GitHub Source is displayed in Types section


Scenario: Uninstall the Knative serverless operator from Operator Hub page 
   Given user is at OpenShift Serverless Operator subscription page
