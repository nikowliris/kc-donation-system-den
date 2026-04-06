import React, { useState } from 'react';
import { Mail, Plus, Settings, Trash2, Save, Zap, X, FileText, BarChart2, Download, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import kcLogo from '../assets/1.png';

const defaultTemplates = [
  { id: 1, name: 'Donation Thank You', subject: 'Thank you for your generous donation!', body: 'Dear [Donor Name],\n\nThank you so much for your generous donation of [Amount] to [Campaign Name]. Your support makes a real difference in the lives of Filipino learners.\n\nWith gratitude,\nKnowledge Channel Foundation', lastEdited: '2 days ago' },
  { id: 2, name: 'Campaign Update', subject: 'Update on [Campaign Name]', body: 'Dear [Donor Name],\n\nWe wanted to share an exciting update on [Campaign Name]. Thanks to your support, we have reached [Progress]% of our goal!\n\nThank you for believing in our mission.\n\nWarm regards,\nKnowledge Channel Foundation', lastEdited: '1 week ago' },
  { id: 3, name: 'Welcome New Donor', subject: 'Welcome to the Knowledge Channel family', body: 'Dear [Donor Name],\n\nWelcome to the Knowledge Channel Foundation family! We are thrilled to have you as a supporter of quality education for every Filipino child.\n\nWith appreciation,\nKnowledge Channel Foundation', lastEdited: '3 weeks ago' },
  { id: 4, name: 'Year-End Appeal', subject: 'Help us finish the year strong', body: 'Dear [Donor Name],\n\nAs the year comes to a close, we reflect on the incredible impact your support has made. Would you consider making one more gift to help us finish the year strong?\n\nThankfully,\nKnowledge Channel Foundation', lastEdited: '1 month ago' },
];

const defaultWorkflows = [
  { id: 1, name: 'New Donor Welcome Series', trigger: 'New Donor Added', status: 'Active', steps: 3, description: 'Automatically sends a welcome email series to new donors over 3 days.', delay: '24', templateId: 3, personInCharge: 'Donor Relations Team' },
  { id: 2, name: 'Donation Receipt', trigger: 'Donation Received', status: 'Active', steps: 1, description: 'Sends an instant thank-you receipt when a donation is recorded.', delay: '0', templateId: 1, personInCharge: 'Finance Team' },
  { id: 3, name: 'Lapsed Donor Re-engagement', trigger: 'No Donation > 6 months', status: 'Paused', steps: 2, description: 'Re-engages donors who have not donated in over 6 months.', delay: '48', templateId: 2, personInCharge: 'Donor Relations Team' },
  { id: 4, name: 'Billing Statement Request', trigger: 'Billing Statement Requested', status: 'Active', steps: 1, description: 'Sends a billing statement to the sponsor upon request, including payment details and due date.', delay: '0', templateId: null, personInCharge: 'Finance Team', type: 'billing' },
  { id: 5, name: 'Progress Report Dispatch', trigger: 'Progress Report Due', status: 'Active', steps: 1, description: 'Sends a program progress report to sponsors at defined intervals.', delay: '0', templateId: null, personInCharge: 'Programs Team', type: 'progress' },
];

// ─── BILLING STATEMENT MODAL ──────────────────────────────────────────────────
function BillingStatementModal({ donors, onClose }) {
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [generated, setGenerated] = useState(false);

  const selectedDonor = donors.find((d) => String(d.id) === String(selectedDonorId));

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).slice(0, 10);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleGeneratePDF = () => {
    if (!selectedDonor) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(230, 126, 0);
    doc.rect(0, 0, pageW, 3, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 3, pageW, 36, 'F');
    doc.addImage(kcLogo, 'PNG', 12, 7, 22, 22);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLING STATEMENT', 38, 16);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Knowledge Channel Foundation, Inc.', 38, 22);
    doc.text('Congressional Ave., Quezon City, Metro Manila', 38, 27);
    doc.text('finance@knowledgechannel.org', 38, 32);
    const stmtNo = `BS-${Date.now().toString().slice(-6)}`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Statement No.', pageW - 14, 13, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.text(stmtNo, pageW - 14, 19, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Date', pageW - 14, 27, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.text(formatDate(statementDate), pageW - 14, 33, { align: 'right' });
    doc.setFillColor(255, 193, 7);
    doc.rect(0, 39, pageW, 2, 'F');
    doc.setFillColor(230, 126, 0);
    doc.rect(0, 41, pageW, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 100, 0);
    doc.text('BILL TO', 14, 52);
    doc.setDrawColor(230, 126, 0);
    doc.setLineWidth(0.4);
    doc.line(14, 54, 38, 54);
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(selectedDonor.sponsor || '—', 14, 62);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    let billY = 69;
    if (selectedDonor.email)   { doc.text(selectedDonor.email,   14, billY); billY += 6; }
    if (selectedDonor.contact) { doc.text(selectedDonor.contact, 14, billY); }
    doc.setFillColor(255, 193, 7);
    doc.rect(14, 82, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);
    doc.text('DESCRIPTION', 17, 87.5);
    doc.text('PROGRAM',     88, 87.5);
    doc.text('DUE DATE',   130, 87.5);
    doc.text('AMOUNT', pageW - 16, 87.5, { align: 'right' });
    doc.setFillColor(255, 252, 240);
    doc.rect(14, 90, pageW - 28, 16, 'F');
    doc.setDrawColor(240, 200, 100);
    doc.rect(14, 90, pageW - 28, 16, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    const desc = selectedDonor.description ? doc.splitTextToSize(selectedDonor.description, 65) : ['—'];
    doc.text(desc, 17, 97);
    doc.text(selectedDonor.project || '—', 88, 97);
    doc.text(formatDate(selectedDonor.dueDate), 130, 97);
    doc.setFont('helvetica', 'bold');
    doc.text(`PHP ${Number(selectedDonor.amount || 0).toLocaleString()}`, pageW - 16, 97, { align: 'right' });
    if (selectedDonor.tranches && Number(selectedDonor.tranches) > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(130, 80, 0);
      const perTranche = Math.round(Number(selectedDonor.amount || 0) / Number(selectedDonor.tranches));
      doc.text(`${selectedDonor.tranches} tranche${selectedDonor.tranches > 1 ? 's' : ''} · PHP ${perTranche.toLocaleString()} each`, 17, 103);
    }
    doc.setDrawColor(220, 180, 60);
    doc.setLineWidth(0.3);
    doc.line(14, 112, pageW - 14, 112);
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', pageW - 55, 121);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(`PHP ${Number(selectedDonor.amount || 0).toLocaleString()}`, pageW - 16, 121, { align: 'right' });
    doc.setFillColor(230, 126, 0);
    doc.roundedRect(pageW - 78, 125, 64, 11, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL DUE:', pageW - 76, 132);
    doc.text(`PHP ${Number(selectedDonor.amount || 0).toLocaleString()}`, pageW - 16, 132, { align: 'right' });
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(14, 142, pageW - 28, 50, 2, 2, 'F');
    doc.setDrawColor(230, 200, 100);
    doc.roundedRect(14, 142, pageW - 28, 50, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 100, 0);
    doc.text('PAYMENT DETAILS', 20, 151);
    doc.setDrawColor(230, 126, 0);
    doc.setLineWidth(0.4);
    doc.line(20, 153, 64, 153);
    doc.setLineWidth(0.2);
    const pdRows = [
      ['Bank',         'BDO Unibank, Inc.'],
      ['Account Name', 'Knowledge Channel Foundation, Inc.'],
      ['Account No.',  '003-480-3865'],
      ['Payment Due',  formatDate(selectedDonor.dueDate)],
      ...(selectedDonor.deliveryDate ? [['Date Paid', formatDate(selectedDonor.deliveryDate)]] : []),
    ];
    let pdY = 161;
    pdRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(`${label}:`, 20, pdY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(value, 58, pdY);
      pdY += 7;
    });
    if (notes.trim()) {
      const notesY = 200;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 100, 0);
      doc.text('NOTES', 14, notesY);
      doc.setDrawColor(230, 126, 0);
      doc.setLineWidth(0.4);
      doc.line(14, notesY + 2, 32, notesY + 2);
      doc.setLineWidth(0.2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(notes, pageW - 28);
      doc.text(noteLines, 14, notesY + 9);
    }
    doc.setFillColor(230, 126, 0);
    doc.rect(0, 278, pageW, 1.5, 'F');
    doc.setFillColor(255, 193, 7);
    doc.rect(0, 279.5, pageW, 18, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);
    doc.text('Thank you for your generous support of quality education for every Filipino child.', pageW / 2, 287, { align: 'center' });
    doc.text('Knowledge Channel Foundation  ·  finance@knowledgechannel.org  ·  www.knowledgechannel.org', pageW / 2, 293, { align: 'center' });
    const safeName = String(selectedDonor.sponsor || 'sponsor').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`billing-statement-${safeName}-${stmtNo}.pdf`);
    setGenerated(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Billing Statement Request</h2>
              <p className="text-xs text-gray-400">Generate a billing statement for a sponsor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Sponsor *</label>
            <select
              value={selectedDonorId}
              onChange={(e) => { setSelectedDonorId(e.target.value); setGenerated(false); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Choose a sponsor —</option>
              {donors.map((d) => (
                <option key={d.id} value={d.id}>{d.sponsor} {d.project ? `· ${d.project}` : ''}</option>
              ))}
            </select>
          </div>
          {selectedDonor && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Sponsor Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Sponsor</p>
                  <p className="font-medium text-gray-900">{selectedDonor.sponsor}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Program</p>
                  <p className="font-medium text-gray-900">{selectedDonor.project || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Amount</p>
                  <p className="font-bold text-blue-700">₱{Number(selectedDonor.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Due Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedDonor.dueDate ? new Date(selectedDonor.dueDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                  </p>
                </div>
                {selectedDonor.email && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Email</p>
                    <p className="font-medium text-gray-900">{selectedDonor.email}</p>
                  </div>
                )}
                {selectedDonor.tranches > 0 && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Tranches</p>
                    <p className="font-medium text-gray-900">
                      {selectedDonor.tranches} tranche{selectedDonor.tranches > 1 ? 's' : ''} · ₱{Math.round(Number(selectedDonor.amount || 0) / Number(selectedDonor.tranches)).toLocaleString()} each
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Statement Date</label>
            <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Additional Notes <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="e.g. Please remit payment within 15 days..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {generated && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <p className="text-sm text-green-700 font-medium">Billing statement downloaded successfully!</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">Cancel</button>
          <div className="flex gap-2">
            <button onClick={handleGeneratePDF} disabled={!selectedDonorId}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Download className="h-4 w-4" />
              {generated ? 'Download Again' : 'Generate & Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROGRESS REPORT MODAL ────────────────────────────────────────────────────
function ProgressReportModal({ donors, campaigns, onClose }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('');
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [generated, setGenerated] = useState(false);

  const selectedCampaign = campaigns.find((c) => String(c.id) === String(selectedCampaignId));
  const linkedDonors = selectedCampaignId ? donors.filter((d) => String(d.campaign_id) === String(selectedCampaignId)) : [];
  const totalRaised = linkedDonors.reduce((s, d) => s + Number(d.amount || 0), 0);
  const target = Number(selectedCampaign?.target || 0);
  const pct = target ? Math.min(100, Math.round((totalRaised / target) * 100)) : 0;

  const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).slice(0, 10);
    return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleGeneratePDF = () => {
    if (!selectedCampaign) return;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(230, 126, 0);
    doc.rect(0, 0, pageW, 3, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 3, pageW, 36, 'F');
    doc.addImage(kcLogo, 'PNG', 12, 7, 22, 22);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGRESS REPORT', 38, 16);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Knowledge Channel Foundation, Inc.', 38, 22);
    doc.text('Congressional Ave., Quezon City, Metro Manila', 38, 27);
    doc.text('programs@knowledgechannel.org', 38, 32);
    const rptNo = `PR-${Date.now().toString().slice(-6)}`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Report No.', pageW - 14, 13, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.text(rptNo, pageW - 14, 19, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Date', pageW - 14, 27, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.text(formatDate(reportDate), pageW - 14, 33, { align: 'right' });
    doc.setFillColor(255, 193, 7);
    doc.rect(0, 39, pageW, 2, 'F');
    doc.setFillColor(230, 126, 0);
    doc.rect(0, 41, pageW, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 100, 0);
    doc.text('PROGRAM DETAILS', 14, 52);
    doc.setDrawColor(230, 126, 0);
    doc.setLineWidth(0.4);
    doc.line(14, 54, 56, 54);
    doc.setLineWidth(0.2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(selectedCampaign.title || '—', 14, 63);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    let detailY = 71;
    if (selectedCampaign.department) { doc.text(`Department: ${selectedCampaign.department}`, 14, detailY); detailY += 6; }
    if (selectedCampaign.sponsor)    { doc.text(`Lead Sponsor: ${selectedCampaign.sponsor}`, 14, detailY); detailY += 6; }
    if (period)                      { doc.text(`Reporting Period: ${period}`, 14, detailY); detailY += 6; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Status', pageW - 14, 52, { align: 'right' });
    doc.setFillColor(selectedCampaign.status === 'Active' ? 34 : 150, selectedCampaign.status === 'Active' ? 197 : 150, selectedCampaign.status === 'Active' ? 94 : 150);
    doc.roundedRect(pageW - 38, 55, 24, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(selectedCampaign.status || 'Active', pageW - 26, 60.5, { align: 'center' });
    if (selectedCampaign.startDate || selectedCampaign.endDate) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text(`Duration: ${formatDate(selectedCampaign.startDate)} — ${formatDate(selectedCampaign.endDate)}`, 14, detailY);
      detailY += 6;
    }
    const tableTop = Math.max(detailY + 4, 82);
    doc.setFillColor(255, 193, 7);
    doc.rect(14, tableTop, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);
    doc.text('FUNDING PROGRESS', 17, tableTop + 5.5);
    const rowTop = tableTop + 8;
    doc.setFillColor(255, 252, 240);
    doc.rect(14, rowTop, pageW - 28, 20, 'F');
    doc.setDrawColor(240, 200, 100);
    doc.rect(14, rowTop, pageW - 28, 20, 'S');
    const barX = 17; const barY = rowTop + 4; const barW = pageW - 34; const barH = 5;
    doc.setFillColor(230, 220, 200);
    doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
    const fill = Math.max(3, (barW * pct) / 100);
    doc.setFillColor(230, 126, 0);
    doc.roundedRect(barX, barY, fill, barH, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(`Total Raised: PHP ${totalRaised.toLocaleString()}`, 17, rowTop + 15);
    doc.text(`Target: PHP ${target.toLocaleString()}`, pageW / 2 - 10, rowTop + 15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 100, 0);
    doc.text(`${pct}% Funded`, pageW - 16, rowTop + 15, { align: 'right' });
    let y = rowTop + 28;
    if (linkedDonors.length > 0) {
      doc.setFillColor(255, 193, 7);
      doc.rect(14, y, pageW - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 40, 0);
      doc.text('LINKED SPONSORS', 17, y + 5.5);
      doc.text('PROGRAM', 78, y + 5.5);
      doc.text('STATUS', 126, y + 5.5);
      doc.text('AMOUNT', pageW - 16, y + 5.5, { align: 'right' });
      y += 8;
      linkedDonors.slice(0, 10).forEach((d, i) => {
        doc.setFillColor(i % 2 === 0 ? 255 : 255, i % 2 === 0 ? 252 : 255, i % 2 === 0 ? 240 : 255);
        doc.rect(14, y, pageW - 28, 8, 'F');
        doc.setDrawColor(240, 200, 100);
        doc.setLineWidth(0.1);
        doc.rect(14, y, pageW - 28, 8, 'S');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(20, 20, 20);
        doc.text(String(d.sponsor || '—').substring(0, 26), 17, y + 5.5);
        doc.text(String(d.project || '—').substring(0, 20), 78, y + 5.5);
        doc.text(String(d.status || '—').substring(0, 12), 126, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`PHP ${Number(d.amount || 0).toLocaleString()}`, pageW - 16, y + 5.5, { align: 'right' });
        y += 8;
      });
      if (linkedDonors.length > 10) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(130, 80, 0);
        doc.text(`+ ${linkedDonors.length - 10} more sponsor(s) not shown`, 17, y + 5);
        y += 10;
      }
    } else {
      doc.setFillColor(255, 252, 240);
      doc.rect(14, y, pageW - 28, 10, 'F');
      doc.setDrawColor(240, 200, 100);
      doc.rect(14, y, pageW - 28, 10, 'S');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(150, 100, 50);
      doc.text('No linked sponsors found for this program.', 17, y + 6.5);
      y += 10;
    }
    const addNarrativeSection = (title, content) => {
      if (!content?.trim()) return;
      y += 6;
      if (y > 255) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 100, 0);
      doc.text(title, 14, y);
      doc.setDrawColor(230, 126, 0);
      doc.setLineWidth(0.4);
      doc.line(14, y + 2, 14 + title.length * 2.1, y + 2);
      doc.setLineWidth(0.2);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(content, pageW - 28);
      if (y + lines.length * 5 > 265) { doc.addPage(); y = 20; }
      doc.text(lines, 14, y);
      y += lines.length * 5;
    };
    addNarrativeSection('HIGHLIGHTS & ACCOMPLISHMENTS', highlights);
    addNarrativeSection('CHALLENGES', challenges);
    addNarrativeSection('NEXT STEPS', nextSteps);
    if (selectedCampaign.description) addNarrativeSection('PROGRAM DESCRIPTION', selectedCampaign.description);
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFillColor(230, 126, 0);
      doc.rect(0, 278, pageW, 1.5, 'F');
      doc.setFillColor(255, 193, 7);
      doc.rect(0, 279.5, pageW, 18, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 40, 0);
      doc.text('Thank you for your generous support of quality education for every Filipino child.', pageW / 2, 287, { align: 'center' });
      doc.text(`Knowledge Channel Foundation  ·  programs@knowledgechannel.org  ·  www.knowledgechannel.org  ·  Page ${i} of ${totalPages}`, pageW / 2, 293, { align: 'center' });
    }
    const safeName = String(selectedCampaign.title || 'program').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    doc.save(`progress-report-${safeName}-${rptNo}.pdf`);
    setGenerated(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <BarChart2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Progress Report Dispatch</h2>
              <p className="text-xs text-gray-400">Generate a program progress report for sponsors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Program / Campaign *</label>
            <select value={selectedCampaignId}
              onChange={(e) => { setSelectedCampaignId(e.target.value); setGenerated(false); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">— Choose a program —</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          {selectedCampaign && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 space-y-2">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Program Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Program</p>
                  <p className="font-medium text-gray-900">{selectedCampaign.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Target</p>
                  <p className="font-bold text-orange-600">₱{target.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Status</p>
                  <p className="font-medium text-gray-900">{selectedCampaign.status || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Raised</p>
                  <p className="font-medium text-gray-900">₱{totalRaised.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">Linked Sponsors</p>
                  <p className="font-medium text-gray-900">{linkedDonors.length} sponsor{linkedDonors.length !== 1 ? 's' : ''}</p>
                </div>
                {(selectedCampaign.startDate || selectedCampaign.endDate) && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">Duration</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedCampaign.startDate)} — {formatDate(selectedCampaign.endDate)}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Funding Progress</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-orange-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-orange-600">{pct}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Report Date</label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reporting Period <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)}
                placeholder="e.g. Q1 2026"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Highlights & Accomplishments <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3}
              placeholder="e.g. Distributed 270 PML units to 15 schools in Region IV-A..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Challenges <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={challenges} onChange={(e) => setChallenges(e.target.value)} rows={2}
              placeholder="e.g. Delayed delivery due to weather conditions..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Next Steps <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} rows={2}
              placeholder="e.g. Complete remaining deliveries by end of Q2..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          {generated && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <p className="text-sm text-green-700 font-medium">Progress report downloaded successfully!</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">Cancel</button>
          <div className="flex gap-2">
            <button onClick={handleGeneratePDF} disabled={!selectedCampaignId}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Download className="h-4 w-4" />
              {generated ? 'Download Again' : 'Generate & Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TEMPLATE MODAL ───────────────────────────────────────────────────────────
function TemplateModal({ template, onClose, onSave }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');

  const handleSave = () => {
    if (!name.trim() || !subject.trim()) return;
    onSave({ ...template, name, subject, body, lastEdited: 'Just now' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">{template?.id ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Template Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Donation Thank You"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Thank you for your donation!"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Body</label>
            <p className="text-[11px] text-gray-400 mb-1">Use placeholders: [Donor Name], [Amount], [Campaign Name], [Progress]</p>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="Write your email body here..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !subject.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {template?.id ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WORKFLOW MODAL ───────────────────────────────────────────────────────────
function WorkflowModal({ workflow, templates, onClose, onSave }) {
  const [name, setName] = useState(workflow?.name || '');
  const [trigger, setTrigger] = useState(workflow?.trigger || 'New Donor Added');
  const [status, setStatus] = useState(workflow?.status || 'Active');
  const [description, setDescription] = useState(workflow?.description || '');
  const [delay, setDelay] = useState(workflow?.delay || '0');
  const [templateId, setTemplateId] = useState(workflow?.templateId || '');
  const [personInCharge, setPersonInCharge] = useState(workflow?.personInCharge || '');

  const triggerOptions = [
    'New Donor Added', 'Donation Received', 'No Donation > 3 months',
    'No Donation > 6 months', 'Campaign Goal Reached', 'Campaign Ended',
    'Billing Statement Requested', 'Progress Report Due',
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ ...workflow, name, trigger, status, description, delay, templateId: templateId ? Number(templateId) : null, personInCharge, steps: workflow?.steps || 1 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Configure Workflow</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Workflow Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trigger</label>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {triggerOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Select a template —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Person in Charge</label>
            <input type="text" value={personInCharge} onChange={(e) => setPersonInCharge(e.target.value)}
              placeholder="e.g. Finance Team, John Doe"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Send Delay (hours after trigger)</label>
            <input type="number" min="0" value={delay} onChange={(e) => setDelay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-[11px] text-gray-400 mt-1">0 = send immediately</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what this workflow does..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-3">
              {['Active', 'Paused'].map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    status === s
                      ? s === 'Active' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-100 border-gray-400 text-gray-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            Save Workflow
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WORKFLOW ICON ────────────────────────────────────────────────────────────
function WorkflowIcon({ workflow }) {
  const isActive = workflow.status === 'Active';
  if (workflow.type === 'billing') return (
    <div className={`p-2 rounded-lg ${isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
      <FileText className={`h-6 w-6 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
    </div>
  );
  if (workflow.type === 'progress') return (
    <div className={`p-2 rounded-lg ${isActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
      <BarChart2 className={`h-6 w-6 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
    </div>
  );
  return (
    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
      <Zap className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
    </div>
  );
}

// ─── WORKFLOW CARD ────────────────────────────────────────────────────────────
function WorkflowCard({ workflow, templates, onConfigure, onTrigger }) {
  const isActive = workflow.status === 'Active';
  const triggerColor = workflow.type === 'billing'
    ? 'bg-orange-50 text-orange-700 border border-orange-200'
    : workflow.type === 'progress'
    ? 'bg-orange-50 text-orange-700 border border-orange-200'
    : 'bg-blue-50 text-blue-700 border border-blue-200';

  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start space-x-4 min-w-0">
          <WorkflowIcon workflow={workflow} />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-gray-900">{workflow.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${triggerColor}`}>
                <span className="opacity-60">Trigger:</span> {workflow.trigger}
              </span>
              <span className="text-xs text-gray-400">
                {workflow.steps} step{workflow.steps !== 1 ? 's' : ''}
                {Number(workflow.delay) > 0 && ` · ${workflow.delay}h delay`}
              </span>
            </div>
            {workflow.description && <p className="text-xs text-gray-400 mt-1">{workflow.description}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {workflow.templateId && (
                <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                  <Mail className="h-3 w-3" />
                  {templates.find((t) => t.id === workflow.templateId)?.name || 'Unknown'}
                </span>
              )}
              {workflow.personInCharge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <span className="opacity-60">In charge:</span> {workflow.personInCharge}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 mt-0.5">
          <Badge variant={isActive ? 'success' : 'secondary'}>{workflow.status}</Badge>
          {workflow.type === 'billing' && isActive && (
            <button onClick={onTrigger}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors">
              <Send className="h-3.5 w-3.5" />Run
            </button>
          )}
          {workflow.type === 'progress' && isActive && (
            <button onClick={onTrigger}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors">
              <Send className="h-3.5 w-3.5" />Run
            </button>
          )}
          <Button variant="outline" size="sm" onClick={onConfigure}>Configure</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function Communications() {
  const { donors, campaigns } = useData();
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState(defaultTemplates);
  const [templateModal, setTemplateModal] = useState(null);
  const [workflows, setWorkflows] = useState(defaultWorkflows);
  const [workflowModal, setWorkflowModal] = useState(null);
  const [billingModal, setBillingModal] = useState(false);
  const [progressModal, setProgressModal] = useState(false);

  const handleSaveTemplate = (saved) => {
    if (saved.id && templates.find((t) => t.id === saved.id)) {
      setTemplates((prev) => prev.map((t) => t.id === saved.id ? saved : t));
    } else {
      setTemplates((prev) => [...prev, { ...saved, id: Date.now() }]);
    }
  };

  const handleDeleteTemplate = (id) => {
    if (!confirm('Delete this template?')) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveWorkflow = (saved) => {
    setWorkflows((prev) => prev.map((w) => w.id === saved.id ? saved : w));
  };

  const generalWorkflows = workflows.filter((w) => !w.type);
  const documentWorkflows = workflows.filter((w) => w.type === 'billing' || w.type === 'progress');

  return (
    <div className="space-y-6">
      {templateModal !== null && (
        <TemplateModal template={templateModal === 'new' ? null : templateModal}
          onClose={() => setTemplateModal(null)} onSave={handleSaveTemplate} />
      )}
      {workflowModal !== null && (
        <WorkflowModal workflow={workflowModal} templates={templates}
          onClose={() => setWorkflowModal(null)} onSave={handleSaveWorkflow} />
      )}
      {billingModal && (
        <BillingStatementModal donors={donors || []} onClose={() => setBillingModal(false)} />
      )}
      {progressModal && (
        <ProgressReportModal donors={donors || []} campaigns={campaigns || []} onClose={() => setProgressModal(false)} />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500">Manage email templates and automation workflows.</p>
        </div>
        {activeTab === 'templates' && (
          <Button onClick={() => setTemplateModal('new')}>
            <Plus className="h-4 w-4 mr-2" />New Template
          </Button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[{ id: 'templates', label: 'Templates', icon: Mail }, { id: 'automation', label: 'Automation', icon: Settings }].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`${activeTab === id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="group-hover:text-primary-600 transition-colors">{template.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setTemplateModal(template); }}>Edit</Button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Subject</span>
                    <p className="text-sm text-gray-700">{template.subject}</p>
                  </div>
                  {template.body && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">Preview</span>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{template.body}</p>
                    </div>
                  )}
                  {/* ── UPDATED: clickable mail icon ── */}
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span>Last edited: {template.lastEdited}</span>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(template.subject)}&body=${encodeURIComponent(template.body)}`}
                      onClick={(e) => e.stopPropagation()}
                      title="Compose email with this template"
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card onClick={() => setTemplateModal('new')}
            className="border-dashed border-2 bg-gray-50 flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">Create new template</span>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">General</h3>
            <div className="space-y-3">
              {generalWorkflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} templates={templates}
                  onConfigure={() => setWorkflowModal(workflow)} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Document Requests</h3>
            <div className="space-y-3">
              {documentWorkflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} templates={templates}
                  onConfigure={() => setWorkflowModal(workflow)}
                  onTrigger={workflow.type === 'billing' ? () => setBillingModal(true) : workflow.type === 'progress' ? () => setProgressModal(true) : undefined} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}