/* ==========================================================
   RepairFlow application logic
   This file controls Supabase connection, login, tickets,
   Admin decisions, Customer estimate responses and rendering.
   ========================================================== */

// SECTION 1: SUPABASE CONNECTION
// Project URL and browser-safe publishable key live here.
/*
  SETUP REQUIRED:
  1. Create a Supabase project.
  2. Paste Project URL and anon/publishable key below.
  3. Run supabase-schema.sql in Supabase SQL Editor.
  Never put a service_role key in this browser file.
*/
const SUPABASE_URL = "https://dghsiznxiqiecaymkjdg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_WyOPs49J9rAFplXCHAdb3A_DDEZH3Ta";
const hasConfig = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
const db = hasConfig && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const stages = ["Service Received", "Diagnosis", "Waiting for Approval", "Waiting for Parts", "Repair in Progress", "Testing", "Completed"];
let mode = "login", currentUser = null, profile = null, tickets = [], toastTimer;
// SECTION 2: SHARED HELPERS AND UI UTILITIES
const $ = id => document.getElementById(id);
function esc(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])) ;}
function money(v) { return Number(v || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }) ;}
function toast(msg) { const el = $("toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add("hidden"), 4000) ;}
function showMode(next) { mode = next; $("showLogin").className = next === "login" ? "btn" : "btn secondary"; $("showSignup").className = next === "signup" ? "btn" : "btn secondary"; $("nameField").classList.toggle("hidden", next !== "signup"); $("authName").required = next === "signup"; $("authSubmit").textContent = next === "login" ? "Sign in" : "Create customer account"; $("authPassword").autocomplete = next === "login" ? "current-password" : "new-password" ;}
$("showLogin").addEventListener("click", () => showMode("login")); $("showSignup").addEventListener("click", () => showMode("signup"));
function calcTotal() { const total = ["partsCost", "laborCost", "otherCost"].reduce((s, id) => s + Math.max(0, Number($(id).value) || 0), 0); $("estimatedCost").value = total.toFixed(2) ;}
["partsCost", "laborCost", "otherCost"].forEach(id => $(id).addEventListener("input", calcTotal));
function resetForm() { $("ticketForm").reset(); $("editId").value = "";["partsCost", "laborCost", "otherCost", "estimatedCost"].forEach(id => $(id).value = "0"); $("approval").value = "Pending"; $("stage").value = "Service Received"; $("formTitle").textContent = "Create service ticket"; $("saveTicketBtn").textContent = "Create ticket"; calcTotal() ;}
function isStaff() { return profile && ["admin", "technician"].includes(profile.role) ;}
function isAdmin() { return profile?.role === "admin" ;}
function canCreate() { return !!profile ;}
const staffOnlyIds = ["technician", "diagnosis", "parts", "partsAvailability", "partsCost", "laborCost", "otherCost", "estimatedCost", "approval", "stage", "dueDate", "finalNotes"];
staffOnlyIds.forEach(id => { const field = $(id)?.closest(".field"); if (field) field.classList.add("staff-only") ;});
// SECTION 3: USER ROLES, PROFILE AND AUTHENTICATION
function showApp() {
  $("authView").classList.add("hidden"); $("appView").classList.remove("hidden"); $("signOutBtn").classList.remove("hidden");
  $("userLabel").textContent = `${profile.full_name || currentUser.email} · ${profile.role}`;
  $("roleEyebrow").textContent = profile.role.toUpperCase() + " WORKSPACE";
  $("heroTitle").textContent = profile.role === "admin" ? "Repair operations overview" : profile.role === "technician" ? "Your repair queue" : "Your repairs, all in one place";
  $("heroSubtitle").textContent = profile.role === "customer" ? "Track your service requests and respond to repair estimates." : "Manage repair jobs from intake to handover.";
  $("formPanel").classList.toggle("hidden", !canCreate()); $("newTicketBtn").classList.toggle("hidden", !canCreate()); $("stats").classList.toggle("hidden", profile.role === "customer");
  $("appView").classList.toggle("customer-mode", profile.role === "customer");
  $("formTitle").textContent = profile.role === "customer" ? "Request a repair" : "Create service ticket";
  $("saveTicketBtn").textContent = profile.role === "customer" ? "Submit repair request" : "Create ticket";
  $("listSubtitle").textContent = profile.role === "customer" ? "Your requests and estimate approvals are synced online." : "Live records loaded securely from the online database.";
  if (profile.role === "customer" && !$("customerName").value) $("customerName").value = profile.full_name || "";
  $("listTitle").textContent = profile.role === "customer" ? "My repair tickets" : "Repair tickets";
  $("listSubtitle").textContent = profile.role === "customer" ? "Only your service requests are shown." : "Live records loaded securely from the online database.";
}
async function loadProfile(user) {
  const { data, error } = await db.from("profiles").select("id,full_name,role").eq("id", user.id).single();
  if (error) throw new Error("Could not load your profile. Run the database setup SQL, then sign out and sign in again.");
  return data;
}
async function refreshTickets() {
  $("ticketList").innerHTML = '<div class="empty">Loading tickets…</div>';
  let query = db.from("repair_tickets").select("*").order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) { $("ticketList").innerHTML = '<div class="empty">Unable to load tickets. Check database setup and access policies.</div>'; throw error ;}
  tickets = data || []; render();
}
async function bootSession() {
  if (!db) { $("authView").classList.remove("hidden"); $("appView").classList.add("hidden"); $("signOutBtn").classList.add("hidden"); $("userLabel").textContent = "Setup required"; toast("Add your Supabase URL and public anon/publishable key in app.js first."); return ;}
  const { data: { session }, error } = await db.auth.getSession();
  if (error) console.error(error);
  if (session) await enterApp(session.user);
}
async function enterApp(user) {
  currentUser = user;
  try { profile = await loadProfile(user); showApp(); await refreshTickets() ;}
  catch (e) { console.error(e); toast(e.message || "Could not open workspace."); }
}
$("authForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!db) { toast("Setup required: add Supabase project URL and public key in index.html."); return ;}
  const email = $("authEmail").value.trim(), password = $("authPassword").value;
  $("authSubmit").disabled = true;
  try {
    if (mode === "signup") {
      const full_name = $("authName").value.trim();
      if (!full_name) throw new Error("Enter your full name.");
      const { data, error } = await db.auth.signUp({ email, password, options: { data: { full_name } } });
      if (error) throw error;
      if (data.session) { await enterApp(data.user); toast("Account created."); }
      else toast("Account created. Check your email to confirm, then sign in.");
    } else {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await enterApp(data.user);
    }
  } catch (err) { toast(err.message || "Authentication failed."); }
  finally { $("authSubmit").disabled = false ;}
});
$("signOutBtn").addEventListener("click", async () => { if (db) await db.auth.signOut(); currentUser = null; profile = null; tickets = []; $("appView").classList.add("hidden"); $("authView").classList.remove("hidden"); $("signOutBtn").classList.add("hidden"); $("userLabel").textContent = "Secure multi-user workspace"; $("authPassword").value = "" ;});
if (db) db.auth.onAuthStateChange((event, session) => { if (event === "SIGNED_OUT") { currentUser = null; profile = null; $("appView").classList.add("hidden"); $("authView").classList.remove("hidden"); $("signOutBtn").classList.add("hidden") ;} });
// SECTION 4: TICKET FORM VALIDATION AND SAVE
function validateTicket(d) {
  if (!d.customer_name || !d.appliance || !d.problem) return "Customer name, appliance and reported issue are required.";
  if ([d.parts_cost, d.labor_cost, d.other_cost].some(n => !Number.isFinite(n) || n < 0)) return "Costs must be valid non-negative numbers.";
  if (d.approval !== "Approved" && ["Waiting for Parts", "Repair in Progress", "Testing", "Completed"].includes(d.stage)) return "Customer approval is required before repair, testing or completion.";
  if (d.stage === "Completed" && !d.final_notes.trim()) return "Add testing or completion notes before marking the repair completed.";
  if (d.parts_availability === "Need to order" && d.stage === "Repair in Progress" && d.parts.trim()) return "Parts need to be ordered before repair can start.";
  return "";
}
$("ticketForm").addEventListener("submit", async e => {
  e.preventDefault(); if (!db || !profile) return; calcTotal();
  const editId = $("editId").value;
  if (profile.role === "customer" && editId) { toast("Customers can submit requests and respond to estimates, but cannot edit repair details."); return ;}
  const payload = {
    customer_name: $("customerName").value.trim(), customer_phone: $("phone").value.trim(),
    appliance: $("appliance").value, technician_name: $("technician").value.trim(),
    problem: $("problem").value.trim(), diagnosis: $("diagnosis").value.trim(),
    parts: $("parts").value.trim(), parts_availability: $("partsAvailability").value,
    parts_cost: Number($("partsCost").value), labor_cost: Number($("laborCost").value), other_cost: Number($("otherCost").value),
    approval: $("approval").value, stage: $("stage").value,
    due_date: $("dueDate").value || null, final_notes: $("finalNotes").value.trim()
  };
  if (profile.role === "customer") {
    payload.technician_name = ""; payload.diagnosis = ""; payload.parts = ""; payload.parts_availability = "Not checked";
    payload.parts_cost = 0; payload.labor_cost = 0; payload.other_cost = 0;
    payload.approval = "Pending"; payload.stage = "Service Received"; payload.due_date = null; payload.final_notes = "";
  }
  const invalid = validateTicket(payload); if (invalid) { toast(invalid); return ;}
  $("saveTicketBtn").disabled = true;
  try {
    let result;
    if (editId) result = await db.from("repair_tickets").update(payload).eq("id", editId).select().single();
    else {
      const newTicket = { ...payload, created_by: currentUser.id };
      // Staff-entered tickets are already accepted; customer requests use the DB default "Pending".
      if (profile.role !== "customer") {
        newTicket.request_status = "Accepted";
        newTicket.request_rejection_reason = "";
      }
      result = await db.from("repair_tickets").insert(newTicket).select().single();
    }
    if (result.error) throw result.error;
    resetForm(); await refreshTickets(); toast(editId ? "Ticket updated." : (profile.role === "customer" ? "Repair request submitted: " : "Ticket created: ") + result.data.ticket_code);
  } catch (err) { console.error(err); toast(err.message || "Could not save ticket."); }
  finally { $("saveTicketBtn").disabled = false ;}
});
$("resetFormBtn").addEventListener("click", resetForm);
$("newTicketBtn").addEventListener("click", () => { $("formPanel").scrollIntoView({ behavior: "smooth", block: "start" }); $("customerName").focus() ;});
// SECTION 5: TICKET EDITING, DELETION AND APPROVAL ACTIONS
function editTicket(id) {
  const t = tickets.find(x => x.id === id); if (!t) return;
  const map = { customerName: "customer_name", phone: "customer_phone", appliance: "appliance", technician: "technician_name", problem: "problem", diagnosis: "diagnosis", parts: "parts", partsAvailability: "parts_availability", partsCost: "parts_cost", laborCost: "labor_cost", otherCost: "other_cost", approval: "approval", stage: "stage", dueDate: "due_date", finalNotes: "final_notes" };
  Object.entries(map).forEach(([field, key]) => $(field).value = t[key] ?? "");
  $("editId").value = t.id; calcTotal(); $("formTitle").textContent = "Edit " + t.ticket_code; $("saveTicketBtn").textContent = "Save changes"; $("formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function deleteTicket(id) {
  const t = tickets.find(x => x.id === id); if (!t || !confirm(`Delete ${t.ticket_code}? This cannot be undone.`)) return;
  const { error } = await db.from("repair_tickets").delete().eq("id", id);
  if (error) { toast(error.message); return ;} await refreshTickets(); toast("Ticket deleted.");
}
async function customerApproval(id, approval) {
  const { data, error } = await db.rpc("customer_respond_to_estimate", { ticket_uuid: id, approved: approval === "Approved" });
  if (error) { toast(error.message || "Could not update approval."); return ;}
  await refreshTickets(); toast(approval === "Approved" ? "Estimate approved." : "Estimate rejected.");
}

// ADMIN: accept or reject a new customer repair request.
// This is separate from the customer's later estimate approval/rejection.
async function adminSetRequestStatus(id, status) {
  if (!isAdmin()) {
    toast("Only an admin can accept or reject a repair request.");
    return;
  }

  if (!["Accepted", "Rejected"].includes(status)) {
    toast("Invalid request action.");
    return;
  }

  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) return;

  if ((ticket.request_status || "Pending") !== "Pending") {
    toast("This repair request has already been decided.");
    return;
  }

  let reason = "";
  if (status === "Rejected") {
    const entered = prompt("Enter the reason this repair request cannot be accepted:");
    if (entered === null) return;
    reason = entered.trim();
    if (!reason) {
      toast("Please enter a rejection reason for the customer.");
      return;
    }
  }

  const action = status === "Rejected" ? "reject" : "accept";
  if (!confirm(`Are you sure you want to ${action} request ${ticket.ticket_code}?`)) return;

  try {
    const { error } = await db
      .from("repair_tickets")
      .update({
        request_status: status,
        request_rejection_reason: reason
      })
      .eq("id", id);

    if (error) throw error;
    await refreshTickets();
    toast(status === "Rejected"
      ? "Repair request rejected. The customer can see the reason."
      : "Repair request accepted.");
  } catch (err) {
    console.error(err);
    toast(err.message || "Could not update request status.");
  }
}

// SECTION 6: TICKET LIST RENDERING AND FILTERS
function statusClass(v) { if (["Approved", "Completed", "In stock", "Not required"].includes(v)) return "green"; if (v === "Rejected") return "red"; return "amber" ;}
function render() {
  const q = $("ticketSearch").value.toLowerCase(), filter = $("stageFilter").value;
  const filtered = tickets.filter(t => (!filter || t.stage === filter) && [t.ticket_code, t.customer_name, t.appliance, t.problem, t.technician_name].some(v => String(v || "").toLowerCase().includes(q)));
  $("ticketCount").textContent = `${filtered.length} TICKET${filtered.length === 1 ? "" : "S"}`;
  if (profile?.role !== "customer") {
    $("statTotal").textContent = tickets.length; $("statApproval").textContent = tickets.filter(t => t.approval === "Pending").length;
    $("statActive").textContent = tickets.filter(t => !["Completed", "Service Received", "Waiting for Approval"].includes(t.stage)).length;
    $("statDone").textContent = tickets.filter(t => t.stage === "Completed").length;
  }
  if (!filtered.length) { $("ticketList").innerHTML = '<div class="empty"><b>No tickets found</b>Try another search or create a new repair ticket.</div>'; return ;}
  $("ticketList").innerHTML = filtered.map(t => {
    const staff = isStaff(), admin = isAdmin(), customer = profile?.role === "customer";
    const canEdit = staff && (admin || profile?.role === "technician");
    const meta = `<div class="meta"><div><span>Estimate</span><strong>${money(t.estimated_cost)}</strong></div><div><span>Assigned technician</span><strong>${esc(t.technician_name || "Not assigned")}</strong></div><div><span>Approval</span><strong><span class="pill ${statusClass(t.approval)}">${esc(t.approval)}</span></strong></div><div><span>Due date</span><strong>${esc(t.due_date || "Not set")}</strong></div></div>`;
    const staffActions = canEdit ? `<div class="ticket-actions"><button class="btn outline small" onclick="editTicket('${t.id}')">Edit details</button>${admin ? `<button class="btn danger small" onclick="deleteTicket('${t.id}')">Delete</button>` : ""}</div>` : "";
    const requestStatus = t.request_status || "Pending";
    const adminRequestActions = admin && requestStatus === "Pending" ? `<div class="ticket-actions"><button class="btn small" onclick="adminSetRequestStatus('${t.id}','Accepted')">Accept request</button><button class="btn danger small" onclick="adminSetRequestStatus('${t.id}','Rejected')">Reject request</button></div>` : "";
    const customerActions = customer && requestStatus === "Accepted" && t.approval === "Pending" ? `<div class="ticket-actions"><button class="btn small" onclick="customerApproval('${t.id}','Approved')">Approve estimate</button><button class="btn danger small" onclick="customerApproval('${t.id}','Rejected')">Reject estimate</button></div>` : "";
    const contact = staff ? `<div class="sub">Customer: ${esc(t.customer_name)}${t.customer_phone ? " · " + esc(t.customer_phone) : ""}</div>` : "";
    const issue = `<div class="sub">${esc(t.problem || "No issue details")}</div>`;
    return `<article class="ticket"><div class="tickettop"><div><div class="ticketid">${esc(t.ticket_code)}</div><h4>${esc(t.appliance)} repair</h4><div class="sub">${customer ? "Created " + new Date(t.created_at).toLocaleDateString("en-IN") : "Customer: " + esc(t.customer_name)} </div></div><span class="pill ${t.stage === "Completed" ? "green" : t.stage === "Rejected" ? "red" : "amber"}">${esc(t.stage)}</span></div>${contact}${issue}${meta}<div class="sub request-decision"><b>Request decision:</b> <span class="pill ${requestStatus === "Accepted" ? "green" : requestStatus === "Rejected" ? "red" : "amber"}">${esc(requestStatus)}</span></div>${requestStatus === "Rejected" && t.request_rejection_reason ? `<div class="sub rejection-reason"><b>Rejection reason:</b> ${esc(t.request_rejection_reason)}</div>` : ""}${t.diagnosis ? `<div class="sub"><b>Diagnosis:</b> ${esc(t.diagnosis)}</div>` : ""}${t.parts ? `<div class="sub ticket-extra"><b>Parts:</b> ${esc(t.parts)} · ${esc(t.parts_availability || "Not checked")}</div>` : ""}${t.final_notes ? `<div class="sub ticket-extra"><b>Testing / completion:</b> ${esc(t.final_notes)}</div>` : ""}${staffActions}${adminRequestActions}${customerActions}</article>`;
  }).join("");
}
$("ticketSearch").addEventListener("input", render); $("stageFilter").addEventListener("change", render);
(async () => { if (!hasConfig) { $("userLabel").textContent = "Setup required"; return ;} await bootSession() ;})();
