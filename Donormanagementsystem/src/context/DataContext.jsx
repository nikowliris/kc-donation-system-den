import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const DataContext = createContext();
export const useData = () => useContext(DataContext);

const API_BASE = "/api";
const getToken = () => localStorage.getItem("token");

export const DataProvider = ({ children }) => {
  const { token } = useAuth();

  const [donors, setDonors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [events, setEvents] = useState([]);
  const [grants, setGrants] = useState([]);
  const [causeMarketing, setCauseMarketing] = useState([]);
  const [donations, setDonations] = useState([]);
  const [commTemplates, setCommTemplates] = useState([]);
  const [commWorkflows, setCommWorkflows] = useState([]);
  const [commHistory, setCommHistory] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);

  // -------------
  // DONORS
  // -------------
  const fetchDonors = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch donors failed: ${res.status}`);
      setDonors(await res.json());
    } catch (err) { console.error(err); }
  };

  const addDonor = async (donor) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(donor),
      });
      if (!res.ok) throw new Error(`Add donor failed: ${res.status}`);
      await fetchDonors();
    } catch (err) { console.error(err); alert("Failed to add record."); }
  };

  const updateDonor = async (updatedDonor) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors/${updatedDonor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedDonor),
      });
      if (!res.ok) throw new Error(`Update donor failed: ${res.status}`);
      await fetchDonors();
    } catch (err) { console.error(err); alert("Failed to update record."); }
  };

  const deleteDonor = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete donor failed: ${res.status}`);
      await fetchDonors();
    } catch (err) { console.error(err); alert("Failed to delete record."); }
  };

  // Save a snapshot of the donor BEFORE an edit (called from Donors.jsx)
  const saveDonorSnapshot = async (donorId, snapshot) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors/${donorId}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(snapshot),
      });
      if (!res.ok) throw new Error(`Save snapshot failed: ${res.status}`);
    } catch (err) {
      // Non-fatal — log but don't block the save
      console.error("saveDonorSnapshot error:", err);
    }
  };

  // Fetch full edit history for a single donor
  const fetchDonorHistory = async (donorId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors/${donorId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch donor history failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error("fetchDonorHistory error:", err);
      return [];
    }
  };

  // Fetch all donors linked to a specific campaign
  const fetchCampaignDonors = async (campaignId) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Fetch campaign donors failed: ${res.status}`);
      const all = await res.json();
      return all.filter((d) => String(d.campaign_id) === String(campaignId));
    } catch (err) {
      console.error("fetchCampaignDonors error:", err);
      return [];
    }
  };

  // -------------
  // CAMPAIGNS
  // -------------
  const fetchCampaigns = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch campaigns failed: ${res.status}`);
      setCampaigns(await res.json());
    } catch (err) { console.error(err); }
  };

  const addCampaign = async (campaign) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) throw new Error(`Add campaign failed: ${res.status}`);
      await fetchCampaigns();
    } catch (err) { console.error(err); alert("Failed to create project."); }
  };

  const updateCampaign = async (campaign) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaigns/${campaign.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(campaign),
      });
      if (!res.ok) throw new Error(`Update campaign failed: ${res.status}`);
      await fetchCampaigns();
    } catch (err) { console.error(err); alert("Failed to update project."); }
  };

  const deleteCampaign = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete campaign failed: ${res.status}`);
      await fetchCampaigns();
    } catch (err) { console.error(err); alert("Failed to delete project."); }
  };

  // -------------
  // EVENTS
  // -------------
  const fetchEvents = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/events`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch events failed: ${res.status}`);
      setEvents(await res.json());
    } catch (err) { console.error(err); }
  };

  const addEvent = async (payload) => {
    try {
      const token = getToken();
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") formData.append(k, v);
      });
      const res = await fetch(`${API_BASE}/events`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (!res.ok) throw new Error(`Add event failed: ${res.status}`);
      await fetchEvents();
    } catch (err) { console.error(err); alert("Failed to create event."); }
  };

  const updateEvent = async (payload) => {
    try {
      const token = getToken();
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") formData.append(k, v);
      });
      const res = await fetch(`${API_BASE}/events/${payload.id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: formData,
      });
      if (!res.ok) throw new Error(`Update event failed: ${res.status}`);
      await fetchEvents();
    } catch (err) { console.error(err); alert("Failed to update event."); }
  };

  const deleteEvent = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete event failed: ${res.status}`);
      await fetchEvents();
    } catch (err) { console.error(err); alert("Failed to delete event."); }
  };

  // -------------
  // CAMPAIGN EVENTS
  // -------------
  const addCampaignEvent = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaign-events`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Add campaign event failed: ${res.status}`);
      await fetchEvents();
    } catch (err) { console.error(err); alert("Failed to create campaign event."); }
  };

  const updateCampaignEvent = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaign-events/${payload.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update campaign event failed: ${res.status}`);
      await fetchEvents();
    } catch (err) { console.error(err); alert("Failed to update campaign event."); }
  };

  const deleteCampaignEvent = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/campaign-events/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete campaign event failed: ${res.status}`);
      await fetchEvents();
    } catch (err) { console.error(err); alert("Failed to delete campaign event."); }
  };

  // -------------
  // GRANTS
  // -------------
  const fetchGrants = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/grants`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch grants failed: ${res.status}`);
      setGrants(await res.json());
    } catch (err) { console.error(err); }
  };

  const addGrant = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/grants`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Add grant failed: ${res.status}`);
      await fetchGrants();
    } catch (err) { console.error(err); alert("Failed to create grant."); }
  };

  const updateGrant = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/grants/${payload.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update grant failed: ${res.status}`);
      await fetchGrants();
    } catch (err) { console.error(err); alert("Failed to update grant."); }
  };

  const deleteGrant = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/grants/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete grant failed: ${res.status}`);
      await fetchGrants();
    } catch (err) { console.error(err); alert("Failed to delete grant."); }
  };

  // -------------
  // CAUSE MARKETING
  // -------------
  const fetchCauseMarketing = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/cause-marketing`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch cause marketing failed: ${res.status}`);
      setCauseMarketing(await res.json());
    } catch (err) { console.error(err); }
  };

  const addCauseMarketing = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/cause-marketing`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Add cause marketing failed: ${res.status}`);
      await fetchCauseMarketing();
    } catch (err) { console.error(err); alert("Failed to create cause marketing entry."); }
  };

  const updateCauseMarketing = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/cause-marketing/${payload.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update cause marketing failed: ${res.status}`);
      await fetchCauseMarketing();
    } catch (err) { console.error(err); alert("Failed to update cause marketing entry."); }
  };

  const deleteCauseMarketing = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/cause-marketing/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete cause marketing failed: ${res.status}`);
      await fetchCauseMarketing();
    } catch (err) { console.error(err); alert("Failed to delete cause marketing entry."); }
  };

  // -------------
  // DONATIONS
  // -------------
  const fetchDonations = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donations`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch donations failed: ${res.status}`);
      setDonations(await res.json());
    } catch (err) { console.error(err); }
  };

  const addDonation = async (donation) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donations`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(donation),
      });
      if (!res.ok) throw new Error(`Add donation failed: ${res.status}`);
      await fetchDonations();
    } catch (err) { console.error(err); alert("Failed to record donation."); }
  };

  const updateDonation = async (donation) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donations/${donation.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(donation),
      });
      if (!res.ok) throw new Error(`Update donation failed: ${res.status}`);
      await fetchDonations();
    } catch (err) { console.error(err); alert("Failed to update donation."); }
  };

  const deleteDonation = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/donations/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete donation failed: ${res.status}`);
      await fetchDonations();
    } catch (err) { console.error(err); alert("Failed to delete donation."); }
  };

  // -------------
  // COMMUNICATIONS
  // -------------
  const fetchCommTemplates = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/templates`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch templates failed: ${res.status}`);
      setCommTemplates(await res.json());
    } catch (err) { console.error(err); }
  };

  const addCommTemplate = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/templates`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Add template failed: ${res.status}`);
      await fetchCommTemplates();
    } catch (err) { console.error(err); alert("Failed to create template."); }
  };

  const updateCommTemplate = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/templates/${payload.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update template failed: ${res.status}`);
      await fetchCommTemplates();
    } catch (err) { console.error(err); alert("Failed to update template."); }
  };

  const deleteCommTemplate = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/templates/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete template failed: ${res.status}`);
      await fetchCommTemplates();
    } catch (err) { console.error(err); alert("Failed to delete template."); }
  };

  const fetchCommWorkflows = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/workflows`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch workflows failed: ${res.status}`);
      setCommWorkflows(await res.json());
    } catch (err) { console.error(err); }
  };

  const updateCommWorkflow = async (payload) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/workflows/${payload.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update workflow failed: ${res.status}`);
      await fetchCommWorkflows();
    } catch (err) { console.error(err); alert("Failed to update workflow."); }
  };

  const fetchCommHistory = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/communications/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch history failed: ${res.status}`);
      setCommHistory(await res.json());
    } catch (err) { console.error(err); }
  };

  // -------------
  // CONTACT MESSAGES
  // -------------
  const fetchContactMessages = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Fetch messages failed: ${res.status}`);
      setContactMessages(await res.json());
    } catch (err) { console.error(err); }
  };

  const markMessageRead = async (id) => {
    try {
      const token = getToken();
      await fetch(`${API_BASE}/messages/${id}/read`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      setContactMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: "Read" } : m));
    } catch (err) { console.error(err); }
  };

  const deleteContactMessage = async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/messages/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Delete message failed: ${res.status}`);
      setContactMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) { console.error(err); alert("Failed to delete message."); }
  };

  // fetch all on login
  useEffect(() => {
    if (!token) return;
    fetchDonors();
    fetchCampaigns();
    fetchEvents();
    fetchGrants();
    fetchCauseMarketing();
    fetchDonations();
    fetchCommTemplates();
    fetchCommWorkflows();
    fetchCommHistory();
    fetchContactMessages();
  }, [token]);

  // -------------
  // Helpers
  // -------------
  const getDonorTotal = (donorName) =>
    donations
      .filter((d) => d.donor === donorName && d.status === "Completed")
      .reduce((sum, d) => sum + d.amount, 0);

  const getCampaignRaised = (campaignTitle) =>
    donations
      .filter((d) => d.campaign === campaignTitle && d.status === "Completed")
      .reduce((sum, d) => sum + d.amount, 0);

  // ── NEW: sum donor amounts linked to a campaign by campaign_id ──────────────
  const getCampaignDonorTotal = (campaignId) =>
    donors
      .filter((d) => String(d.campaign_id) === String(campaignId))
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const value = useMemo(
    () => ({
      donors, campaigns, events, grants, causeMarketing, donations,
      commTemplates, commWorkflows, commHistory,
      contactMessages,

      fetchDonors, addDonor, updateDonor, deleteDonor,
      saveDonorSnapshot, fetchDonorHistory,
      fetchCampaignDonors,

      fetchCampaigns, addCampaign, updateCampaign, deleteCampaign,
      fetchEvents, addEvent, updateEvent, deleteEvent,
      addCampaignEvent, updateCampaignEvent, deleteCampaignEvent,
      fetchGrants, addGrant, updateGrant, deleteGrant,
      fetchCauseMarketing, addCauseMarketing, updateCauseMarketing, deleteCauseMarketing,
      fetchDonations, addDonation, updateDonation, deleteDonation,
      fetchCommTemplates, addCommTemplate, updateCommTemplate, deleteCommTemplate,
      fetchCommWorkflows, updateCommWorkflow,
      fetchCommHistory,
      fetchContactMessages, markMessageRead, deleteContactMessage,

      getDonorTotal, getCampaignRaised,
      getCampaignDonorTotal,  // ← NEW
    }),
    [donors, campaigns, events, grants, causeMarketing, donations,
     commTemplates, commWorkflows, commHistory, contactMessages]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};