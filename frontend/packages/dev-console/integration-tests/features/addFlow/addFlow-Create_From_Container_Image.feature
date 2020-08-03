Feature: Create Application from Container image file
    As a user I want to create the application, component or service from Add Flow Container image

Background:
    Given user is at dev perspecitve
    And open project namespace "aut-addflow-containerImage"
    And user is at Add page


@regression
Scenario: Deploy image page details on entering external registry image name : A-05-TC01
   Given user is at Deploy Image page
   When user types Image name from external registry as "openshift/hello-openshift"
   Then git url gets Validated
   And Application name displays as "hello-openshift-app"
   And Name displays as "hello-openshift"
   And advanced option Create a route to the application is selected

 
@regression, @smoke
Scenario: Create the container image with extrenal registry : A-05-TC02
   Given user is at Deploy Image page
   When user types Image name from external registry as "openshift/hello-openshift"
   And user clicks Create button on Deploy Image page
   Then user redirects to Topology page
   And node is displayed with name "hello-openshift"


@regression
Scenario: Create the container image with internal registry : A-05-TC03
   Given user is at Deploy Image page
   When user selects Image stream tag from internal registry 
   And user selects Projects as "openshift" from internal registry
   And selects Image Stream as "golang" from internal registry
   And selects tag as "latest" from internal registry
   And user clicks Create button on Deploy Image page
   Then page redirects to topology page
   And node is displayed with name "golang-app"


@regression
Scenario: Perform cancel operation on Container image form should redirects the user to Add page : A-05-TC04 
   Given user is at Deploy Image page
   When user selects Image stream tag from internal registry 
   And user selects Projects as "openshift" from internal registry
   And selects Image Stream as "golang" from internal registry
   And selects tag as "latest" from internal registry
   And user clicks Cancel button on Deploy Image page
   Then user redirects to Add page