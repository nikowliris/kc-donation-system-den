import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useData } from '../context/DataContext';

const COLORS = ['#3b82f6', '#eab308', '#22c55e', '#ef4444', '#8b5cf6'];
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
  const [activeSection, setActiveSection] = useState('donations');

  // ─── DONATION FILTERS ─────────────────────────────────────────────────────
  const [donStartDate, setDonStartDate] = useState('');
  const [donEndDate, setDonEndDate] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');

  // ─── SPONSORSHIP FILTERS ──────────────────────────────────────────────────
  const [sponStartDate, setSponStartDate] = useState('');
  const [sponEndDate, setSponEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // ─── FILTERED DONATIONS ───────────────────────────────────────────────────
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const date = new Date(d.date);
      const afterStart = !donStartDate || date >= new Date(donStartDate);
      const beforeEnd = !donEndDate || date <= new Date(donEndDate);
      const matchesCampaign = campaignFilter === 'All' || d.campaign === campaignFilter;
      return afterStart && beforeEnd && matchesCampaign;
    });
  }, [donations, donStartDate, donEndDate, campaignFilter]);

  const completedDonations = useMemo(
    () => filteredDonations.filter((d) => d.status === 'Completed'),
    [filteredDonations]
  );

  // ─── FILTERED SPONSORSHIPS ────────────────────────────────────────────────
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const date = new Date(d.deliveryDate);
      const afterStart = !sponStartDate || date >= new Date(sponStartDate);
      const beforeEnd = !sponEndDate || date <= new Date(sponEndDate);
      const matchesType = typeFilter === 'All' || d.type === typeFilter;
      return afterStart && beforeEnd && matchesType;
    });
  }, [donors, sponStartDate, sponEndDate, typeFilter]);

  const campaignList = useMemo(() => [...new Set(donations.map((d) => d.campaign).filter(Boolean))], [donations]);

  // ─── DONATION STATS ───────────────────────────────────────────────────────
  const donTotalRaised = completedDonations.reduce((s, d) => s + Number(d.amount || 0), 0);
  const donUniqueDonors = useMemo(() => new Set(filteredDonations.map((d) => d.donor).filter(Boolean)).size, [filteredDonations]);
  const donPending = filteredDonations.filter((d) => d.status === 'Pending').length;

  // ─── SPONSORSHIP STATS ────────────────────────────────────────────────────
  const sponTotal = filteredDonors.reduce((s, d) => s + Number(d.amount || 0), 0);
  const sponActive = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Active').length;
  const sponCompleted = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Completed').length;

  // ─── CHARTS DATA ──────────────────────────────────────────────────────────
  const monthlyTrendData = useMemo(() => MONTHS.map((month, i) => ({
    name: month,
    donations: completedDonations.filter((d) => new Date(d.date).getMonth() === i).reduce((s, d) => s + Number(d.amount || 0), 0),
    sponsorships: filteredDonors.filter((d) => new Date(d.deliveryDate).getMonth() === i).reduce((s, d) => s + Number(d.amount || 0), 0),
  })), [completedDonations, filteredDonors]);

  const byProgramData = useMemo(() => {
    const map = new Map();
    completedDonations.forEach((d) => { const k = d.campaign || 'Unknown'; map.set(k, (map.get(k) || 0) + Number(d.amount || 0)); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name: name.length > 18 ? name.substring(0, 18) + '...' : name, amount }));
  }, [completedDonations]);

  const byChannelData = useMemo(() => {
    const map = new Map();
    filteredDonations.forEach((d) => { const k = d.channel || 'Unknown'; map.set(k, (map.get(k) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonations]);

  const byStatusData = useMemo(() => {
    const map = new Map();
    filteredDonations.forEach((d) => { const k = d.status || 'Unknown'; map.set(k, (map.get(k) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonations]);

  const byTypeData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => { const k = d.type || 'Unknown'; map.set(k, (map.get(k) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonors]);

  const byDonorStatusData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => { const k = normalizeStatus(d.status); map.set(k, (map.get(k) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonors]);

  // ─── EXPORTS ──────────────────────────────────────────────────────────────
  const handleExportDonations = () => {
    const headers = ['ID','Donor','Amount','Type','Campaign','Channel','Status','Date'];
    const rows = filteredDonations.map((d) => [d.id, d.donor, d.amount, d.type, d.campaign, d.channel, d.status, d.date].join(','));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' }));
    a.download = 'donations-report.csv';
    a.click();
  };

  const handleExportSponsorships = () => {
    const headers = ['ID','Project','Sponsor','Amount','Type','Status','Delivery Date','Due Date'];
    const rows = filteredDonors.map((d) => [d.id, d.project, d.sponsor, d.amount, d.type, d.status, d.deliveryDate, d.dueDate].join(','));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' }));
    a.download = 'sponsorships-report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Deep dive into your donations and sponsorship data.</p>
        </div>
        {/* Toggle Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSection('donations')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'donations' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Online Donations
          </button>
          <button
            onClick={() => setActiveSection('sponsorships')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'sponsorships' ? 'bg-green-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sponsorship Records
          </button>
        </div>
      </div>

      {/* ─── ONLINE DONATIONS SECTION ─────────────────────────────────────── */}
      {activeSection === 'donations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 border-l-4 border-blue-500 pl-3">Online Donations</h2>
            <Button variant="secondary" onClick={handleExportDonations}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Date Range:</span>
                </div>
                <Input type="date" className="w-auto" value={donStartDate} onChange={(e) => setDonStartDate(e.target.value)} />
                <span className="text-gray-500">–</span>
                <Input type="date" className="w-auto" value={donEndDate} onChange={(e) => setDonEndDate(e.target.value)} />
                <Filter className="h-4 w-4 text-gray-500 ml-4" />
                <div className="w-48">
                  <Select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)}
                    options={[{ label: 'All Campaigns', value: 'All' }, ...campaignList.map((c) => ({ label: c, value: c }))]} />
                </div>
                <Button variant="secondary" onClick={() => { setDonStartDate(''); setDonEndDate(''); setCampaignFilter('All'); }}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Total Raised', value: `₱${donTotalRaised.toLocaleString()}`, color: 'text-green-600' },
              { label: 'Number of Donors', value: donUniqueDonors, color: 'text-blue-600' },
              { label: 'Pending', value: donPending, color: 'text-yellow-600' },
            ].map((s) => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Program */}
            <Card>
              <CardHeader><CardTitle>By Program</CardTitle></CardHeader>
              <CardContent>
                <div className="h-72">
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
                {byProgramData.length === 0 && <p className="text-center text-sm text-gray-500 mt-4">No data.</p>}
              </CardContent>
            </Card>

            {/* By Channel */}
            <Card>
              <CardHeader><CardTitle>By Channel</CardTitle></CardHeader>
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

            {/* By Status */}
            <Card>
              <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byStatusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                        {byStatusData.map((e, i) => (
                          <Cell key={i} fill={e.name === 'Completed' ? '#22c55e' : e.name === 'Pending' ? '#eab308' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card>
              <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData}>
                      <defs>
                        <linearGradient id="colDon" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
                      <Tooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                      <Area type="monotone" dataKey="donations" name="Online Donations" stroke="#3b82f6" strokeWidth={2} fill="url(#colDon)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donations Table */}
          <Card>
            <CardHeader><CardTitle>Donation Records</CardTitle></CardHeader>
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
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No donations found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── SPONSORSHIP RECORDS SECTION ──────────────────────────────────── */}
      {activeSection === 'sponsorships' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 border-l-4 border-green-500 pl-3">Sponsorship Records</h2>
            <Button variant="secondary" onClick={handleExportSponsorships}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Delivery Date:</span>
                </div>
                <Input type="date" className="w-auto" value={sponStartDate} onChange={(e) => setSponStartDate(e.target.value)} />
                <span className="text-gray-500">–</span>
                <Input type="date" className="w-auto" value={sponEndDate} onChange={(e) => setSponEndDate(e.target.value)} />
                <Filter className="h-4 w-4 text-gray-500 ml-4" />
                <div className="w-48">
                  <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    options={[
                      { label: 'All Types', value: 'All' },
                      { label: 'Individual', value: 'Individual' },
                      { label: 'Corporate', value: 'Corporate' },
                      { label: 'Organization', value: 'Organization' },
                    ]} />
                </div>
                <Button variant="secondary" onClick={() => { setSponStartDate(''); setSponEndDate(''); setTypeFilter('All'); }}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sponsorship Amount', value: `₱${sponTotal.toLocaleString()}`, color: 'text-green-600' },
              { label: 'Total Records', value: filteredDonors.length, color: 'text-blue-600' },
              { label: 'Active', value: sponActive, color: 'text-yellow-600' },
              { label: 'Completed', value: sponCompleted, color: 'text-purple-600' },
            ].map((s) => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Type */}
            <Card>
              <CardHeader><CardTitle>By Sponsor Type</CardTitle></CardHeader>
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

            {/* By Status */}
            <Card>
              <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byDonorStatusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                        {byDonorStatusData.map((e, i) => (
                          <Cell key={i} fill={e.name === 'Completed' ? '#22c55e' : e.name === 'Active' ? '#3b82f6' : '#6b7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sponsorship Table */}
          <Card>
            <CardHeader><CardTitle>Sponsorship Records</CardTitle></CardHeader>
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
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No sponsorship records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}