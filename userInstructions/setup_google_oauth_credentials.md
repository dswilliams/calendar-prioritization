# Setting up Google OAuth 2.0 Credentials

To connect to the Google Calendar API, you need to create a project in the Google Cloud Console and obtain OAuth 2.0 credentials. Here's how:

1.  **Go to the Google Cloud Console:**
    *   Open your web browser and navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/).
    *   Sign in with your Google account.

2.  **Create a New Project (if you don't have one):**
    *   Click on the project selection dropdown at the top of the page (it might say "Select a project").
    *   Click "New Project".
    *   Enter a project name (e.g., "Calendar Prioritizer").
    *   Select an organization (if applicable).
    *   Click "Create".

3.  **Enable the Google Calendar API:**
    *   In the Cloud Console, navigate to "APIs & Services" > "Library" (or search for "Calendar API").
    *   Search for "Google Calendar API" and click on it.
    *   Click "Enable".

4.  **Configure the OAuth Consent Screen:**
    *   In the Cloud Console, navigate to "APIs & Services" > "OAuth consent screen".
    *   Select the "External" user type.
    *   Click "Create".
    *   Fill out the required information:
        *   **App name:** (e.g., "Calendar Prioritizer")
        *   **User support email:** Select your email address.
        *   **Developer contact information:** Enter your email address.
    *   Click "Save and Continue".
    *   On the "Scopes" screen, you might see a button labeled "ADD OR REMOVE SCOPES". Click that button.
        *   A panel will appear on the right side of the screen. In the "Manually add scopes" section, type "calendar" and press Enter.
        *   From the list of scopes that appears, select the checkbox next to "https://www.googleapis.com/auth/calendar.readonly" (Read-only access to your calendars).
        *   Click "Update".
    *   Click "Save and Continue".
    *   On the "Test users" screen, add your email address as a test user.
        *   Click "Save and Continue".
        *   Review the summary and click "Back to Dashboard".

5.  **Create OAuth 2.0 Credentials:**
    *   In the Cloud Console, navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" and select "OAuth client ID".
    *   Select "Web application" as the application type.
    *   Enter a name for the credential (e.g., "Calendar Prioritizer Web Client").
    *   Under "Authorized JavaScript origins", enter `http://localhost:5001` (or the port your backend is running on).
    *   Under "Authorized redirect URIs", enter `http://localhost:5001/auth/google/callback`. **This is crucial and must match exactly!**
    *   Click "Create".

6.  **Update Frontend Redirect URI:**
    *   In the `frontend/src/App.jsx` file, update the `href` attribute of the "Connect to Google Calendar" link to `http://localhost:5001/auth/google`.

7.  **Obtain Client ID and Client Secret:**
    *   A dialog box will appear with your "Client ID" and "Client Secret". **Copy these values down carefully!**

8.  **Set Environment Variables:**
    *   You need to set these values as environment variables on your system. How you do this depends on your operating system and environment. Here are a few common methods:

        *   **macOS/Linux (in your terminal):**
            ```bash
            export GOOGLE_CLIENT_ID="980348550877-2etdnl8cdd08a4rsueq75qrvvsi2e0as.apps.googleusercontent.com"
            export GOOGLE_CLIENT_SECRET="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"
            ```
            (Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with the actual values.)
            **Note:** These settings will only last for the current terminal session. To make them permanent, you'll need to add these lines to your shell configuration file (e.g., `~/.bashrc`, `~/.zshrc`).

        *   **Windows (Command Prompt):**
            ```batch
            set GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
            set GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
            ```
            (Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with the actual values.)
            **Note:** These settings will only last for the current command prompt session. To make them permanent, use the `setx` command or set them in the System Properties.

        *   **Using `.env` files (with a package like `dotenv`):**
            *   Create a file named `.env` in the root directory of your project.
            *   Add the following lines to the `.env` file:
                ```
                GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
                GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
                ```
            *   **Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual Client ID and Client Secret from the Google Cloud Console.**
            *   You'll need to install the `dotenv` package (`npm install dotenv`) and load the environment variables in your `backend/index.js` file.
            *   If you are still having trouble loading the environment variables, the most reliable approach is to set them directly in your shell configuration file (e.g., `~/.zshrc` or `~/.bashrc`):
                ```bash
                export GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"
                export GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"
                ```
                **Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual values, and then restart your terminal or source the configuration file (e.g., `source ~/.zshrc`).**

*   **It seems your default shell is `bash`, but you've set the environment variables in `~/.zshrc`. To ensure the backend can access these variables, you need to add them to `~/.bashrc` (or `~/.bash_profile` if `~/.bashrc` doesn't exist) as well:**
    ```bash
    echo 'export GOOGLE_CLIENT_ID="YOUR_CLIENT_ID"' >> ~/.bashrc
    echo 'export GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET"' >> ~/.bashrc
    ```
    **(Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual values.) After adding these lines, restart your terminal or source the configuration file (e.g., `source ~/.bashrc`).**

**Important Notes:**

*   **Keep your Client Secret secure!** Do not commit it to your code repository.
*   **The redirect URI must match exactly** the one you configured in the Google Cloud Console.
*   **For production deployments**, you'll need to use a proper domain name and HTTPS.
*   **If you are still encountering a 403 error after authenticating with Google, try disabling "Preload pages for faster browsing and searching" in Chrome's settings:**
    1.  Open Chrome's settings (chrome://settings/).
    2.  Search for "Preload pages".
    3.  Disable the "Preload pages for faster browsing and searching" setting.
    4.  Restart Chrome.

Once you've completed these steps, the backend should be able to authenticate with Google Calendar. If you are still having issues, please ensure that you have restarted your terminal or sourced your shell configuration file after setting the environment variables.

</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.

<environment_details>
# VSCode Visible Files
../../../../backend/index.js
../../../../backend/index.js
../../../../backend/package-lock.json
../../../../backend/package-lock.json
userInstructions/setup_google_oauth_credentials.md

# VSCode Open Tabs
../../Documents/Cline/Rules/clinerules.txt
frontend/tailwind.config.js
frontend/vite.config.js
frontend/package.json
userInstructions/check_macos_automation_permissions.md
frontend/postcss.config.cjs
cline_docs/techStack.md
.env
frontend/src/App.jsx
userInstructions/setup_google_oauth_credentials.md
backend/index.js
cline_docs/currentTask.md
cline_docs/codebaseSummary.md

# Current Time
5/3/2025, 12:37:00 AM (America/Toronto, UTC-4:00)

# Context Window Usage
676,483 / 1,048.576K tokens used (64%)

# Current Mode
ACT MODE
</environment_details>
