import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataContext';

export function CampaignDetails() {
  const { id } = useParams();
  const { campaigns, donations, getCampaignRaised } = useData();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Find campaign from context (already fetched on login) ──────────────────
  useEffect(() => {
    if (campaigns.length === 0) return;
    const found = campaigns.find((c) => String(c.id) === String(id));
    setCampaign(found || null);
    setLoading(false);
  }, [campaigns, id]);

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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
        <p className="text-gray-500">Campaign not found.</p>
      </div>
    );
  }

  // ── Real data from context ─────────────────────────────────────────────────
  const raised = getCampaignRaised(campaign.title);
  const target = Number(campaign.target || 0);
  const percent = target ? Math.round((raised / target) * 100) : 0;

  // Days left
  const daysLeft = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : '—';

  // Donors who gave to this campaign
  const campaignDonations = donations.filter(
    (d) => d.campaign === campaign.title && d.status === 'Completed'
  );
  const donorCount = new Set(campaignDonations.map((d) => d.donor)).size;
  const avgDonation = campaignDonations.length
    ? Math.round(raised / campaignDonations.length)
    : 0;

  // ── Donation trend by month ────────────────────────────────────────────────
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const donationTrend = monthNames.map((name, index) => ({
    name,
    amount: campaignDonations
      .filter((d) => new Date(d.date).getMonth() === index)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
        <Badge variant={campaign.status === 'Active' ? 'success' : 'secondary'}>
          {campaign.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About this Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{campaign.description || 'No description provided.'}</p>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">₱{raised.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 uppercase">Raised</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">₱{target.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 uppercase">Goal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{donorCount}</p>
                  <p className="text-xs text-gray-500 uppercase">Donors</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="font-medium text-gray-700">{percent}%</span>
                </div>
                <ProgressBar value={raised} max={target} className="h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Donation Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Donation Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={donationTrend}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
                    <Tooltip formatter={(v) => [`₱${v.toLocaleString()}`, 'Donated']} />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Donations */}
          {campaignDonations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Donor</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Channel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {campaignDonations.map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900 font-medium">{d.donor}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">₱{Number(d.amount).toLocaleString()}</td>
                          <td className="px-4 py-2 text-gray-500">{d.date}</td>
                          <td className="px-4 py-2 text-gray-500">{d.channel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/campaigns">
                <Button className="w-full">Edit Campaign</Button>
              </Link>
              <Button variant="secondary" className="w-full">View Donors</Button>
              <Button variant="secondary" className="w-full">Export Report</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" /> Days Left
                </div>
                <span className="font-semibold text-gray-900">{daysLeft}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Target className="h-4 w-4 mr-2" /> Target Achievement
                </div>
                <span className="font-semibold text-gray-900">{percent}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-2" /> Avg. Donation
                </div>
                <span className="font-semibold text-gray-900">
                  {avgDonation ? `₱${avgDonation.toLocaleString()}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" /> End Date
                </div>
                <span className="font-semibold text-gray-900">{campaign.endDate || '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}