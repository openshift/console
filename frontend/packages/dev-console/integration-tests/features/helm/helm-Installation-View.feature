Feature: Helm Chart Installation View
    As a user, I should be able switch between YAML and Form view to install Helm Chart


    Background:
        Given user is at developer perspective
        And user has created or selected namespace "aut-helm-installation-view"


    @regression
    Scenario: Grouping of Helm multiple chart versions together in developer catalog
        Given user is at Add page
        When user selects "From Catalog" card from add page
        And user selects "Helm Charts" option from Type section
        And user searches 'Nodejs Ex K v0.2.1' card from catalog page
        And user selects "Nodejs Ex K v0.2.1" helm chart from catalog page
        And user will see the information of all the chart versions together
        And user clicks on the Install Helm Chart button on side bar
        Then user will see the chart version dropdown


    @regression, @smoke, @manual
    Scenario: Switch from YAML to Form view
        Given user is at the Install Helm Chart page
        When user selects the YAML View
        And user does some changes in the yaml for helm chart
        And user selects the Form view
        And user comes back to YAML view
        Then user will see that the data hasn't lost


    @regression, @smoke, @manual
    Scenario: Switch from Form to YAML view
        Given user is at the Install Helm Chart page
        When user selects the Form View
        And user will see values and choices are pulled from JSON Schema associated with chart
        And user does some changes in the form for helm chart
        And user selects the YAML view
        And user comes back to Form view
        Then user will see that the data hasn't lost
