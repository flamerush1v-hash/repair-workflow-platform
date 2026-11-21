<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#102b2a">
<title>RepairFlow — Repair Operations</title>
<!-- CSS: visual design is kept in style.css -->
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="top">
  <div class="brand"><div class="logo">↻</div><div><h1>RepairFlow</h1><p>Repair operations workspace</p></div></div>
  <div class="top-right"><span class="user-chip" id="userLabel">Secure multi-user workspace</span><button id="signOutBtn" class="btn secondary hidden" type="button">Sign out</button></div>
</header>
<main class="wrap">
  <section id="authView" class="auth">
    <div class="panel">
      <div class="panel-head"><div><div class="eyebrow">Welcome to RepairFlow</div><h3>Sign in to your workspace</h3><p>Repair tracking for customers, technicians and administrators.</p></div></div>
      <div class="panel-body">
        <div class="notice">RepairFlow is connected to its Supabase database. New accounts are created as customers; the system owner assigns Admin and Technician roles.</div>
        <div class="auth-tabs"><button class="btn" id="showLogin" type="button">Sign in</button><button class="btn secondary" id="showSignup" type="button">Create account</button></div>
        <form id="authForm">
          <div class="field"><label for="authEmail">Email address</label><input id="authEmail" type="email" autocomplete="email" required placeholder="you@example.com"></div>
          <div class="field auth-field-spaced"><label for="authPassword">Password</label><input id="authPassword" type="password" minlength="8" autocomplete="current-password" required placeholder="At least 8 characters"></div>
          <div class="field hidden auth-field-spaced" id="nameField"><label for="authName">Full name</label><input id="authName" maxlength="100" placeholder="Your name"></div>
          <button class="btn auth-submit" id="authSubmit" type="submit">Sign in</button>
        </form>
        <p class="hint auth-hint">New accounts start as customers. Admins and technicians must be assigned by the system owner.</p>
      </div>
    </div>
  </section>

  <section id="appView" class="hidden">
    <div class="hero"><div><div class="eyebrow" id="roleEyebrow">WORKSPACE</div><h2 id="heroTitle">Good to see you.</h2><p id="heroSubtitle">Manage repair jobs from intake to handover.</p></div><button id="newTicketBtn" class="btn hidden" type="button">＋ New repair ticket</button></div>
    <div id="stats" class="stats">
      <div class="stat"><div><span>Total tickets</span><strong id="statTotal">0</strong></div><div class="stat-icon">▤</div></div>
      <div class="stat"><div><span>Awaiting approval</span><strong id="statApproval">0</strong></div><div class="stat-icon">◷</div></div>
      <div class="stat"><div><span>In progress</span><strong id="statActive">0</strong></div><div class="stat-icon">⚙</div></div>
      <div class="stat"><div><span>Completed</span><strong id="statDone">0</strong></div><div class="stat-icon">✓</div></div>
    </div>
    <div class="grid">
      <section class="panel hidden" id="formPanel">
        <div class="panel-head"><div><h3 id="formTitle">Create service ticket</h3><p>Record the customer, device and repair estimate.</p></div><span class="pill">SERVICE INTAKE</span></div>
        <div class="panel-body">
          <form id="ticketForm">
            <input id="editId" type="hidden">
            <div class="fields">
              <div class="field"><label for="customerName">Customer name *</label><input id="customerName" maxlength="100" required></div>
              <div class="field"><label for="phone">Customer phone</label><input id="phone" maxlength="40" type="tel"></div>
              <div class="field"><label for="appliance">Appliance *</label><select id="appliance" required><option value="">Choose appliance</option><option>Washing Machine</option><option>Refrigerator</option><option>Air Conditioner</option><option>Microwave</option><option>Television</option><option>Water Purifier</option><option>Laptop / Computer</option><option>Other</option></select></div>
              <div class="field"><label for="technician">Assigned technician</label><input id="technician" maxlength="100" placeholder="Technician name"></div>
              <div class="field full"><label for="problem">Reported issue *</label><textarea id="problem" maxlength="1200" required placeholder="Describe the issue reported by the customer"></textarea></div>
              <div class="field full"><label for="diagnosis">Diagnosis</label><textarea id="diagnosis" maxlength="1200" placeholder="Technician's findings"></textarea></div>
              <div class="field"><label for="parts">Required spare parts</label><input id="parts" maxlength="500" placeholder="e.g. drain pump × 1"></div>
              <div class="field"><label for="partsAvailability">Parts availability</label><select id="partsAvailability"><option>Not checked</option><option>In stock</option><option>Need to order</option><option>Not required</option></select></div>
              <div class="field"><label for="partsCost">Parts cost (₹)</label><input id="partsCost" type="number" min="0" step=".01" value="0" required></div>
              <div class="field"><label for="laborCost">Labour cost (₹)</label><input id="laborCost" type="number" min="0" step=".01" value="0" required></div>
              <div class="field"><label for="otherCost">Other charges (₹)</label><input id="otherCost" type="number" min="0" step=".01" value="0" required></div>
              <div class="field"><label for="estimatedCost">Estimated total (₹)</label><input id="estimatedCost" type="number" readonly value="0"><div class="hint">Parts + labour + other charges.</div></div>
              <div class="field"><label for="approval">Customer approval</label><select id="approval"><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
              <div class="field"><label for="stage">Repair stage</label><select id="stage"><option>Service Received</option><option>Diagnosis</option><option>Waiting for Approval</option><option>Waiting for Parts</option><option>Repair in Progress</option><option>Testing</option><option>Completed</option></select></div>
              <div class="field"><label for="dueDate">Estimated completion date</label><input id="dueDate" type="date"></div>
              <div class="field full"><label for="finalNotes">Completion / testing notes</label><textarea id="finalNotes" maxlength="1200" placeholder="Testing result and handover details"></textarea></div>
            </div>
            <div class="actions"><button class="btn" id="saveTicketBtn" type="submit">Create ticket</button><button class="btn secondary" id="resetFormBtn" type="button">Clear form</button></div>
          </form>
        </div>
      </section>
      <section class="panel" id="listPanel">
        <div class="panel-head"><div><h3 id="listTitle">Repair tickets</h3><p id="listSubtitle">Your repair work, synced from the online database.</p></div><span class="pill" id="ticketCount">0 TICKETS</span></div>
        <div class="panel-body"><div class="searchrow"><input id="ticketSearch" type="search" placeholder="Search ticket ID, customer, appliance…"><select id="stageFilter" class="stage-filter" aria-label="Filter by stage"><option value="">All stages</option><option>Service Received</option><option>Diagnosis</option><option>Waiting for Approval</option><option>Waiting for Parts</option><option>Repair in Progress</option><option>Testing</option><option>Completed</option></select></div><div id="ticketList" class="tickets"><div class="empty">Sign in to load tickets.</div></div></div>
      </section>
    </div>
  </section>
  <p class="foot">RepairFlow · Online repair workflow management · Role-based access</p>
</main>
<div id="toast" class="toast hidden" role="status" aria-live="polite"></div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<!-- JavaScript: app behaviour is kept in app.js -->
<script src="app.js" defer></script>
</body>
</html>
