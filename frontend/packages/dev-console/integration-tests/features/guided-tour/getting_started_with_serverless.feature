Feature: Getting started with serverless feature tour
	As a user, I want to take a guided tour of getting started with serverless feature   

Background:
    Given user is in developer perspective

@regression
Scenario: Starting tour from the +Add page 
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Getting started with Serverless" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Create the knative-serving and knative-eventing APIs" started
   And user sees steps to create the knative-serving and knative-eventing APIs
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the knative-serving API was installed successfully 
   And user selects Yes option
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close", "Back" and "View all tours"
   And user clicks "View all tours" button to see all tour options in background
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   And user sees completed label marked on Getting started with Serverless card
   Then user sees completed label marked on Getting started with Serverless card

@regression
Scenario: Starting tour from the Quick Starts page 
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Getting started with Serverless card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects Yes option
   And user clicks on next
   And user sees next step "Create the knative-serving and knative-eventing APIs" started
   And user sees steps to create the knative-serving and knative-eventing APIs
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the knative-serving API was installed successfully 
   And user selects Yes option
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close", "Back" and "View all tours"
   And user clicks "View all tours" button to see all tour options in background
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   And user sees completed label marked on Getting started with Serverless card
   Then user sees completed label marked on Getting started with Serverless card

@regression
Scenario: Trying 'No' option during the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Getting started with Serverless" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user selects No option
   Then user sees that the alert is saying "Try walking through the steps again to properly install Serverless Operator"

@regression
Scenario: Avoiding option during the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Getting started with Serverless card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user clicks on next
   And user sees next step "Create the knative-serving and knative-eventing APIs" started
   And user sees steps to create the knative-serving and knative-eventing APIs
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the knative-serving API was installed successfully 
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close" and "Back"
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Getting started with Serverless card

@regression
Scenario: Review the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user clicks on the "Start the tour" link on the Getting started with Serverless card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user clicks on next
   And user sees next step "Create the knative-serving and knative-eventing APIs" started
   And user sees steps to create the knative-serving and knative-eventing APIs
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the knative-serving API was installed successfully 
   And user clicks on next
   And user sees the security alert appearing on top saying "This tour has already been completed"
   And user sees Start serverless-application quick start link
   And user sees "Close" and "Back"
   And user clicks "Back" button to go back to previous "Check your work" alert 
   And user clicks on next
   And user clicks "close" button to close the sidepane back to tour page
   Then user sees completed label marked on Getting started with Serverless card

@regression
Scenario: Stopping and again resuming and restarting the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user sees different Quick Starts
   And user clicks on the "Start the tour" link on the Getting started with Serverless card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user closes the close button
   And user sees modal "Are you sure you want to leave the tour"
   And user clicks on Leave button
   And user sees Resume the tour and Restart the tour button on bottom Getting started with Serverless card
   And user clicks on Resume the tour
   Then user sees the tour will start from the step "Install Serverless Operator"

@regression
Scenario: Stopping and restarting the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "See all Quick Starts" link on the card
   And user clicks on the "Start the tour" link on the Getting started with Serverless card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on the Start tour option
   And user sees "Install Serverless Operator" step is started
   And user sees installing serverless steps
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user closes the close button
   And user sees modal "Are you sure you want to leave the tour"
   And user clicks on Leave button
   And user sees Resume the tour and Restart the tour button on bottom of Getting started with Serverless card
   And user clicks on the Restart the tour button
   Then user sees that the tour has started again

@regression
Scenario: Navigating between steps in the tour
   Given user is in +Add page 
   And user sees quick tour card 
   When user clicks on the "Getting started with Serverless" link on the card
   And user sees the tour will start as a sidescreen with close button
   And user sees the link to two steps present in the card
   And user clicks on second step "Create the knative-serving and knative-eventing APIs"
   And user sees step "Create the knative-serving and knative-eventing APIs" started
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the knative-serving API was installed successfully 
   And user clicks on first step "Install Serverless Operator"
   And user sees "Install Serverless Operator" step is started
   And user clicks on next
   And user sees an alert appears "Check your work" asking to verify that the Serverless Operator was successfully installed 
   And user clicks on next
   And user sees step "Create the knative-serving and knative-eventing APIs" with Check your work alert
   And user clicks on next
   Then user sees the security alert appearing on top saying "This tour has already been completed"
