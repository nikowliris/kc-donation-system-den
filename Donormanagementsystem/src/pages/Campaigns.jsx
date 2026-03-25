import React, { useMemo, useEffect, useState } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

export function Campaigns() {
  const {
    campaigns,
    donors,
    getCampaignDonorTotal,  // ← uses donor amounts linked by campaign_id
    fetchCampaignDonors,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [campaignDonorMap, setCampaignDonorMap] = useState({});

  // ── Load donor counts per campaign ─────────────────────────────────────────
  useEffect(() => {
    if (!campaigns || campaigns.length === 0) return;

    const loadDonors = async () => {
      const map = {};
      await Promise.all(
        campaigns.map(async (c) => {
          const linked = await fetchCampaignDonors(c.id);
          map[c.id] = linked.length;
        })
      );
      setCampaignDonorMap(map);
    };

    loadDonors();
  }, [campaigns, donors]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredCampaigns = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (campaigns || []).filter(c =>
      String(c.title || '').toLowerCase().includes(q) ||
      String(c.description || '').toLowerCase().includes(q)
    );
  }, [campaigns, searchTerm]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalTarget = useMemo(
    () => (campaigns || []).reduce((s, c) => s + Number(c.target || 0), 0),
    [campaigns]
  );

  // Sum all donor amounts across every campaign
  const totalRaised = useMemo(
    () => (campaigns || []).reduce((s, c) => s + getCampaignDonorTotal(c.id), 0),
    [campaigns, donors]
  );

  const activeCount    = useMemo(() => (campaigns || []).filter(c => c.status === 'Active').length, [campaigns]);
  const completedCount = useMemo(() => (campaigns || []).filter(c => c.status === 'Completed').length, [campaigns]);

  return (
    <div className="space-y-5 px-1">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all fundraising programs.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          placeholder="Search programs..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Programs</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-1">{completedCount} completed</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Target</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">₱{totalTarget.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Raised</p>
          <p className="mt-2 text-2xl font-bold text-primary-700">₱{totalRaised.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">
            {totalTarget ? Math.round((totalRaised / totalTarget) * 100) : 0}% of overall goal
          </p>
        </CardContent></Card>
      </div>

      {/* Program Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCampaigns.map((program) => {
          const raised = getCampaignDonorTotal(program.id); // ← donor amounts by campaign_id
          const target = Number(program.target || 0);
          const pct    = target ? Math.round((raised / target) * 100) : 0;
          const donorCount = campaignDonorMap[program.id] ?? 0;

          return (
            <Link key={program.id} to={`/campaigns/${program.id}`} className="block h-full">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2 pt-5 px-5">
                  <div className="flex justify-between items-center">
                    <Badge variant={program.status === 'Active' ? 'success' : 'secondary'}>{program.status}</Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDate(program.endDate)}
                    </span>
                  </div>
                  <CardTitle className="mt-2.5 text-lg leading-snug hover:text-primary-600 transition-colors">
                    {program.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-5 pb-5">
                  {(program.sponsor || program.department || program.startDate) && (
                    <div className="mb-3 space-y-1">
                      {program.sponsor && (
                        <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">Sponsor:</span> {program.sponsor}</p>
                      )}
                      {program.department && (
                        <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">Dept:</span> {program.department}</p>
                      )}
                      {program.startDate && (
                        <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">Start:</span> {formatDate(program.startDate)}</p>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{program.description}</p>

                  {/* Donor count badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 11-4 0 2 2 0 014 0zM3 16a2 2 0 114 0 2 2 0 01-4 0z" />
                      </svg>
                      {donorCount} {donorCount === 1 ? 'Donor' : 'Donors'} linked
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900">₱{raised.toLocaleString()}</span>
                      <span className="text-gray-400">of ₱{target.toLocaleString()}</span>
                    </div>
                    <ProgressBar value={raised} max={target} />
                    <div className="flex justify-end text-xs text-gray-400">{pct}% Funded</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-gray-400">No programs found.</div>
        )}
      </div>
    </div>
  );
}