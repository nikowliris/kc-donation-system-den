import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, TrendingUp, Users, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '../context/DataContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316'];

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const normalizeStatus = (s) => {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
  if (v === 'inactive') return 'Inactive';
  if (v === 'active') return 'Active';
  return s || 'Active';
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { campaigns, donors, fetchCampaignDonors, getCampaignDonorTotal } = useData();

  const [campaign, setCampaign] = useState(null);
  const [linkedDonors, setLinkedDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Find campaign ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (campaigns.length === 0) return;
    const found = campaigns.find((c) => String(c.id) === String(id));
    setCampaign(found || null);
    setLoading(false);
  }, [campaigns, id]);

  // ── Load linked donors for this campaign ───────────────────────────────────
  useEffect(() => {
    if (!id) return;
    // First try from local donors state (fast, no extra request)
    const fromState = donors.filter((d) => String(d.campaign_id) === String(id));
    if (fromState.length > 0) {
      setLinkedDonors(fromState);
    } else {
      // Fallback: fetch from backend endpoint
      fetchCampaignDonors(id).then(setLinkedDonors);
    }
  }, [id, donors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        Loading campaign...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Link to="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Campaigns
          </Button>
        </Link>
        <p className="text-gray-500">Campaign not found.</p>
      </div>
    );
  }

  // ── Derived stats from donors ──────────────────────────────────────────────
  const raised  = linkedDonors.reduce((s, d) => s + Number(d.amount || 0), 0);
  const target  = Number(campaign.target || 0);
  const percent = target ? Math.min(100, Math.round((raised / target) * 100)) : 0;

  const activeSponsors    = linkedDonors.filter((d) => normalizeStatus(d.status) === 'Active').length;
  const completedSponsors = linkedDonors.filter((d) => normalizeStatus(d.status) === 'Completed').length;
  const avgAmount         = linkedDonors.length ? Math.round(raised / linkedDonors.length) : 0;

  // Days left
  const daysLeft = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : '—';

  // ── Monthly trend by deliveryDate ──────────────────────────────────────────
  const monthlyTrend = MONTHS.map((name, i) => ({
    name,
    amount: linkedDonors
      .filter((d) => { const dt = d.deliveryDate ? new Date(d.deliveryDate) : null; return dt && dt.getMonth() === i; })
      .reduce((s, d) => s + Number(d.amount || 0), 0),
  }));

  // ── By sponsor type ────────────────────────────────────────────────────────
  const byTypeMap = new Map();
  linkedDonors.forEach((d) => {
    const k = d.type || 'Unknown';
    byTypeMap.set(k, (byTypeMap.get(k) || 0) + 1);
  });
  const byTypeData = Array.from(byTypeMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Campaigns
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
        <Badge variant={campaign.status === 'Active' ? 'success' : 'secondary'}>
          {campaign.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About this Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm leading-relaxed">
                {campaign.description || 'No description provided.'}
              </p>

              {/* Meta */}
              {(campaign.sponsor || campaign.department || campaign.startDate) && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                  {campaign.sponsor && (
                    <span><span className="font-medium text-gray-700">Sponsor:</span> {campaign.sponsor}</span>
                  )}
                  {campaign.department && (
                    <span><span className="font-medium text-gray-700">Dept:</span> {campaign.department}</span>
                  )}
                  {campaign.startDate && (
                    <span><span className="font-medium text-gray-700">Start:</span> {formatDate(campaign.startDate)}</span>
                  )}
                </div>
              )}

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-700">₱{raised.toLocaleString()}</p>
                  <p className="text-xs text-green-600 uppercase font-semibold mt-1">Raised</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">₱{target.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Goal</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-700">{linkedDonors.length}</p>
                  <p className="text-xs text-blue-600 uppercase font-semibold mt-1">Sponsors</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-5 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="font-semibold text-gray-900">{percent}%</span>
                </div>
                <ProgressBar value={raised} max={target} className="h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Sponsorship Amount Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Sponsorship Amount by Month (Payment Date)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={52} />
                    <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Amount']} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {linkedDonors.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-2">No sponsor payment data yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Linked Sponsors Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Linked Sponsors</CardTitle>
                <span className="text-xs text-gray-400 font-normal">{linkedDonors.length} record{linkedDonors.length !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            <CardContent>
              {linkedDonors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Sponsor','Program','Type','Amount','Payment Date','Due Date','Status'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {linkedDonors.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[140px]">{d.sponsor || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]">{d.project || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{d.type || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">₱{Number(d.amount || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.deliveryDate)}</td>
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(d.dueDate)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              normalizeStatus(d.status) === 'Completed' ? 'bg-green-100 text-green-700' :
                              normalizeStatus(d.status) === 'Active'    ? 'bg-blue-100 text-blue-700' :
                                                                          'bg-gray-100 text-gray-600'
                            }`}>
                              {normalizeStatus(d.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-6 text-center">No sponsors linked to this campaign yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-6">

          {/* Actions */}
          <Card>
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => navigate('/campaigns')}>
                <Edit className="h-4 w-4 mr-2" /> Edit Campaign
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => navigate('/donors')}>
                <Users className="h-4 w-4 mr-2" /> View All Donors
              </Button>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader><CardTitle>Key Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Calendar,    label: 'Days Left',          value: daysLeft },
                { icon: Target,      label: 'Target Achievement', value: `${percent}%` },
                { icon: TrendingUp,  label: 'Avg. Sponsorship',   value: avgAmount ? `₱${avgAmount.toLocaleString()}` : '—' },
                { icon: Users,       label: 'Active Sponsors',    value: activeSponsors },
                { icon: Users,       label: 'Completed Sponsors', value: completedSponsors },
                { icon: Calendar,    label: 'End Date',           value: formatDate(campaign.endDate) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <Icon className="h-4 w-4 shrink-0" /> {label}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Sponsor Type */}
          {byTypeData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>By Source of Funds</CardTitle></CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                        {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {byTypeData.map((e, i) => (
                    <div key={e.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{e.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{e.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}