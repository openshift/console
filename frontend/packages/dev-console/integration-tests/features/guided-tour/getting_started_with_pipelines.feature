Feature: Getting started with Pipelines tour
	As a user, I want to take a guided tour of getting started with pipelines feature   

Background:
    Given user is in developer perspective

@regression
Scenario: Starting tour from the +Add page 
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

@regression
Scenario: Starting tour from the Quick Starts page 
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

@regression
Scenario: Trying 'No' option during the tour
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

@regression
Scenario: Avoiding option during the tour
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

@regression
Scenario: Review the tour
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

@regression
Scenario: Stopping and again resuming the tour
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

@regression
Scenario: Stopping and restarting the tour
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

@regression
Scenario: Navigating between steps in the tour
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
