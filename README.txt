REPAIRFLOW — SEPARATE HTML, CSS AND JAVASCRIPT FILES
====================================================

This folder keeps the three main web technologies in separate files so they are easier to understand and edit.

FILES
-----
1. index.html
   - HTML = page structure and content.
   - Contains the headings, forms, buttons, fields and ticket-list containers.
   - It links to style.css and app.js.

2. style.css
   - CSS = visual design.
   - Controls colours, fonts, spacing, buttons, cards, layout and mobile responsiveness.

3. app.js
   - JavaScript = behaviour and logic.
   - Connects to Supabase, handles sign-in/sign-up, creates tickets, displays tickets, edits tickets, handles customer estimate approval/rejection, and lets Admin accept/reject new requests with a reason.
   - Supabase Project URL and the browser-safe publishable key are preserved in this file.

4. Request_Rejection_Migration_already_run.sql
   - Reference copy of the SQL migration that adds request_status and request_rejection_reason.
   - You already ran this migration successfully. Do not run it again unless you intentionally need to reset/reapply the database setup.

IMPORTANT NOTES
---------------
- Keep index.html, style.css and app.js together in the SAME folder. Do not rename them unless you also update the links in index.html.
- The estimated_cost field is not sent in the ticket payload; the database calculates it.
- Customer-submitted tickets start with request_status = Pending (database default).
- Admin-created tickets are marked Accepted automatically.
- Admin can Accept Request or Reject Request. A rejection reason is required and is shown to the customer.
- Estimate approval/rejection is separate and becomes available after the request is accepted.
- Never put a Supabase secret/service_role key in browser code.

HOW TO OPEN / TEST LOCALLY
--------------------------
1. Extract the ZIP to a folder.
2. Make sure all three files (index.html, style.css, app.js) are in the same folder.
3. Double-click index.html to open it in a browser.

HOW TO DEPLOY TO NETLIFY
------------------------
1. Extract this ZIP.
2. Open your Netlify RepairFlow site > Deploys.
3. Upload the extracted folder that contains index.html, style.css and app.js directly at its top level.
4. Wait for the deployment status to become Published.
5. Open the live production URL and press Ctrl+F5.

WHICH FILE SHOULD I EDIT?
-------------------------
- Change text, fields or page structure: index.html
- Change colours, fonts, spacing or layout: style.css
- Change how buttons, login, tickets or Supabase work: app.js
