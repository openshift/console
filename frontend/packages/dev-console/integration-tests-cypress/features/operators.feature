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
