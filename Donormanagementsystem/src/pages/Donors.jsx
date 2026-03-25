import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Edit, Trash, Eye, Clock, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_SIZE = 10;

export function Donors() {
  const {
    donors, campaigns,
    addDonor, updateDonor, deleteDonor,
    saveDonorSnapshot, fetchDonorHistory,
  } = useData();

  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentDonor, setCurrentDonor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [profileTab, setProfileTab] = useState('details');
  const [donorHistory, setDonorHistory] = useState([]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const normalizeStatus = (s) => {
    const v = String(s || '').trim().toLowerCase();
    if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
    if (v === 'inactive') return 'Inactive';
    if (v === 'active') return 'Active';
    return s || 'Active';
  };

  const statusBadgeVariant = (status) => {
    const s = normalizeStatus(status);
    if (s === 'Active' || s === 'Completed') return 'success';
    return 'secondary';
  };

  // Find linked campaign object for a donor
  const getLinkedCampaign = (donor) => {
    if (!donor?.campaign_id) return null;
    return (campaigns || []).find((c) => String(c.id) === String(donor.campaign_id)) || null;
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const openDonorId = location.state?.openDonorId;
    if (!openDonorId) return;
    const found = (donors || []).find((d) => String(d.id) === String(openDonorId));
    if (found) handleViewProfile(found);
  }, [location.state, donors]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter]);

  // ── Filtering & grouping ───────────────────────────────────────────────────
  const filteredDonors = donors.filter((row) => {
    const s = searchTerm.toLowerCase();
    const linkedCampaign = getLinkedCampaign(row);
    const matchesSearch =
      (row.sponsor || '').toLowerCase().includes(s) ||
      (row.project || '').toLowerCase().includes(s) ||
      (row.description || '').toLowerCase().includes(s) ||
      String(row.type || '').toLowerCase().includes(s) ||
      (linkedCampaign?.title || '').toLowerCase().includes(s);
    const matchesType = typeFilter === 'All' || row.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const grouped = filteredDonors.reduce((acc, row) => {
    const key = (row.sponsor || 'Unknown').trim();
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  const sponsorNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  const totalPages = Math.max(1, Math.ceil(sponsorNames.length / PAGE_SIZE));
  const paginatedSponsors = sponsorNames.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleGroup = (name) =>
    setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }));

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleViewProfile = async (donor) => {
    setCurrentDonor(donor);
    setProfileTab('details');
    setDonorHistory([]);
    setIsProfileOpen(true);
    const history = await fetchDonorHistory(donor.id);
    setDonorHistory(history);
  };

  const handleAddDonor = () => {
    setCurrentDonor(null);
    setIsModalOpen(true);
  };

  const handleEditDonor = (donor) => {
    setCurrentDonor(donor);
    setIsModalOpen(true);
  };

  const handleDeleteDonor = (id) => {
    if (confirm('Are you sure you want to delete this record?')) deleteDonor(id);
  };

  // Navigate to the linked campaign's page
  const handleGoToProject = (campaignId) => {
    setIsProfileOpen(false);
    navigate('/campaigns', { state: { openCampaignId: campaignId } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rawCampaignId = formData.get('campaign_id');
    const newDonor = {
      id: currentDonor ? currentDonor.id : undefined,
      project: formData.get('project'),
      description: formData.get('description'),
      units: Number(formData.get('units') || 0),
      deliveryDate: formData.get('deliveryDate') || null,
      dueDate: formData.get('dueDate') || null,
      sponsor: formData.get('sponsor'),
      amount: Number(formData.get('amount') || 0),
      type: formData.get('type'),
      status: normalizeStatus(formData.get('status')),
      email: formData.get('email') || null,
      contact: formData.get('contact') || null,
      tranches: Number(formData.get('tranches') || 0),
      campaign_id: rawCampaignId && rawCampaignId !== '' ? Number(rawCampaignId) : null,
    };

    if (currentDonor) {
      const prevFields = {
        project: currentDonor.project, description: currentDonor.description,
        units: currentDonor.units, deliveryDate: currentDonor.deliveryDate,
        dueDate: currentDonor.dueDate, sponsor: currentDonor.sponsor,
        amount: currentDonor.amount, type: currentDonor.type,
        status: currentDonor.status, email: currentDonor.email,
        contact: currentDonor.contact, tranches: currentDonor.tranches,
        campaign_id: currentDonor.campaign_id,
      };
      const newFields = {
        project: newDonor.project, description: newDonor.description,
        units: newDonor.units, deliveryDate: newDonor.deliveryDate,
        dueDate: newDonor.dueDate, sponsor: newDonor.sponsor,
        amount: newDonor.amount, type: newDonor.type,
        status: newDonor.status, email: newDonor.email,
        contact: newDonor.contact, tranches: newDonor.tranches,
        campaign_id: newDonor.campaign_id,
      };
      if (JSON.stringify(prevFields) !== JSON.stringify(newFields)) {
        await saveDonorSnapshot(currentDonor.id, { ...currentDonor });
      }
      updateDonor(newDonor);
    } else {
      addDonor(newDonor);
    }
    setIsModalOpen(false);
  };

  const handleDownloadSummary = () => {
    if (!currentDonor) return;
    const linkedCampaign = getLinkedCampaign(currentDonor);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Sponsorship Record Summary', 105, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Project: ${currentDonor.project || '-'}`, 20, 35);
    doc.text(`Sponsor: ${currentDonor.sponsor || '-'}`, 20, 42);
    doc.text(`Email: ${currentDonor.email || '-'}`, 20, 49);
    doc.text(`Type: ${currentDonor.type || '-'}`, 20, 56);
    doc.text(`Units (Schools/PMLs): ${currentDonor.units ?? '-'}`, 20, 63);
    doc.text(`Delivery Date: ${formatDate(currentDonor.deliveryDate)}`, 20, 70);
    doc.text(`Due Date: ${formatDate(currentDonor.dueDate)}`, 20, 77);
    if (linkedCampaign) {
      doc.text(`Linked Campaign: ${linkedCampaign.title}`, 20, 84);
    }
    doc.setFontSize(12);
    doc.text(`Amount: ₱${Number(currentDonor.amount || 0).toLocaleString()}`, 20, 91);
    doc.setFontSize(11);
    doc.text('Project Description:', 20, 106);
    const lines = doc.splitTextToSize(String(currentDonor.description || '-'), 170);
    doc.text(lines, 20, 114);
    const fileSafeName = String(currentDonor.project || currentDonor.sponsor || 'record')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`${fileSafeName}-record-summary.pdf`);
  };

  // Campaign options for the form select
  const campaignOptions = [
    { label: '— No linked campaign —', value: '' },
    ...(campaigns || []).map((c) => ({ label: c.title, value: String(c.id) })),
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Sponsorship Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track projects, sponsors, and amounts.</p>
        </div>
        <Button onClick={handleAddDonor} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search sponsor, program, campaign..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { label: 'All Types', value: 'All' },
                  { label: 'Government', value: 'Government' },
                  { label: 'Individual', value: 'Individual' },
                  { label: 'Corporate', value: 'Corporate' },
                  { label: 'NGOs', value: 'NGOs' },
                  { label: 'Grants', value: 'Grants' },
                  { label: 'Others', value: 'Others' },
                ]}
              />
            </div>
          </div>

          {/* Grouped Table */}
          <div className="space-y-3">
            {paginatedSponsors.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No records found.</div>
            )}

            {paginatedSponsors.map((sponsorName) => {
              const rows = grouped[sponsorName];
              const isCollapsed = collapsedGroups[sponsorName];
              const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

              return (
                <div key={sponsorName} className="rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleGroup(sponsorName)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm font-bold shrink-0">
                        {sponsorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{sponsorName}</p>
                        <p className="text-xs text-gray-500">
                          {rows.length} record{rows.length !== 1 ? 's' : ''} · ₱{totalAmount.toLocaleString()} total
                        </p>
                      </div>
                    </div>
                    {isCollapsed
                      ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                      : <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                    }
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100">
                      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 bg-white border-b border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Program</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Campaign</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-center">Actions</span>
                      </div>

                      {rows.map((row) => {
                        const linkedCampaign = getLinkedCampaign(row);
                        return (
                          <div
                            key={row.id}
                            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-3 hover:bg-gray-50/60 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{row.project || '—'}</p>
                              {row.description && (
                                <p className="text-xs text-gray-400 truncate mt-0.5">{row.description}</p>
                              )}
                            </div>

                            {/* Linked campaign pill */}
                            <div className="shrink-0">
                              {linkedCampaign ? (
                                <button
                                  onClick={() => handleGoToProject(linkedCampaign.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors max-w-[140px] truncate"
                                  title={linkedCampaign.title}
                                >
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{linkedCampaign.title}</span>
                                </button>
                              ) : (
                                <span className="text-xs text-gray-300 italic">—</span>
                              )}
                            </div>

                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap text-right">
                              ₱{Number(row.amount || 0).toLocaleString()}
                            </span>
                            <Badge variant={statusBadgeVariant(row.status)}>
                              {normalizeStatus(row.status)}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleViewProfile(row)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditDonor(row)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDonor(row.id)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{paginatedSponsors.length}</span> of{' '}
              <span className="font-medium text-gray-700">{sponsorNames.length}</span> sponsors
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm select-none">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        currentPage === item
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentDonor ? 'Edit Record' : 'Add New Record'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="overflow-y-auto pr-1 flex-1 space-y-5">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name of Sponsor</label>
                <Input name="sponsor" defaultValue={currentDonor?.sponsor} placeholder="Enter sponsor name" className="w-full" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                  <Input name="contact" defaultValue={currentDonor?.contact} placeholder="e.g. 09123456789" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <Input name="email" type="email" defaultValue={currentDonor?.email} placeholder="example@email.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Program</label>
                <Select
                  name="project"
                  defaultValue={currentDonor?.project}
                  options={[
                    { label: 'Video Production', value: 'Video Production' },
                    { label: 'Knowledge Channel TV Package (KCTV)', value: 'KCTV' },
                    { label: 'Knowledge Portable Media Library (KCPML)', value: 'KCPML' },
                    { label: 'Teacher Training', value: 'Teacher Training' },
                    { label: 'Others', value: 'Others' },
                  ]}
                />
              </div>

              {/* ── Linked Campaign ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Linked Campaign
                  <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
                </label>
                <Select
                  name="campaign_id"
                  defaultValue={currentDonor?.campaign_id ? String(currentDonor.campaign_id) : ''}
                  options={campaignOptions}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Beneficiaries</label>
                  <Input name="units" type="number" defaultValue={currentDonor?.units} placeholder="Enter number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Payment</label>
                  <Input name="deliveryDate" type="date" defaultValue={currentDonor?.deliveryDate} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                  <Input name="dueDate" type="date" defaultValue={currentDonor?.dueDate} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₱)</label>
                  <Input name="amount" type="number" defaultValue={currentDonor?.amount} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Tranches</label>
                  <Input name="tranches" type="number" defaultValue={currentDonor?.tranches} placeholder="Enter number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Source of Funds</label>
                  <Select
                    name="type"
                    defaultValue={currentDonor?.type}
                    options={[
                      { label: 'Government', value: 'Government' },
                      { label: 'Corporate', value: 'Corporate' },
                      { label: 'Individual', value: 'Individual' },
                      { label: 'NGOs', value: 'NGOs' },
                      { label: 'Grants', value: 'Grants' },
                      { label: 'Others', value: 'Others' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <Select
                  name="status"
                  defaultValue={currentDonor?.status || 'Active'}
                  options={[
                    { label: 'Active', value: 'Active' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Inactive', value: 'Inactive' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Description</label>
                <textarea
                  name="description"
                  defaultValue={currentDonor?.description}
                  placeholder="Enter project description..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2 shrink-0">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </Modal>

      {/* ── View Profile Modal ── */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Record Details">
        {currentDonor && (() => {
          const linkedCampaign = getLinkedCampaign(currentDonor);
          return (
            <div className="flex flex-col" style={{ maxHeight: '80vh' }}>

              {/* Sponsor header */}
              <div className="flex items-center gap-4 pb-3">
                <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xl font-bold shrink-0">
                  {(currentDonor.sponsor || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{currentDonor.sponsor}</h3>
                  <p className="text-sm text-gray-500 truncate">{currentDonor.project}</p>
                  {currentDonor.email && <p className="text-xs text-gray-400 truncate">{currentDonor.email}</p>}
                  {currentDonor.contact && <p className="text-xs text-gray-400 truncate">{currentDonor.contact}</p>}

                  {/* Linked campaign chip */}
                  {linkedCampaign && (
                    <button
                      onClick={() => handleGoToProject(linkedCampaign.id)}
                      className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {linkedCampaign.title}
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setProfileTab('details')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    profileTab === 'details'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setProfileTab('history')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    profileTab === 'history'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  History
                  {donorHistory.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                      {donorHistory.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ── Details Tab ── */}
              {profileTab === 'details' && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white rounded-xl border border-sky-200 shadow-sm">
                      <p className="text-[10px] text-sky-600 uppercase font-semibold tracking-wide mb-1">Amount</p>
                      <p className="text-xl font-bold text-sky-700">₱{Number(currentDonor.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Status</p>
                      <div className="mt-1">
                        <Badge variant={statusBadgeVariant(currentDonor.status)}>
                          {normalizeStatus(currentDonor.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Linked campaign detail card */}
                  {linkedCampaign && (
                    <div className="p-3.5 bg-violet-50 rounded-xl border border-violet-200 shadow-sm">
                      <p className="text-[10px] text-violet-600 uppercase font-semibold tracking-wide mb-2">Linked Campaign</p>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-violet-900 truncate">{linkedCampaign.title}</p>
                          {linkedCampaign.description && (
                            <p className="text-xs text-violet-700 mt-0.5 line-clamp-2">{linkedCampaign.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-violet-600">
                            {linkedCampaign.target && (
                              <span>Target: ₱{Number(linkedCampaign.target).toLocaleString()}</span>
                            )}
                            {linkedCampaign.status && (
                              <span className="capitalize">{linkedCampaign.status}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleGoToProject(linkedCampaign.id)}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Type', value: currentDonor.type },
                      { label: 'Schools / PMLs', value: currentDonor.units ?? '—' },
                      { label: 'Payment Date', value: formatDate(currentDonor.deliveryDate) },
                      { label: 'Due Date', value: formatDate(currentDonor.dueDate) },
                      { label: 'Tranches', value: currentDonor.tranches ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                    <div className="col-span-2 p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">Project Description</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{currentDonor.description ?? '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── History Tab ── */}
              {profileTab === 'history' && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                  {donorHistory.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">No history available.</div>
                  ) : (
                    donorHistory.map((snap, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Version {idx + 1}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(snap.saved_at)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-px bg-gray-100">
                          {[
                            { label: 'Sponsor', value: snap.sponsor },
                            { label: 'Program', value: snap.project },
                            { label: 'Amount', value: snap.amount !== undefined ? `₱${Number(snap.amount).toLocaleString()}` : '—' },
                            { label: 'Status', value: normalizeStatus(snap.status) },
                            { label: 'Type', value: snap.type },
                            { label: 'Beneficiaries', value: snap.units ?? '—' },
                            { label: 'Payment Date', value: formatDate(snap.deliveryDate) },
                            { label: 'Due Date', value: formatDate(snap.dueDate) },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-white px-4 py-3">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">{label}</p>
                              <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
                            </div>
                          ))}
                          {snap.description && (
                            <div className="col-span-2 bg-white px-4 py-3">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-0.5">Description</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{snap.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4 shrink-0">
                <Button variant="secondary" type="button" onClick={handleDownloadSummary}>Download PDF</Button>
                <Button type="button" onClick={() => setIsProfileOpen(false)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}