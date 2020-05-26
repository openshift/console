Feature: Create Application from Docker file
    As a user I want to create the application, component or service from Add options

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve
    And user is on a project namespace "AUT_MB_Docker_Demo"

@regression
Scenario Outline: Create a workload from Docker file card on Add page
   Given user is on "<form_name>" form with header name "<header_name>"
   When user type "<docker_git_url>" into the "Git Repo url" text box
   And select "<resource_type>" radio button in Resoruce type section
   And click "Create" button on Add page   
   Then user navigates to topology page
   And created workload is present in List View of topology page

Examples:
| form_name   | header_name             | docker_git_url            | resource_type   |
| Docker file | Import from Docker file | openshift/hello-openshift | Kantive Service |