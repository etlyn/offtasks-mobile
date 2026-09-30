@e2e @mobile @overview
# Feature code: 4
Feature: Mobile overview tabs
    Calendar, Notes, Goals, and Later should expose the device-first workspace.

    Background:
        Given the tester has opened the mobile app with or without an account
        And the drawer navigator is available

    # Scenario code: 4.1
    Scenario: Open the default Calendar tab
        When the workspace loads
        Then Calendar should open on today's date by default
        And the top bar should provide access to the navigation drawer and search

    # Scenario code: 4.2
    Scenario: Switch between Calendar, Notes, Goals, and Later tabs
        Given the overview is visible
        When the tester switches between Calendar, Notes, Goals, and Later
        Then the matching planner workspace should appear without an authentication gate

    # Scenario code: 4.3
    Scenario: Refresh a tab manually
        Given the tester is viewing Calendar or Later
        When the tester performs a pull to refresh gesture
        Then the task list should refresh without crashing or clearing the screen layout

    # Scenario code: 4.4
    Scenario: Show the empty-state action in an empty tab
        Given the active overview tab has no visible tasks
        When the tab finishes loading
        Then the list should show the no-tasks empty state
        And the header add action should remain available on today's Calendar or Later