# Tmail

Tmail is a focused Windows desktop client for the Tanasuq Organization's Lark Mail workspace. It opens the official Lark Mail service in a dedicated application window with an isolated, persistent session.

## Security model

- Tmail never stores or ships passwords, OTP codes, cookies, or session tokens in the repository or installer.
- Authentication is handled by the official Lark sign-in pages.
- The remote renderer runs with Node.js integration disabled, context isolation enabled, and Chromium sandboxing enabled.
- In-app navigation is restricted to HTTPS pages on `larksuite.com` and its subdomains. External links open in the system browser.
- Notifications are permitted only for trusted Lark origins.

## Development

Requirements: Node.js 22 or later and Windows 10/11 for packaging.

```powershell
npm ci
npm run check
npm run dist:win
```

The unpacked application is written to `release/win-unpacked`, and the NSIS installer is written to `release/`.

## Automatic updates

Installed builds check the public GitHub Releases feed shortly after startup and every six hours. A newer stable release downloads in the background and installs automatically when Tmail closes. Release assets must include the NSIS installer, its block map, and `latest.yml`.

## First run

1. Install and open **Tmail**.
2. Complete the official Lark sign-in flow.
3. If the account uses a public mailbox, open **Other Accounts** and select `info@tanasuq.org`.
4. The isolated Tmail session is retained for subsequent launches until the user signs out or clears the app data.

## Limitations

Lark currently uses the same `/mail` URL for both the personal mailbox and a selected public mailbox. Tmail preserves the Lark session, but it does not inject scripts into Lark or alter mailbox permissions to force a public mailbox as the account identity.

The Windows installer is unsigned until an organization code-signing certificate is configured. Windows SmartScreen may therefore display an unknown-publisher warning.

