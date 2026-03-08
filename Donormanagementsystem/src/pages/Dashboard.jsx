import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowUpRight, Users, DollarSign, Megaphone, Activity, Clock, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { donations, donors, campaigns } = useData();
  const navigate = useNavigate();

  const parseDateSafe = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const normalizeStatus = (s) => {
    const v = String(s || '').trim().toLowerCase();
    if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
    if (v === 'inactive') return 'Inactive';
    if (v === 'active') return 'Active';
    return s || 'Active';
  };

  const completedSponsors = useMemo(
    () => donors.filter((r) => normalizeStatus(r.status) === 'Completed'),
    [donors]
  );

  const totalSponsorAmount = useMemo(
    () => donors.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    [donors]
  );

  const completedDonations = useMemo(
    () => donations.filter((d) => d.status === 'Completed'),
    [donations]
  );

  const totalDonationsRaised = useMemo(
    () => completedDonations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [completedDonations]
  );

  const activeCampaigns = useMemo(
    () => donors.filter((d) => normalizeStatus(d.status) === 'Active').length,
    [donors]
  );

  const avgDonation = useMemo(
    () => completedDonations.length > 0 ? totalDonationsRaised / completedDonations.length : 0,
    [completedDonations, totalDonationsRaised]
  );

  const stats = [
    {
      title: 'Total Sponsorship Amount',
      value: `₱${totalSponsorAmount.toLocaleString()}`,
      change: `${donors.length} records`,
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
      border: 'border-l-4 border-l-green-500',
    },
    {
      title: 'Total Online Donations',
      value: `₱${totalDonationsRaised.toLocaleString()}`,
      change: `${completedDonations.length} completed`,
      icon: Activity,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-l-4 border-l-purple-500',
    },
    {
      title: 'Active Sponsorships',
      value: activeCampaigns.toString(),
      change: 'ongoing',
      icon: Megaphone,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-l-4 border-l-amber-500',
    },
    {
      title: 'Avg. Online Donation',
      value: `₱${Math.round(avgDonation).toLocaleString()}`,
      change: 'per donation',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-l-4 border-l-blue-500',
    },
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const donationTrendData = useMemo(() => {
    return monthNames.map((month, index) => {
      const amount = completedDonations
        .filter((d) => { const dt = parseDateSafe(d.date); return dt && dt.getMonth() === index; })
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      return { name: month, amount };
    });
  }, [completedDonations]);

  const campaignChartData = useMemo(() => {
    const map = new Map();
    completedDonations.forEach((d) => {
      const key = d.campaign || 'Unknown';
      map.set(key, (map.get(key) || 0) + Number(d.amount || 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, raised]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '…' : name,
        raised,
      }));
  }, [completedDonations]);

  const segmentationData = useMemo(() => {
    const map = new Map();
    donors.forEach((d) => {
      const t = d.type || 'Unknown';
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [donors]);

  const channelData = useMemo(() => {
    const map = new Map();
    donations.forEach((d) => {
      const label = d.channel || 'Unknown';
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [donations]);

  const recentRecords = useMemo(() => {
    return [...donors]
      .sort((a, b) => {
        const da = parseDateSafe(a.deliveryDate)?.getTime() || 0;
        const db = parseDateSafe(b.deliveryDate)?.getTime() || 0;
        return db - da;
      })
      .slice(0, 5);
  }, [donors]);

  const recentDonations = useMemo(() => {
    return [...donations]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [donations]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm whitespace-nowrap">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.title} className={`overflow-hidden ${item.border}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1.5 truncate">{item.value}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 mt-1">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {item.change}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl ${item.color} shrink-0 ml-3`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Online Donation Trend */}
        <Card>
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-gray-800">
              Online Donation Trends (by Month)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationTrendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(v) => `₱${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value) => [`₱${Number(value || 0).toLocaleString()}`, 'Amount']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card>
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base font-semibold text-gray-800">
              Top Campaigns (by Online Donations)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value) => [`₱${Number(value || 0).toLocaleString()}`, 'Raised']}
                  />
                  <Bar dataKey="raised" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Sponsorship Records */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pt-5 pb-3 px-6">
            <CardTitle className="text-base font-semibold text-gray-800">Recent Sponsorship Records</CardTitle>
            <button
              onClick={() => navigate('/donors')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 shrink-0"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-2/5">Sponsor</th>
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/4">Project</th>
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/5">Amount</th>
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-sm text-gray-900 truncate">{r.sponsor || '—'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {r.deliveryDate ? new Date(r.deliveryDate).toISOString().split('T')[0] : '—'}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-sm text-gray-600 truncate max-w-0">
                      <span className="block truncate">{r.project || '—'}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ₱{Number(r.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        normalizeStatus(r.status) === 'Completed' ? 'bg-green-100 text-green-700' :
                        normalizeStatus(r.status) === 'Active' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {normalizeStatus(r.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                      No sponsorship records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Recent Online Donations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pt-5 pb-3 px-6">
            <CardTitle className="text-base font-semibold text-gray-800">Recent Online Donations</CardTitle>
            <button
              onClick={() => navigate('/donations')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-0.5 shrink-0"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-2/5">Donor</th>
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/4">Campaign</th>
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/5">Amount</th>
                  <th className="pb-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="font-medium text-sm text-gray-900 truncate">{d.donor}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{d.date}</div>
                    </td>
                    <td className="py-3 pr-3 text-sm text-gray-600 max-w-0">
                      <span className="block truncate">{d.campaign}</span>
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ₱{Number(d.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        d.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        d.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentDonations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                      No online donations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donor Segmentation */}
        <Card className="flex flex-col">
          <CardHeader className="pt-5 pb-2 px-6">
            <CardTitle className="text-base font-semibold text-gray-800">Sponsor Segmentation</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 flex-1 flex flex-col">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {segmentationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-2">
              {segmentationData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-600 truncate">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 ml-2">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Online Donation Channels */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="pt-5 pb-2 px-6">
            <CardTitle className="text-base font-semibold text-gray-800">Online Donations by Channel</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 flex-1">
            {channelData.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-full content-start">
                {channelData.map((entry, i) => (
                  <div
                    key={entry.name}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-center gap-1"
                  >
                    <div
                      className="w-2 h-2 rounded-full mb-1"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div className="text-xs font-medium text-gray-500 leading-tight">{entry.name}</div>
                    <div className="text-2xl font-bold text-gray-900">{entry.value}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Donations</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 pt-4">No channel data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}