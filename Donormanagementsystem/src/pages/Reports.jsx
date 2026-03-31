import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useData } from '../context/DataContext';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const normalizeStatus = (s) => {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
  if (v === 'inactive') return 'Inactive';
  if (v === 'active') return 'Active';
  return s || 'Active';
};

export function Reports() {
  const { donations, donors } = useData();

  // ─── SHARED FILTERS ───────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // ─── FILTERED DATA ────────────────────────────────────────────────────────
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const date = new Date(d.date);
      const afterStart = !startDate || date >= new Date(startDate);
      const beforeEnd = !endDate || date <= new Date(endDate);
      const matchesCampaign = campaignFilter === 'All' || d.campaign === campaignFilter;
      return afterStart && beforeEnd && matchesCampaign;
    });
  }, [donations, startDate, endDate, campaignFilter]);

  const completedDonations = useMemo(
    () => filteredDonations.filter((d) => d.status === 'Completed'),
    [filteredDonations]
  );

  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const date = new Date(d.deliveryDate);
      const afterStart = !startDate || date >= new Date(startDate);
      const beforeEnd = !endDate || date <= new Date(endDate);
      const matchesType = typeFilter === 'All' || d.type === typeFilter;
      return afterStart && beforeEnd && matchesType;
    });
  }, [donors, startDate, endDate, typeFilter]);

  const campaignList = useMemo(
    () => [...new Set(donations.map((d) => d.campaign).filter(Boolean))],
    [donations]
  );

  // ─── COMBINED STATS ───────────────────────────────────────────────────────
  const donTotalRaised = completedDonations.reduce((s, d) => s + Number(d.amount || 0), 0);
  const donUniqueDonors = useMemo(() => new Set(filteredDonations.map((d) => d.donor).filter(Boolean)).size, [filteredDonations]);
  const donPending = filteredDonations.filter((d) => d.status === 'Pending').length;

  const sponTotal = filteredDonors.reduce((s, d) => s + Number(d.amount || 0), 0);
  const sponActive = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Active').length;
  const sponCompleted = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Completed').length;

  const combinedTotal = donTotalRaised + sponTotal;

  // ─── CHART DATA ───────────────────────────────────────────────────────────
  const monthlyTrendData = useMemo(() => MONTHS.map((month, i) => ({
    name: month,
    'Online Donations': completedDonations
      .filter((d) => new Date(d.date).getMonth() === i)
      .reduce((s, d) => s + Number(d.amount || 0), 0),
    'Sponsorships': filteredDonors
      .filter((d) => new Date(d.deliveryDate).getMonth() === i)
      .reduce((s, d) => s + Number(d.amount || 0), 0),
  })), [completedDonations, filteredDonors]);

  const byProgramData = useMemo(() => {
    const map = new Map();
    completedDonations.forEach((d) => {
      const k = d.campaign || 'Unknown';
      map.set(k, (map.get(k) || 0) + Number(d.amount || 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name: name.length > 18 ? name.substring(0, 18) + '...' : name, amount }));
  }, [completedDonations]);

  const byChannelData = useMemo(() => {
    const map = new Map();
    filteredDonations.forEach((d) => {
      const k = d.channel || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonations]);

  const byTypeData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => {
      const k = d.type || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonors]);

  const donStatusData = useMemo(() => {
    const map = new Map();
    filteredDonations.forEach((d) => {
      const k = d.status || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonations]);

  const sponStatusData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => {
      const k = normalizeStatus(d.status);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonors]);

  // ─── EXPORTS ──────────────────────────────────────────────────────────────
  const handleExportAll = () => {
    const donRows = filteredDonations.map((d) =>
      ['Donation', d.donor, d.amount, d.campaign || '-', d.channel || '-', d.status, d.date || '-', '-', '-'].join(',')
    );
    const sponRows = filteredDonors.map((d) =>
      ['Sponsorship', d.sponsor, d.amount, d.project || '-', d.type || '-', normalizeStatus(d.status), d.deliveryDate || '-', d.dueDate || '-', d.contact || '-'].join(',')
    );
    const headers = 'Type,Name,Amount,Campaign/Project,Channel/Type,Status,Date/Delivery,Due Date,Contact';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([[headers, ...donRows, ...sponRows].join('\n')], { type: 'text/csv' })
    );
    a.download = 'combined-report.csv';
    a.click();
  };

  const handleExportDonations = () => {
    const headers = ['ID','Donor','Amount','Type','Campaign','Channel','Status','Date'];
    const rows = filteredDonations.map((d) =>
      [d.id, d.donor, d.amount, d.type, d.campaign, d.channel, d.status, d.date].join(',')
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' }));
    a.download = 'donations-report.csv';
    a.click();
  };

  const handleExportSponsorships = () => {
    const headers = ['ID','Project','Sponsor','Amount','Type','Status','Delivery Date','Due Date'];
    const rows = filteredDonors.map((d) =>
      [d.id, d.project, d.sponsor, d.amount, d.type, d.status, d.deliveryDate, d.dueDate].join(',')
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' }));
    a.download = 'sponsorships-report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Combined view of donations and sponsorship records.</p>
        </div>
        <Button variant="secondary" onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" /> Export All CSV
        </Button>
      </div>

      {/* ─── SHARED FILTERS ──────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <Input type="date" className="w-auto" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="text-gray-400">–</span>
            <Input type="date" className="w-auto" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="flex items-center gap-2 ml-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Campaign:</span>
            </div>
            <div className="w-44">
              <Select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                options={[{ label: 'All Campaigns', value: 'All' }, ...campaignList.map((c) => ({ label: c, value: c }))]}
              />
            </div>
            <div className="w-44">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { label: 'All Sponsor Types', value: 'All' },
                  { label: 'Government', value: 'Government' },
                  { label: 'Corporate', value: 'Corporate' },
                  { label: 'Individual', value: 'Individual' },
                  { label: 'NGOs', value: 'NGOs' },
                  { label: 'Grants', value: 'Grants' },
                  { label: 'Others', value: 'Others' },
                ]}
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => { setStartDate(''); setEndDate(''); setCampaignFilter('All'); setTypeFilter('All'); }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── COMBINED SUMMARY STATS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Combined Total</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">₱{combinedTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Donations + Sponsorships</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Online Donations</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">₱{donTotalRaised.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{donUniqueDonors} unique donors · {donPending} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sponsorships</p>
            <p className="mt-2 text-2xl font-bold text-green-600">₱{sponTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{sponActive} active · {sponCompleted} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Records</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{filteredDonations.length + filteredDonors.length}</p>
            <p className="text-xs text-gray-400 mt-1">{filteredDonations.length} donations · {filteredDonors.length} sponsorships</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── MONTHLY TREND (COMBINED) ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend — Online Donations vs Sponsorships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="colDon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colSpon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
                <Tooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="Online Donations" stroke="#3b82f6" strokeWidth={2} fill="url(#colDon)" />
                <Area type="monotone" dataKey="Sponsorships" stroke="#22c55e" strokeWidth={2} fill="url(#colSpon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── CHARTS ROW ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donations by Program */}
        <Card>
          <CardHeader><CardTitle>Donations by Program</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProgramData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Raised']} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {byProgramData.length === 0 && <p className="text-center text-sm text-gray-400 mt-4">No data.</p>}
          </CardContent>
        </Card>

        {/* Sponsorships by Type */}
        <Card>
          <CardHeader><CardTitle>Sponsorships by Sponsor Type</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value" label>
                    {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {byTypeData.map((e, i) => (
                <div key={e.name} className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {e.name} ({e.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Donations by Channel */}
        <Card>
          <CardHeader><CardTitle>Donations by Channel</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byChannelData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value" label>
                    {byChannelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {byChannelData.map((e, i) => (
                <div key={e.name} className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {e.name} ({e.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status side by side */}
        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Online Donations</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={donStatusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      {donStatusData.map((e, i) => (
                        <Cell key={i} fill={e.name === 'Completed' ? '#22c55e' : e.name === 'Pending' ? '#eab308' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Sponsorships</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sponStatusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      {sponStatusData.map((e, i) => (
                        <Cell key={i} fill={e.name === 'Completed' ? '#22c55e' : e.name === 'Active' ? '#3b82f6' : '#6b7280'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── ONLINE DONATIONS TABLE ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Online Donation Records</CardTitle>
            <Button variant="secondary" onClick={handleExportDonations}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Donor','Amount','Type','Campaign','Channel','Date','Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDonations.length > 0 ? filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.donor}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₱{Number(d.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.campaign}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.channel}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        d.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>{d.status}</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No donations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── SPONSORSHIP RECORDS TABLE ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sponsorship Records</CardTitle>
            <Button variant="secondary" onClick={handleExportSponsorships}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Project','Sponsor','Amount','Type','Status','Delivery Date','Due Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDonors.length > 0 ? filteredDonors.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.project}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{d.sponsor}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₱{Number(d.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        normalizeStatus(d.status) === 'Completed' ? 'bg-green-100 text-green-800' :
                        normalizeStatus(d.status) === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>{normalizeStatus(d.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.deliveryDate ? new Date(d.deliveryDate).toISOString().split('T')[0] : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '-'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No sponsorship records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}