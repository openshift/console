Feature: Create Application from Container image file
    As a user I want to create the application, component or service from Add Flow Container image

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve
    And open project namespace "AUT_AddFlow_Container_Image_Demo"


@regression
Scenario: Deploy image page details on entering external registry image name : A-05-TC01
   Given user is on "Deploy Image" page
   When user types "Image name from external registry" as "openshift/hello-openshift"
   Then "Validated" message should be displayed
   And Application name should display as "hello-openshift-app"
   And Name should display as "hello-openshift"
   And advanced option "Create a route to the application" is selected

 
@regression, @smoke
Scenario: Create the container image with extrenal registry : A-05-TC02
   Given user is on "Deploy Image" page
   When user types "Image name from external registry" as "openshift/hello-openshift"
   And user clicks Create button on Deploy Image page
   Then page redirects to topology page
   And node is displayed with name "hello-openshift"


@regression
Scenario: Create the container image with internal registry : A-05-TC03


@regression
Scenario: Perform cancel operation on Container image form should redirects the user to Add page : A-05-TC04 