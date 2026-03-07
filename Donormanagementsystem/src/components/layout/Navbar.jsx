import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Bell, Search, Menu, X, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const API = import.meta.env.VITE_API_URL || '/api';

export function Navbar({ onToggleSidebar }) {
  const { donors, donations, campaigns } = useData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // ── Unread messages ────────────────────────────────────
  const [unreadMessages, setUnreadMessages] = useState([]);
  const token = localStorage.getItem('token');

  const fetchUnreadMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.filter((m) => m.status === 'Unread'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Due date alerts ────────────────────────────────────
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const dueAlerts = useMemo(() => {
    const now = new Date();
    const in3Days = new Date();
    in3Days.setDate(now.getDate() + 3);
    return (donors || [])
      .filter((d) => {
        if (!d.dueDate) return false;
        const status = String(d.status || '').toLowerCase();
        if (status === 'completed' || status === 'done') return false;
        const due = new Date(d.dueDate);
        if (Number.isNaN(due.getTime())) return false;
        return due <= in3Days;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [donors]);

  const visibleAlerts = useMemo(() => dueAlerts.filter((d) => !dismissedIds.has(d.id)), [dueAlerts, dismissedIds]);

  const dismissAlert = (id) => {
    setDismissedIds((prev) => { const next = new Set(prev); next.add(id); return next; });
  };

  const openRecordDetails = (donorId) => { setOpen(false); navigate('/donors', { state: { openDonorId: donorId } }); };

  const formatDate = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const buildMailto = (d) => {
    const subject = encodeURIComponent(`Due Date Reminder: ${d.project || 'Sponsorship Record'}`);
    const body = encodeURIComponent(`Good day,\n\nThis is a friendly reminder that the due date for the sponsorship record below is ${formatDate(d.dueDate)}.\n\nSponsor/Company: ${d.sponsor || '-'}\nProject: ${d.project || '-'}\nAmount: ₱${Number(d.amount || 0).toLocaleString()}\nStatus: ${d.status || '-'}\n\nThank you.\n\nRegards,\nKnowledge Channel`);
    return `mailto:${d.email || ''}?subject=${subject}&body=${body}`;
  };

  // ── Search ─────────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];
    (donors || []).forEach((d) => {
      if (String(d.name || '').toLowerCase().includes(q) || String(d.email || '').toLowerCase().includes(q) || String(d.sponsor || '').toLowerCase().includes(q))
        results.push({ type: 'Donor', label: d.name || d.sponsor || 'Unknown', sub: d.email || '', id: d.id, path: '/donors' });
    });
    (donations || []).forEach((d) => {
      if (String(d.donor || '').toLowerCase().includes(q) || String(d.campaign || '').toLowerCase().includes(q))
        results.push({ type: 'Donation', label: `${d.donor} — ₱${Number(d.amount || 0).toLocaleString()}`, sub: d.campaign || '', id: d.id, path: '/donations' });
    });
    (campaigns || []).forEach((c) => {
      if (String(c.title || '').toLowerCase().includes(q) || String(c.description || '').toLowerCase().includes(q))
        results.push({ type: 'Project', label: c.title, sub: c.status || '', id: c.id, path: `/campaigns/${c.id}` });
    });
    return results.slice(0, 8);
  }, [searchQuery, donors, donations, campaigns]);

  const handleSearchSelect = (result) => { setSearchQuery(''); setSearchOpen(false); navigate(result.path); };
  const typeBadgeColor = (type) => ({ Donor: 'bg-blue-100 text-blue-700', Donation: 'bg-green-100 text-green-700', Project: 'bg-purple-100 text-purple-700' }[type] || 'bg-gray-100 text-gray-700');

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button type="button" onClick={onToggleSidebar} className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50">
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative w-full" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search donors, donations, campaigns..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
          />
          {searchQuery && (
            <button className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600" onClick={() => { setSearchQuery(''); setSearchOpen(false); }}>
              <X className="h-4 w-4" />
            </button>
          )}
          {searchOpen && searchQuery && (
            <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {searchResults.length === 0
                ? <div className="px-4 py-3 text-sm text-gray-500">No results for "{searchQuery}"</div>
                : searchResults.map((result, i) => (
                  <div key={`${result.type}-${result.id}-${i}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0" onMouseDown={() => handleSearchSelect(result)}>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${typeBadgeColor(result.type)}`}>{result.type}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{result.label}</div>
                      {result.sub && <div className="text-xs text-gray-500 truncate">{result.sub}</div>}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Right: message icon + bell */}
      <div className="relative flex items-center gap-2">

        {/* Messages icon — always visible, badge when unread */}
        <button
          onClick={() => { navigate('/communications'); setOpen(false); }}
          className="relative p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title={unreadMessages.length > 0 ? `${unreadMessages.length} unread message${unreadMessages.length !== 1 ? 's' : ''}` : 'Messages'}
        >
          <MessageSquare className="h-5 w-5" />
          {unreadMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">
              {unreadMessages.length}
            </span>
          )}
        </button>

        {/* Bell */}
        <button onClick={() => setOpen((v) => !v)} className="relative p-1 rounded-full text-gray-400 hover:text-gray-600">
          <Bell className="h-6 w-6" />
          {visibleAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center">
              {visibleAlerts.length}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-10 w-96 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">

            {/* Unread messages section */}
            {unreadMessages.length > 0 && (
              <div className="border-b border-gray-100">
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">
                      {unreadMessages.length} Unread Message{unreadMessages.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button onClick={() => { navigate('/communications'); setOpen(false); }} className="text-xs text-blue-600 hover:underline font-medium">
                    View all →
                  </button>
                </div>
                {unreadMessages.slice(0, 3).map((m) => (
                  <div key={m.id} onClick={() => { navigate('/communications'); setOpen(false); }} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.subject || '(no subject)'}</p>
                        <p className="text-xs text-gray-400 truncate">{m.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {unreadMessages.length > 3 && (
                  <div onClick={() => { navigate('/communications'); setOpen(false); }} className="px-4 py-2 text-xs text-center text-blue-600 hover:underline cursor-pointer">
                    +{unreadMessages.length - 3} more messages
                  </div>
                )}
              </div>
            )}

            {/* Due date alerts */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-900">Due Date Alerts</div>
              <div className="text-xs text-gray-500">{visibleAlerts.length > 0 ? `${visibleAlerts.length} due soon/overdue` : 'No alerts'}</div>
            </div>
            <div className="max-h-64 overflow-auto">
              {visibleAlerts.length === 0
                ? <div className="px-4 py-6 text-sm text-gray-500">You're all caught up.</div>
                : visibleAlerts.map((d) => {
                  const overdue = new Date(d.dueDate) < new Date();
                  return (
                    <div key={d.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openRecordDetails(d.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{d.sponsor || 'Unknown Sponsor'}</div>
                          <div className="text-xs text-gray-500">Project: {d.project || '-'} · Due: {formatDate(d.dueDate)}</div>
                          <div className="text-[11px] text-primary-600 mt-1">Click to open record details</div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${overdue ? 'text-red-600' : 'text-yellow-600'}`}>{overdue ? 'OVERDUE' : 'DUE SOON'}</span>
                            <button type="button" className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" onClick={(e) => { e.stopPropagation(); dismissAlert(d.id); }}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <a href={buildMailto(d)} className="text-[11px] text-primary-600 hover:text-primary-700" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
                            Email reminder
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}
      </div>
    </header>
  );
}