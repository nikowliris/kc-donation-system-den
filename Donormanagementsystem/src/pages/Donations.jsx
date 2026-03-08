import React, { useState } from 'react';
import { Plus, Search, Filter, CreditCard, Edit2, Trash2, Repeat, Clock, Bell } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';

export function Donations() {
  const { donations, campaigns, donors, addDonation, updateDonation, deleteDonation } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [currentDonation, setCurrentDonation] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const overduePending = donations.filter(donation => {
    if (donation.status !== 'Pending') return false;
    const parsedDate = new Date(donation.date);
    if (Number.isNaN(parsedDate.getTime())) return false;
    return parsedDate < new Date();
  });

  const filteredDonations = donations.filter(donation => {
    const matchesSearch =
      donation.donor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.campaign.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || donation.type === typeFilter;
    const matchesCampaign = campaignFilter === 'All' || donation.campaign === campaignFilter;
    const matchesDate = !dateFilter ||
      donation.date === new Date(dateFilter).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    let matchesTab = true;
    if (activeTab === 'Recurring') matchesTab = donation.type === 'Recurring';
    if (activeTab === 'Pending') matchesTab = donation.status === 'Pending';
    return matchesSearch && matchesType && matchesCampaign && matchesDate && matchesTab;
  });

  const handleShowReceipt = (donation) => { setSelectedDonation(donation); setIsReceiptOpen(true); };
  const handleEditDonation = (donation) => { setCurrentDonation(donation); setIsModalOpen(true); };
  const handleDeleteDonation = (id) => {
    if (confirm('Are you sure you want to delete this donation record?')) deleteDonation(id);
  };
  const handleExport = () => alert('Exporting filtered donations to CSV...');
  const handleSendReminder = (donation) => {
    alert(`Notification sent for pending donation of ₱${donation.amount.toLocaleString()} from ${donation.donor}.`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const donationData = {
      id: currentDonation ? currentDonation.id : undefined,
      donor: formData.get('donor'),
      amount: formData.get('amount'),
      type: formData.get('type'),
      campaign: formData.get('campaign'),
      channel: formData.get('channel'),
      status: formData.get('status') || 'Completed',
      notes: formData.get('notes'),
      date: currentDonation ? currentDonation.date : undefined,
    };
    if (currentDonation) { updateDonation(donationData); } else { addDonation(donationData); }
    setIsModalOpen(false);
    setCurrentDonation(null);
    e.target.reset();
  };

  const tabs = [
    { id: 'All', label: 'All Donations', icon: CreditCard },
    { id: 'Recurring', label: 'Recurring', icon: Repeat },
    { id: 'Pending', label: 'Pending', icon: Clock },
  ];

  return (
    <div className="space-y-5 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Donation Tracking</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and manage incoming donations.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={() => setIsNotificationOpen(true)} className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {overduePending.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 min-w-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {overduePending.length}
              </span>
            )}
          </Button>
          <Button onClick={() => { setCurrentDonation(null); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Donation
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto -mb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'Pending' && overduePending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                {overduePending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-5">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Search by donor or project..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <div className="w-32">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { label: 'All Types', value: 'All' },
                    { label: 'One-time', value: 'One-time' },
                    { label: 'Recurring', value: 'Recurring' },
                  ]}
                />
              </div>
              <div className="w-40">
                <Select
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  options={[
                    { label: 'All Projects', value: 'All' },
                    ...campaigns.map((c) => ({ label: c.title, value: c.title })),
                  ]}
                />
              </div>
              <div className="w-36">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <Button variant="secondary" onClick={handleExport}>
                <Filter className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Donor</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Channel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredDonations.length > 0 ? (
                  filteredDonations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {donation.donor}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                        ₱{Number(donation.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          donation.type === 'Recurring'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {donation.type === 'Recurring' && <Repeat className="h-3 w-3 mr-1" />}
                          {donation.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[160px]">
                        <span className="block truncate">{donation.campaign}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {donation.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {donation.date}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={
                          donation.status === 'Completed' ? 'success' :
                          donation.status === 'Pending' ? 'warning' : 'danger'
                        }>
                          {donation.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleShowReceipt(donation)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="View Receipt"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditDonation(donation)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDonation(donation.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-400">
                      No donations found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCurrentDonation(null); }}
        title={currentDonation ? 'Edit Donation' : 'Record New Donation'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Donor</label>
            <Select
              name="donor"
              required
              defaultValue={currentDonation?.donor}
              options={[
                { label: 'Select Donor', value: '' },
                ...donors.map((donor) => ({ label: donor.name, value: donor.name })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                <Input
                  type="number"
                  name="amount"
                  className="pl-7"
                  placeholder="0.00"
                  required
                  min="1"
                  defaultValue={currentDonation?.amount}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Channel</label>
              <Select
                name="channel"
                defaultValue={currentDonation?.channel}
                options={[
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'GCash', value: 'GCash' },
                  { label: 'Credit Card', value: 'Credit Card' },
                  { label: 'PayPal', value: 'PayPal' },
                  { label: 'Cash', value: 'Cash' },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
              <Select
                name="campaign"
                required
                defaultValue={currentDonation?.campaign}
                options={[
                  { label: 'Select Project', value: '' },
                  ...campaigns.map((c) => ({ label: c.title, value: c.title })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Donation Type</label>
              <Select
                name="type"
                defaultValue={currentDonation?.type || (activeTab === 'Recurring' ? 'Recurring' : 'One-time')}
                options={[
                  { label: 'One-time', value: 'One-time' },
                  { label: 'Recurring', value: 'Recurring' },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <Select
              name="status"
              defaultValue={currentDonation?.status || (activeTab === 'Pending' ? 'Pending' : 'Completed')}
              options={[
                { label: 'Completed', value: 'Completed' },
                { label: 'Pending', value: 'Pending' },
                { label: 'Failed', value: 'Failed' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
            <textarea
              name="notes"
              defaultValue={currentDonation?.notes}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px] resize-none"
              placeholder="Any additional information..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => { setIsModalOpen(false); setCurrentDonation(null); }}>
              Cancel
            </Button>
            <Button type="submit">{currentDonation ? 'Update Donation' : 'Record Donation'}</Button>
          </div>
        </form>
      </Modal>

      {/* Receipt Modal */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Donation Receipt">
        {selectedDonation && (
          <div className="space-y-5">
            <div className="text-center pb-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-primary-700">Official Receipt</h3>
              <p className="text-xs text-gray-500 mt-0.5">Knowledge Channel Foundation, Inc.</p>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Receipt No.', value: `#${selectedDonation.id}`, mono: true },
                { label: 'Date', value: selectedDonation.date },
                { label: 'Donor Name', value: selectedDonation.donor, bold: true },
                { label: 'Project', value: selectedDonation.campaign },
                { label: 'Payment Channel', value: selectedDonation.channel },
              ].map(({ label, value, mono, bold }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={`${mono ? 'font-mono' : ''} ${bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-primary-700 text-xl">
                  ₱{Number(selectedDonation.amount).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500 italic text-center leading-relaxed">
              Thank you for your generous contribution to Knowledge Channel Foundation. Your support helps us provide quality education to every Filipino child.
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="secondary" type="button" onClick={() => window.print()}>Print Receipt</Button>
              <Button type="button" onClick={() => setIsReceiptOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notifications Modal */}
      <Modal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title="Pending Donation Alerts"
      >
        <div className="space-y-4">
          {overduePending.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-500">No overdue pending donations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Donor', 'Project', 'Due Date', 'Amount', ''].map((h) => (
                      <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === '' ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {overduePending.map((donation) => (
                    <tr key={donation.id} className="hover:bg-gray-50/60">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{donation.donor}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{donation.campaign}</td>
                      <td className="px-4 py-3 text-sm text-red-500 font-medium">{donation.date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">₱{Number(donation.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => handleSendReminder(donation)}>
                          Notify
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Button variant="secondary" type="button" onClick={() => setIsNotificationOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}