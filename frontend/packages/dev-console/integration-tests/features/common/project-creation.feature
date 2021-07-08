Feature: OpenShift Namespaces
              As a user, I want to create the namespace to group and isolate related objects

        @smoke
        Scenario: Create the namespace: : C-02-TC01
            Given user is at developer perspective
             When user selects the Create Project option from Projects dropdown on top navigation bar
              And user enters project name as "aut-project" in Create Project modal
              And user clicks Create button present in Create Project modal
             Then modal will get closed
