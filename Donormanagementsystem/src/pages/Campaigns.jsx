import React, { useMemo, useEffect, useState } from 'react';
import { Search, Calendar, Plus, Edit, Trash, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useData } from '../context/DataContext';

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const blankCampaign = {
  title: '',
  description: '',
  target: '',
  startDate: '',
  endDate: '',
  status: 'Active',
  sponsor: '',
  department: '',
};

export function Campaigns() {
  const {
    campaigns,
    donors,
    getCampaignDonorTotal,
    fetchCampaignDonors,
    addCampaign,
    updateCampaign,
    deleteCampaign,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [campaignDonorMap, setCampaignDonorMap] = useState({});

  // ── Modal state ────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [form, setForm] = useState(blankCampaign);
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

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

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredCampaigns = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (campaigns || []).filter(c =>
      String(c.title || '').toLowerCase().includes(q) ||
      String(c.description || '').toLowerCase().includes(q)
    );
  }, [campaigns, searchTerm]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalTarget = useMemo(
    () => (campaigns || []).reduce((s, c) => s + Number(c.target || 0), 0),
    [campaigns]
  );

  const totalRaised = useMemo(
    () => (campaigns || []).reduce((s, c) => s + getCampaignDonorTotal(c.id), 0),
    [campaigns, donors]
  );

  const activeCount    = useMemo(() => (campaigns || []).filter(c => c.status === 'Active').length, [campaigns]);
  const completedCount = useMemo(() => (campaigns || []).filter(c => c.status === 'Completed').length, [campaigns]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    setCurrentCampaign(null);
    setForm(blankCampaign);
    setIsModalOpen(true);
  };

  const handleEdit = (e, campaign) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentCampaign(campaign);
    setForm({
      title:       campaign.title       || '',
      description: campaign.description || '',
      target:      campaign.target      != null ? String(campaign.target) : '',
      startDate:   campaign.startDate   ? String(campaign.startDate).slice(0, 10) : '',
      endDate:     campaign.endDate     ? String(campaign.endDate).slice(0, 10) : '',
      status:      campaign.status      || 'Active',
      sponsor:     campaign.sponsor     || '',
      department:  campaign.department  || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this campaign? This cannot be undone.')) {
      deleteCampaign(id);
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  const payload = {
    title:       form.title,
    description: form.description || null,
    target:      Number(form.target || 0),
    startDate:   form.startDate   || null,
    endDate:     form.endDate     || null,  // ← add fallback
    status:      form.status,
    sponsor:     form.sponsor     || null,
    department:  form.department  || null,
  };

  if (currentCampaign) {
    await updateCampaign({ ...payload, id: currentCampaign.id });
  } else {
    await addCampaign(payload);
  }
  setIsModalOpen(false);
};

  return (
    <div className="space-y-5 px-1">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all fundraising programs.</p>
        </div>
        <Button onClick={handleAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />Add Program
        </Button>
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
          const raised     = getCampaignDonorTotal(program.id);
          const target     = Number(program.target || 0);
          const pct        = target ? Math.min(100, Math.round((raised / target) * 100)) : 0;
          const donorCount = campaignDonorMap[program.id] ?? 0;

          return (
            <Link key={program.id} to={`/campaigns/${program.id}`} className="block h-full">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2 pt-5 px-5">
                  <div className="flex justify-between items-center">
                    <Badge variant={program.status === 'Active' ? 'success' : 'secondary'}>
                      {program.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatDate(program.endDate)}
                      </span>
                      {/* Edit & Delete buttons */}
                      <button
                        onClick={(e) => handleEdit(e, program)}
                        className="p-1 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, program.id)}
                        className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
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

        {/* Add new card */}
        <div
          onClick={handleAdd}
          className="border-dashed border-2 border-gray-200 bg-gray-50 flex items-center justify-center min-h-[220px] rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div className="text-center">
            <Plus className="h-8 w-8 mx-auto text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-500">Add new program</span>
          </div>
        </div>

        {filteredCampaigns.length === 0 && searchTerm && (
          <div className="col-span-full py-16 text-center text-sm text-gray-400">No programs found.</div>
        )}
      </div>

      {/* ── Add / Edit Campaign Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentCampaign ? 'Edit Program' : 'Add New Program'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: '75vh' }}>
          <div className="overflow-y-auto pr-1 flex-1 space-y-4 py-1">

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Program Title *</label>
              <Input
                value={form.title}
                onChange={setField('title')}
                placeholder="e.g. KCPML 2026"
                className="w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={setField('description')}
                placeholder="Describe the program..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Amount (₱) *</label>
                <Input
                  type="number"
                  value={form.target}
                  onChange={setField('target')}
                  placeholder="e.g. 500000"
                  className="w-full"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <Select
                  value={form.status}
                  onChange={setField('status')}
                  options={[
                    { label: 'Active',    value: 'Active' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Inactive',  value: 'Inactive' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={setField('startDate')}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={setField('endDate')}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lead Sponsor</label>
                <Input
                  value={form.sponsor}
                  onChange={setField('sponsor')}
                  placeholder="e.g. DOST"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                <Input
                  value={form.department}
                  onChange={setField('department')}
                  placeholder="e.g. Programs Team"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2 shrink-0">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{currentCampaign ? 'Save Changes' : 'Create Program'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}