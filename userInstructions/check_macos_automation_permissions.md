# How to Check macOS Permissions for Browser Automation

When Cline uses the browser tool, macOS requires you to grant permission for the application running the commands (like Terminal or VS Code) to control your web browser (like Google Chrome). Here's how to check and enable those permissions:

1.  **Open System Settings:**
    *   Click the Apple logo () in the top-left corner of your screen.
    *   Select "System Settings..." from the dropdown menu.

2.  **Navigate to Privacy & Security:**
    *   In the System Settings window, scroll down the left-hand sidebar.
    *   Click on "Privacy & Security".

3.  **Check Automation Settings:**
    *   On the right side, scroll down until you find the "Automation" section.
    *   Click on "Automation".

4.  **Find Your Application:**
    *   You'll see a list of applications that have requested automation permissions. Look for the application you are using to interact with Cline. This is likely:
        *   "Terminal" (if you're running commands directly in the macOS Terminal)
        *   "iTerm" (if you use iTerm as your terminal)
        *   "Code" or "Visual Studio Code" (if you are running commands from the integrated terminal within VS Code)
    *   Click the arrow next to your application's name to expand its permissions, or it might show sub-items directly.

5.  **Enable Browser Control:**
    *   Under your application (Terminal, Code, etc.), look for an entry for "Google Chrome", "Chromium", or whichever browser Cline is trying to control.
    *   Make sure the checkbox next to the browser name is **checked (enabled)**.
    *   If it's unchecked, click the checkbox to enable it. You might be prompted for your password or Touch ID.

6.  **(Alternative) Check Accessibility Settings:**
    *   If you couldn't find the relevant entry under "Automation", go back to the main "Privacy & Security" settings page.
    *   Scroll down and click on "Accessibility".
    *   Look for your application (Terminal, Code, etc.) in the list on the right.
    *   Ensure the checkbox next to your application is **checked (enabled)**. This grants broader control, which sometimes covers automation actions. If it's unchecked, enable it (you might need to click the lock icon in the bottom-left and enter your password first).

7.  **Close System Settings:** Once you've confirmed the permissions are enabled, you can close the System Settings window.

Please follow these steps and let me know once you've confirmed the permissions are correctly set.
