import React, { useEffect, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, Edit, Trash, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import { useLocation } from 'react-router-dom';

const PAGE_SIZE = 10;

export function Donors() {
  const { donors, donations, addDonor, updateDonor, deleteDonor, getDonorTotal } = useData();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentDonor, setCurrentDonor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const formatDate = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val).slice(0, 10);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const openDonorId = location.state?.openDonorId;
    if (!openDonorId) return;
    const found = (donors || []).find((d) => String(d.id) === String(openDonorId));
    if (found) {
      setCurrentDonor(found);
      setIsProfileOpen(true);
    }
  }, [location.state, donors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const normalizeStatus = (s) => {
    const v = String(s || '').trim().toLowerCase();
    if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
    if (v === 'inactive') return 'Inactive';
    if (v === 'active') return 'Active';
    return s || 'Active';
  };

  const statusBadgeVariant = (status) => {
    const s = normalizeStatus(status);
    if (s === 'Active') return 'success';
    if (s === 'Completed') return 'success';
    return 'secondary';
  };

  const filteredDonors = donors.filter((row) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (row.project || '').toLowerCase().includes(s) ||
      (row.description || '').toLowerCase().includes(s) ||
      (row.sponsor || '').toLowerCase().includes(s) ||
      String(row.deliveryDate || '').toLowerCase().includes(s) ||
      String(row.dueDate || '').toLowerCase().includes(s) ||
      String(row.units ?? '').toLowerCase().includes(s) ||
      String(row.amount ?? '').toLowerCase().includes(s) ||
      String(row.type || '').toLowerCase().includes(s) ||
      String(row.status || '').toLowerCase().includes(s);
    const matchesType = typeFilter === 'All' || row.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDonors.length / PAGE_SIZE));
  const paginatedDonors = filteredDonors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleViewProfile = (donor) => { setCurrentDonor(donor); setIsProfileOpen(true); };
  const handleAddDonor = () => { setCurrentDonor(null); setIsModalOpen(true); };
  const handleEditDonor = (donor) => { setCurrentDonor(donor); setIsModalOpen(true); };
  const handleDeleteDonor = (id) => {
    if (confirm('Are you sure you want to delete this record?')) deleteDonor(id);
  };

  const handleDownloadSummary = () => {
    if (!currentDonor) return;
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
    doc.setFontSize(12);
    doc.text(`Amount: ₱${Number(currentDonor.amount || 0).toLocaleString()}`, 20, 91);
    doc.setFontSize(11);
    doc.text('Project Description:', 20, 106);
    const desc = String(currentDonor.description || '-');
    const lines = doc.splitTextToSize(desc, 170);
    doc.text(lines, 20, 114);
    const fileSafeName = String(currentDonor.project || currentDonor.sponsor || 'record')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`${fileSafeName}-record-summary.pdf`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
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
    };
    if (currentDonor) { updateDonor(newDonor); } else { addDonor(newDonor); }
    setIsModalOpen(false);
  };

  const startRecord = filteredDonors.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, filteredDonors.length);

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
                placeholder="Search project, sponsor, description..."
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
                  { label: 'Individual', value: 'Individual' },
                  { label: 'Corporate', value: 'Corporate' },
                  { label: 'Organization', value: 'Organization' },
                ]}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    { label: 'Project', align: 'left' },
                    { label: 'Description', align: 'left' },
                    { label: 'Schools / PMLs', align: 'center' },
                    { label: 'Delivery Date', align: 'left' },
                    { label: 'Due Date', align: 'left' },
                    { label: 'Sponsor', align: 'left' },
                    { label: 'Amount', align: 'right' },
                    { label: 'Type', align: 'left' },
                    { label: 'Status', align: 'left' },
                    { label: 'Actions', align: 'center' },
                  ].map(({ label, align }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-${align} text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-50">
                {paginatedDonors.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap max-w-[140px] truncate">
                      {row.project}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[180px]">
                      <span className="line-clamp-2">{row.description}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 text-center whitespace-nowrap">
                      {row.units ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(row.deliveryDate)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(row.dueDate)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-900 max-w-[140px]">
                      <span className="block truncate">{row.sponsor}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                      ₱{Number(row.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={statusBadgeVariant(row.status)}>
                        {normalizeStatus(row.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
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
                    </td>
                  </tr>
                ))}

                {paginatedDonors.length === 0 && (
                  <tr>
                    <td className="px-4 py-12 text-center text-sm text-gray-400" colSpan={10}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{startRecord}–{endRecord}</span> of{' '}
              <span className="font-medium text-gray-700">{filteredDonors.length}</span> records
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentDonor ? 'Edit Record' : 'Add New Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
              <Input name="project" defaultValue={currentDonor?.project} placeholder="e.g. 1ACCESS" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <Input name="email" type="email" defaultValue={currentDonor?.email || ''} placeholder="e.g. sponsor@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Description</label>
            <Input name="description" defaultValue={currentDonor?.description} placeholder="e.g. KTV in Lian Batangas..." required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">No. of Schools / PMLs</label>
              <Input name="units" type="number" defaultValue={currentDonor?.units ?? 0} placeholder="e.g. 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Date</label>
              <Input
                name="deliveryDate"
                type="date"
                defaultValue={formatDate(currentDonor?.deliveryDate) === '-' ? '' : formatDate(currentDonor?.deliveryDate)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <Input
                name="dueDate"
                type="date"
                defaultValue={formatDate(currentDonor?.dueDate) === '-' ? '' : formatDate(currentDonor?.dueDate)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sponsor</label>
            <Input name="sponsor" defaultValue={currentDonor?.sponsor} placeholder="e.g. EMAR CORP." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
              <Input name="amount" type="number" defaultValue={currentDonor?.amount ?? 0} placeholder="e.g. 150000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <Select
                name="type"
                defaultValue={currentDonor?.type || 'Individual'}
                options={[
                  { label: 'Individual', value: 'Individual' },
                  { label: 'Corporate', value: 'Corporate' },
                  { label: 'Organization', value: 'Organization' },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <Select
              name="status"
              defaultValue={normalizeStatus(currentDonor?.status || 'Active')}
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Done', value: 'Done' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Record</Button>
          </div>
        </form>
      </Modal>

      {/* Profile/Details Modal */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Record Details">
        {currentDonor && (
          <div className="space-y-5">
            {/* Sponsor header */}
            <div className="flex items-center gap-4 pb-1">
              <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xl font-bold shrink-0">
                {(currentDonor.sponsor || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{currentDonor.sponsor}</h3>
                <p className="text-sm text-gray-500 truncate">{currentDonor.project}</p>
                {currentDonor.email && (
                  <p className="text-xs text-gray-400 truncate">{currentDonor.email}</p>
                )}
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-100">
                <p className="text-[10px] text-sky-600 uppercase font-semibold tracking-wide mb-1">Amount</p>
                <p className="text-xl font-bold text-sky-700">₱{Number(currentDonor.amount || 0).toLocaleString()}</p>
              </div>
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Status</p>
                <p className="text-xl font-bold text-gray-900">{normalizeStatus(currentDonor.status)}</p>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Type', value: currentDonor.type },
                { label: 'Schools / PMLs', value: currentDonor.units ?? '—' },
                { label: 'Delivery Date', value: formatDate(currentDonor.deliveryDate) },
                { label: 'Due Date', value: formatDate(currentDonor.dueDate) },
              ].map(({ label, value }) => (
                <div key={label} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
              <div className="col-span-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1.5">Project Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{currentDonor.description ?? '—'}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <Button variant="secondary" type="button" onClick={handleDownloadSummary}>
                Download PDF
              </Button>
              <Button type="button" onClick={() => setIsProfileOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}