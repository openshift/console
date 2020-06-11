Feature: Create Application from Docker file
    As a user I want to create the application, component or service from Add Flow Docker file

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve
    And open project namespace "AUT_AddFlow_Docker_Demo"
    And user is on Add pgae


@regression
Scenario: Dockerfile details after entering git repo url: A-06-TC01


@regression, @smoke
Scenario Outline: Create a workload from Docker file card on Add page : A-06-TC03
   Given user is on "Import from Docker file" page
   When user type "<docker_git_url>" into the "Git Repo url" text box
   And select "<resource_type>" radio button in Resoruce type section
   And click "Create" button on Add page   
   Then user navigates to topology page
   And created workload is present in List View of topology page

Examples:
| form_name   | header_name             | docker_git_url            | resource_type   |
| Docker file | Import from Docker file | openshift/hello-openshift | Kantive Service |


@regression
Scenario: Perform cancel operation on Dockerfile form should redirects the user to Add page : A-05-TC02


