@guided-tour
Feature: Getting started with Pipelines tour
              As a user, I want to take a guided tour of getting started with pipelines feature

        Background:
            Given user is at developer perspective


        @regression @to-do
        Scenario: Starting tour from the +Add page: GT-03-TC01
            Given user is at Add page
              And user sees quick tour card
             When user clicks on the "Getting started with Pipelines" link on the card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user selects Yes option
              And user clicks on next
              And user sees next step "Explore your application in topology" started
              And user sees steps install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user selects Yes option
              And user clicks on next
              And user sees next step "Explore your pipeline run" started
              And user sees steps to install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user selects Yes option
              And user clicks on next
              And user sees the security alert appearing on top saying "This tour has already been completed"
              And user sees Start install-app-and-associate-pipeline quick start link
              And user sees "Close", "Back" and "View all tours"
              And user clicks "View all tours" button to see all tour options in background
              And user clicks "Back" button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees completed label marked on Getting started with Pipelines card


        @regression @to-do
        Scenario: Starting tour from the Quick Starts page: GT-03-TC02
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "See all Quick Starts" link on the card
              And user sees different Quick Starts
              And user clicks on the "Start the tour" link on the Getting started with Pipelines card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user selects Yes option
              And user clicks on next
              And user sees next step "Explore your application in topology" started
              And user sees steps install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user selects Yes option
              And user clicks on next
              And user sees next step "Explore your pipeline run" started
              And user sees steps to install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user selects Yes option
              And user clicks on next
              And user sees the security alert appearing on top saying "This tour has already been completed"
              And user sees Start install-app-and-associate-pipeline quick start link
              And user sees "Close", "Back" and "View all tours"
              And user clicks "View all tours" button to see all tour options in background
              And user clicks "Back" button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees completed label marked on Getting started with Pipelines card


        @regression @to-do
        Scenario: Trying 'No' option during the tour: GT-03-TC03
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "Getting started with Pipelines" link on the card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user selects No option
             Then user sees that the alert is saying "Try walking through the steps again to properly install Serverless Operator"


        @regression @to-do
        Scenario: Avoiding option during the tour: GT-03-TC04
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "See all Quick Starts" link on the card
              And user sees different Quick Starts
              And user clicks on the "Start the tour" link on the Getting started with Pipelines card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user clicks on next
              And user sees next step "Explore your application in topology" started
              And user sees steps install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user clicks on next
              And user sees the security alert appearing on top saying "This tour has already been completed"
              And user sees Start serverless-application quick start link
              And user sees "Close" and "Back"
              And user clicks "Back" button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees completed label marked on Getting started with Pipelines card


        @regression @to-do
        Scenario: Review the tour: GT-03-TC05
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "See all Quick Starts" link on the card
              And user clicks on the "Start the tour" link on the Getting started with Pipelines card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user clicks on next
              And user sees next step "Explore your application in topology" started
              And user sees steps install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user clicks on next
              And user sees the security alert appearing on top saying "This tour has already been completed"
              And user sees Start serverless-application quick start link
              And user sees "Close" and "Back"
              And user clicks "Back" button to go back to previous "Check your work" alert
              And user clicks on next
              And user clicks "close" button to close the sidepane back to tour page
             Then user sees completed label marked on Getting started with Pipelines card


        @regression @to-do
        Scenario: Stopping and again resuming the tour: GT-03-TC06
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "See all Quick Starts" link on the card
              And user sees different Quick Starts
              And user clicks on the "Start the tour" link on the Getting started with Pipelines card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user closes the close button
              And user sees modal "Are you sure you want to leave the tour"
              And user clicks on Leave button
              And user sees Resume the tour and Restart the tour button on bottom Getting started with Pipelines card
              And user clicks on Resume the tour
             Then user sees the tour will start from the step "Create an application from git"


        @regression @to-do
        Scenario: Stopping and restarting the tour: GT-03-TC07
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "See all Quick Starts" link on the card
              And user clicks on the "Start the tour" link on the Getting started with Pipelines card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on the Start tour option
              And user sees "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user closes the close button
              And user sees modal "Are you sure you want to leave the tour"
              And user clicks on Leave button
              And user sees Resume the tour and Restart the tour button on bottom of Getting started with Pipelines card
              And user clicks on the Restart the tour button
             Then user sees that the tour has started again


        @regression @to-do
        Scenario: Navigating between steps in the tour: GT-03-TC08
            Given user is in +Add page
              And user sees quick tour card
             When user clicks on the "Getting started with Pipelines card" link on the card
              And user sees the tour will start as a sidescreen with close button
              And user sees the link to three steps present in the card
              And user clicks on third step "Explore your pipeline run"
              And user sees steps to install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user clicks on second step "Explore your application in topology"
              And user sees steps to install the Pipelines Operator
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that install the Pipelines Operator was successfully installed
              And user clicks on first step "Create an application from git" step is started
              And user sees steps to create an application
              And user clicks on next
              And user sees an alert appears "Check your work" asking to verify that the Pipelines Operator was successfully installed
              And user clicks on next
              And user sees step "Explore your application in topology" with Check your work alert
              And user clicks on next
              And user sees step "Explore your pipeline run" with Check your work alert
              And user clicks on next
             Then user sees the security alert appearing on top saying "This tour has already been completed"
