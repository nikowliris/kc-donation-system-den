import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';

const DataContext = createContext(null);

const API_URL = 'http://localhost:5001';

const initialCampaigns = [
  { id: 1, title: 'School Supplies 2024', target: 250000, endDate: '2024-12-31', description: 'Providing essential school supplies to students in underserved communities across the Philippines.', status: 'Active' },
  { id: 2, title: 'Teacher Training Program', target: 300000, endDate: '2025-03-31', description: 'Supporting training for public school teachers in digital and blended learning.', status: 'Active' },
  { id: 3, title: 'Learning Kits for Kids', target: 500000, endDate: '2025-06-30', description: 'Delivering learning kits and educational content to remote communities.', status: 'Planned' },
];

const nextId = (items) =>
  items.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;

export function DataProvider({ children }) {
  const [donors, setDonors] = useState([]);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [donations, setDonations] = useState([]);
  const [publicStats, setPublicStats] = useState([]);
  const [donorCount, setDonorCount] = useState(0);

  // ─── AUTH STATE ───────────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) ?? null; }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') ?? null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ─── FETCH PUBLIC STATS (no auth needed) ─────────────────────────────────
  const fetchPublicStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/donations/public/stats`);
      if (res.ok) {
        const data = await res.json();
        setPublicStats(data);
        // Total donor count = sum of all donation counts across campaigns
        const total = data.reduce((sum, s) => sum + Number(s.count || 0), 0);
        setDonorCount(total);
      }
    } catch (err) {
      console.error('Failed to fetch public stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchPublicStats();
  }, [fetchPublicStats]);

  // ─── FETCH CAMPAIGNS FROM BACKEND ─────────────────────────────────────────
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setCampaigns(data);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ─── FETCH DONORS FROM BACKEND (admin only) ───────────────────────────────
  const fetchDonors = useCallback(async (currentToken, currentUser) => {
    if (!currentToken || !currentUser || currentUser.role !== 'admin') return;
    try {
      const res = await fetch(`${API_URL}/api/donors`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) setDonors(await res.json());
    } catch (err) {
      console.error('Failed to fetch donors:', err);
    }
  }, []);

  // ─── FETCH DONATIONS ──────────────────────────────────────────────────────
  const fetchDonations = useCallback(async (currentToken, currentUser) => {
    if (!currentToken || !currentUser) {
      setDonations([]);
      return;
    }
    try {
      const endpoint = currentUser.role === 'admin'
        ? `${API_URL}/api/donations`
        : `${API_URL}/api/donations/mine`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) setDonations(await res.json());
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    }
  }, []);

  useEffect(() => {
    fetchDonations(token, user);
    fetchDonors(token, user);
  }, [token, user, fetchDonations, fetchDonors]);

  const value = useMemo(() => {

    // ─── AUTH ───────────────────────────────────────────────────────────────

    const login = async (email, password) => {
      setAuthError('');
      setAuthLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.message || 'Login failed'); return false; }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return true;
      } catch {
        setAuthError('Unable to connect to server. Please try again.');
        return false;
      } finally {
        setAuthLoading(false);
      }
    };

    const register = async (name, email, password) => {
      setAuthError('');
      setAuthLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.message || data.errors?.[0]?.msg || 'Registration failed');
          return false;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return true;
      } catch {
        setAuthError('Unable to connect to server. Please try again.');
        return false;
      } finally {
        setAuthLoading(false);
      }
    };

    const logout = async () => {
      await fetch(`${API_URL}/api/users/logout`, { method: 'POST' }).catch(() => {});
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setDonations([]);
      setDonors([]);
    };

    // ─── DONORS ─────────────────────────────────────────────────────────────

    const getDonorTotal = (name) =>
      donations
        .filter((d) => d.donor === name && typeof d.amount === 'number')
        .reduce((sum, d) => sum + d.amount, 0);

    const addDonor = (donor) =>
      setDonors((prev) => [{ ...donor, id: donor.id ?? nextId(prev) }, ...prev]);

    const updateDonor = (updated) =>
      setDonors((prev) => prev.map((d) => d.id === updated.id ? { ...d, ...updated } : d));

    const deleteDonor = (id) =>
      setDonors((prev) => prev.filter((d) => d.id !== id));

    // ─── CAMPAIGNS ──────────────────────────────────────────────────────────

    // Always uses publicStats — works for both guests and logged-in users
    const getCampaignRaised = (title) => {
      const stat = publicStats.find((s) => s.campaign === title);
      return stat ? Number(stat.raised) : 0;
    };

    const addCampaign = async (campaign) => {
      try {
        const res = await fetch(`${API_URL}/api/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(campaign),
        });
        const data = await res.json();
        if (res.ok) {
          setCampaigns((prev) => [data, ...prev]);
          return data;
        }
      } catch (err) {
        console.error('Add campaign error:', err);
      }
      return null;
    };

    const updateCampaign = async (updated) => {
      try {
        const res = await fetch(`${API_URL}/api/campaigns/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updated),
        });
        const data = await res.json();
        if (res.ok) setCampaigns((prev) => prev.map((c) => c.id === updated.id ? data : c));
      } catch (err) {
        console.error('Update campaign error:', err);
      }
    };

    const deleteCampaign = async (id) => {
      try {
        const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setCampaigns((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Delete campaign error:', err);
      }
    };

    // ─── DONATIONS ──────────────────────────────────────────────────────────

    const addDonation = async (donation) => {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/donations`, {
          method: 'POST',
          headers,
          body: JSON.stringify(donation),
        });
        const data = await res.json();

        if (res.ok) {
          // Refresh personal donations for dashboard
          await fetchDonations(token, user);
          // Refresh public stats so home + transparency pages update immediately
          await fetchPublicStats();
        }

        return res.ok ? data : null;
      } catch (err) {
        console.error('Add donation error:', err);
        return null;
      }
    };

    const updateDonation = async (updated) => {
      try {
        const res = await fetch(`${API_URL}/api/donations/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(updated),
        });
        const data = await res.json();
        if (res.ok) {
          setDonations((prev) => prev.map((d) => (d.id === updated.id ? data : d)));
          await fetchPublicStats();
        }
      } catch (err) {
        console.error('Update donation error:', err);
      }
    };

    const deleteDonation = async (id) => {
      try {
        const res = await fetch(`${API_URL}/api/donations/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setDonations((prev) => prev.filter((d) => d.id !== id));
          await fetchPublicStats();
        }
      } catch (err) {
        console.error('Delete donation error:', err);
      }
    };

    return {
      // auth
      user,
      token,
      authError,
      authLoading,
      isAuthenticated: !!token,
      login,
      register,
      logout,
      // donors
      donors,
      donorCount,
      getDonorTotal,
      addDonor,
      updateDonor,
      deleteDonor,
      // campaigns
      campaigns,
      getCampaignRaised,
      fetchCampaigns,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      // donations
      donations,
      publicStats,
      addDonation,
      updateDonation,
      deleteDonation,
    };
  }, [user, token, authError, authLoading, donors, donorCount, campaigns, donations, publicStats, fetchDonations, fetchDonors, fetchCampaigns, fetchPublicStats]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}