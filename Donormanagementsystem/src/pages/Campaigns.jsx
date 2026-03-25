import React, { useMemo, useRef, useState } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useData } from '../context/DataContext';

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const toInputDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export function Campaigns() {
  const {
    campaigns, getCampaignRaised, addCampaign, updateCampaign, deleteCampaign,
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const programFileInputRef = useRef(null);

  // ── filtered list ───────────────────────────────────────────────────────────
  const filteredCampaigns = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return (campaigns || []).filter(c =>
      String(c.title || '').toLowerCase().includes(q) ||
      String(c.description || '').toLowerCase().includes(q)
    );
  }, [campaigns, searchTerm]);

  // ── stats ───────────────────────────────────────────────────────────────────
  const totalTarget    = useMemo(() => (campaigns || []).reduce((s, c) => s + Number(c.target || 0), 0), [campaigns]);
  const totalRaised    = useMemo(() => (campaigns || []).reduce((s, c) => s + Number(getCampaignRaised(c.title) || 0), 0), [campaigns, getCampaignRaised]);
  const activeCount    = useMemo(() => (campaigns || []).filter(c => c.status === 'Active').length, [campaigns]);
  const completedCount = useMemo(() => (campaigns || []).filter(c => c.status === 'Completed').length, [campaigns]);

  // ── modal helpers ───────────────────────────────────────────────────────────
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCampaign(null);
    setUploadedFileName(null);
  };

  const handleEdit = (e, program) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentCampaign(program);
    setUploadedFileName(program.fileName || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('Are you sure you want to delete this program?')) await deleteCampaign(id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadedFileName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const programFile = programFileInputRef.current?.files[0] || null;

    const programData = {
      id: currentCampaign?.id,
      title: formData.get('title'),
      sponsor: formData.get('sponsor'),
      program: formData.get('program'),
      department: formData.get('department'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      target: parseFloat(formData.get('target') || '0'),
      description: formData.get('description'),
      status: formData.get('status') || 'Active',
      ...(programFile && { file: programFile, fileName: programFile.name }),
    };

    if (currentCampaign) await updateCampaign(programData);
    else await addCampaign(programData);

    closeModal();
    e.target.reset();
  };

  return (
    <div className="space-y-5 px-1">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Programs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all fundraising programs.</p>
        </div>
        <Button onClick={() => { closeModal(); setIsModalOpen(true); }} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />New Program
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
        {filteredCampaigns.map((program) => (
          <div key={program.id} className="relative group">
            <Link to={`/campaigns/${program.id}`} className="block h-full">
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2 pt-5 px-5">
                  <div className="flex justify-between items-center">
                    <Badge variant={program.status === 'Active' ? 'success' : 'secondary'}>{program.status}</Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{formatDate(program.endDate)}
                    </span>
                  </div>
                  <CardTitle className="mt-2.5 text-lg leading-snug group-hover:text-primary-600 transition-colors pr-10">
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900">₱{Number(getCampaignRaised(program.title) || 0).toLocaleString()}</span>
                      <span className="text-gray-400">of ₱{Number(program.target || 0).toLocaleString()}</span>
                    </div>
                    <ProgressBar value={Number(getCampaignRaised(program.title) || 0)} max={Number(program.target || 0)} />
                    <div className="flex justify-end text-xs text-gray-400">
                      {Number(program.target || 0) ? Math.round((Number(getCampaignRaised(program.title) || 0) / Number(program.target || 0)) * 100) : 0}% Funded
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => handleEdit(e, program)} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-amber-600 hover:bg-amber-50 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={(e) => handleDelete(e, program.id)} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filteredCampaigns.length === 0 && (
          <div className="col-span-full py-16 text-center text-sm text-gray-400">No programs found.</div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={currentCampaign ? 'Edit Program' : 'Create New Program'}>
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: '75vh' }}>
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <Input name="title" required placeholder="Enter program title..." defaultValue={currentCampaign?.title} />
          </div>

          {/* Phase 2 — Implementation Stage */}
          <div className="rounded-xl border border-primary-100 bg-primary-50/40 px-4 py-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold">2</span>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Implementation Stage</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name of Sponsor</label>
              <Input name="sponsor" placeholder="Enter sponsor name..." defaultValue={currentCampaign?.sponsor} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Program</label>
              <Input name="program" placeholder="Enter program name..." defaultValue={currentCampaign?.program} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department In-Charge</label>
              <Input name="department" placeholder="Enter department..." defaultValue={currentCampaign?.department} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                <Input name="startDate" type="date" defaultValue={toInputDate(currentCampaign?.startDate)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <Input name="endDate" type="date" required defaultValue={toInputDate(currentCampaign?.endDate)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload File</label>
              <div
                onClick={() => programFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
              >
                {uploadedFileName ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary-100 shrink-0">
                      <Upload className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{uploadedFileName}</p>
                      <p className="text-xs text-gray-400">Click to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-3 text-gray-400">
                    <Upload className="h-6 w-6 mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click to upload file</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, DOCX, XLSX up to 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={programFileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <Select name="status" defaultValue={currentCampaign?.status || 'Active'} options={[
                { label: 'Active', value: 'Active' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Paused', value: 'Paused' },
              ]} />
            </div>
          </div>

          {/* Goal Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
              <Input name="target" type="number" className="pl-7" placeholder="0.00" required min="1" defaultValue={currentCampaign?.target} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description"
              required
              defaultValue={currentCampaign?.description}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
              placeholder="Describe the goals and impact..."
            />
          </div>

          </div>

          <div className="flex justify-end gap-3 pt-3 mt-3 border-t border-gray-100 shrink-0">
            <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit">{currentCampaign ? 'Update Program' : 'Create Program'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}