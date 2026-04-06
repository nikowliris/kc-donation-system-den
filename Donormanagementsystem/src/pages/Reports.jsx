import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Download, Calendar, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import kcLogo from '../assets/1.png';

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PAGE_SIZE = 10;

const normalizeStatus = (s) => {
  const v = String(s || '').trim().toLowerCase();
  if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
  if (v === 'inactive') return 'Inactive';
  if (v === 'active') return 'Active';
  return s || 'Active';
};

const formatDate = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

export function Reports() {
  const { donors } = useData();

  // ── Global chart filters ──────────────────────────────────────────────────
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // ── Per-column table filters ──────────────────────────────────────────────
  const [colFilters, setColFilters] = useState({
    project:      '',
    sponsor:      '',
    amount:       '',
    type:         'All',
    status:       'All',
    deliveryDate: '',
    dueDate:      '',
  });

  const setCol = (key) => (e) => {
    setColFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setCurrentPage(1);
  };

  const hasActiveColFilters = Object.entries(colFilters).some(([k, v]) =>
    k === 'type' || k === 'status' ? v !== 'All' : v !== ''
  );

  const clearColFilters = () => {
    setColFilters({ project: '', sponsor: '', amount: '', type: 'All', status: 'All', deliveryDate: '', dueDate: '' });
    setCurrentPage(1);
  };

  const [currentPage, setCurrentPage] = useState(1);

  // ── Filtered donors for charts ────────────────────────────────────────────
  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      const date = new Date(d.deliveryDate);
      const afterStart = !startDate || date >= new Date(startDate);
      const beforeEnd = !endDate || date <= new Date(endDate);
      const matchesType = typeFilter === 'All' || d.type === typeFilter;
      return afterStart && beforeEnd && matchesType;
    });
  }, [donors, startDate, endDate, typeFilter]);

  // ── Filtered donors for table (applies col filters on top of chart filters) ─
  const tableFilteredDonors = useMemo(() => {
    return filteredDonors.filter((d) => {
      const { project, sponsor, amount, type, status, deliveryDate, dueDate } = colFilters;

      if (project && !String(d.project || '').toLowerCase().includes(project.toLowerCase())) return false;
      if (sponsor && !String(d.sponsor || '').toLowerCase().includes(sponsor.toLowerCase())) return false;
      if (amount) {
        const amt = Number(d.amount || 0);
        // support ">500000", "<100000", or plain number match
        const gtMatch = amount.match(/^>\s*(\d+)$/);
        const ltMatch = amount.match(/^<\s*(\d+)$/);
        const eqMatch = amount.match(/^\d+$/);
        if (gtMatch && !(amt > Number(gtMatch[1]))) return false;
        if (ltMatch && !(amt < Number(ltMatch[1]))) return false;
        if (eqMatch && !String(amt).includes(amount)) return false;
        if (!gtMatch && !ltMatch && !eqMatch) {
          if (!String(amt).includes(amount.replace(/[^0-9]/g, ''))) return false;
        }
      }
      if (type !== 'All' && d.type !== type) return false;
      if (status !== 'All' && normalizeStatus(d.status) !== status) return false;
      if (deliveryDate && !(d.deliveryDate || '').includes(deliveryDate)) return false;
      if (dueDate && !(d.dueDate || '').includes(dueDate)) return false;

      return true;
    });
  }, [filteredDonors, colFilters]);

  const totalPages = Math.max(1, Math.ceil(tableFilteredDonors.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDonors = tableFilteredDonors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const sponTotal = filteredDonors.reduce((s, d) => s + Number(d.amount || 0), 0);
  const sponActive = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Active').length;
  const sponCompleted = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Completed').length;
  const sponInactive = filteredDonors.filter((d) => normalizeStatus(d.status) === 'Inactive').length;

  const monthlyTrendData = useMemo(() => MONTHS.map((month, i) => ({
    name: month,
    Sponsorships: filteredDonors
      .filter((d) => new Date(d.deliveryDate).getMonth() === i)
      .reduce((s, d) => s + Number(d.amount || 0), 0),
  })), [filteredDonors]);

  const byProgramData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => {
      const k = d.project || 'Unknown';
      map.set(k, (map.get(k) || 0) + Number(d.amount || 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({ name: name.length > 22 ? name.substring(0, 22) + '…' : name, amount }));
  }, [filteredDonors]);

  const byTypeData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => {
      const k = d.type || 'Unknown';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonors]);

  const sponStatusData = useMemo(() => {
    const map = new Map();
    filteredDonors.forEach((d) => {
      const k = normalizeStatus(d.status);
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredDonors]);

  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('All');
    setCurrentPage(1);
  };

  // ─── PDF EXPORT ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const orange = [230, 126, 0];
    const yellow = [255, 193, 7];
    const white = [255, 255, 255];
    const black = [20, 20, 20];
    const gray = [100, 100, 100];
    const lightOrange = [255, 252, 240];

    const rptNo = `RPT-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFillColor(...orange);
    doc.rect(0, 0, pageW, 3, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 3, pageW, 36, 'F');
    doc.addImage(kcLogo, 'PNG', 12, 7, 22, 22);
    doc.setTextColor(...black);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SPONSORSHIP REPORT', 38, 16);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Knowledge Channel Foundation, Inc.', 38, 22);
    doc.text('Congressional Ave., Quezon City, Metro Manila', 38, 27);
    doc.text('finance@knowledgechannel.org', 38, 32);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Report No.', pageW - 14, 13, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.setFontSize(9);
    doc.text(rptNo, pageW - 14, 19, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text('Date', pageW - 14, 27, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.setFontSize(9);
    doc.text(today, pageW - 14, 33, { align: 'right' });
    doc.setFillColor(...yellow);
    doc.rect(0, 39, pageW, 2, 'F');
    doc.setFillColor(...orange);
    doc.rect(0, 41, pageW, 1, 'F');

    let y = 52;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 100, 0);
    doc.text('FILTERS APPLIED', 14, y);
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.4);
    doc.line(14, y + 2, 54, y + 2);
    doc.setLineWidth(0.2);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text(`Date Range: ${startDate ? formatDate(startDate) : 'All'} — ${endDate ? formatDate(endDate) : 'All'}`, 14, y);
    doc.text(`Sponsor Type: ${typeFilter}`, pageW / 2, y);
    y += 5;

    y += 6;
    doc.setFillColor(...yellow);
    doc.rect(14, y, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);
    doc.text('SUMMARY', 17, y + 5.5);
    y += 8;

    const stats = [
      ['Total Amount', `PHP ${sponTotal.toLocaleString()}`],
      ['Total Records', String(filteredDonors.length)],
      ['Active', String(sponActive)],
      ['Completed', String(sponCompleted)],
      ['Inactive', String(sponInactive)],
    ];

    const colW = (pageW - 28) / stats.length;
    doc.setFillColor(...lightOrange);
    doc.rect(14, y, pageW - 28, 20, 'F');
    doc.setDrawColor(240, 200, 100);
    doc.rect(14, y, pageW - 28, 20, 'S');
    stats.forEach(([label, val], i) => {
      const x = 17 + i * colW;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.text(label.toUpperCase(), x, y + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...black);
      doc.text(val, x, y + 16);
    });
    y += 28;

    doc.setFillColor(...yellow);
    doc.rect(14, y, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);
    doc.text('SPONSORSHIPS BY PROGRAM', 17, y + 5.5);
    doc.text('AMOUNT', pageW - 16, y + 5.5, { align: 'right' });
    y += 8;

    const programMap = new Map();
    filteredDonors.forEach((d) => {
      const k = d.project || 'Unknown';
      programMap.set(k, (programMap.get(k) || 0) + Number(d.amount || 0));
    });
    Array.from(programMap.entries()).sort((a, b) => b[1] - a[1]).forEach(([prog, amt], i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 252 : 248, i % 2 === 0 ? 240 : 235);
      doc.rect(14, y, pageW - 28, 8, 'F');
      doc.setDrawColor(240, 200, 100);
      doc.setLineWidth(0.1);
      doc.rect(14, y, pageW - 28, 8, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...black);
      doc.text(prog.substring(0, 50), 17, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`PHP ${amt.toLocaleString()}`, pageW - 16, y + 5.5, { align: 'right' });
      y += 8;
    });

    y += 6;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFillColor(...yellow);
    doc.rect(14, y, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);
    doc.text('SPONSORSHIPS BY TYPE', 17, y + 5.5);
    doc.text('COUNT', pageW / 2, y + 5.5);
    doc.text('AMOUNT', pageW - 16, y + 5.5, { align: 'right' });
    y += 8;

    const typeMap = new Map();
    filteredDonors.forEach((d) => {
      const k = d.type || 'Unknown';
      if (!typeMap.has(k)) typeMap.set(k, { count: 0, amount: 0 });
      typeMap.get(k).count += 1;
      typeMap.get(k).amount += Number(d.amount || 0);
    });
    Array.from(typeMap.entries()).sort((a, b) => b[1].amount - a[1].amount).forEach(([type, { count, amount }], i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 252 : 248, i % 2 === 0 ? 240 : 235);
      doc.rect(14, y, pageW - 28, 8, 'F');
      doc.setDrawColor(240, 200, 100);
      doc.setLineWidth(0.1);
      doc.rect(14, y, pageW - 28, 8, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...black);
      doc.text(type, 17, y + 5.5);
      doc.text(String(count), pageW / 2, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`PHP ${amount.toLocaleString()}`, pageW - 16, y + 5.5, { align: 'right' });
      y += 8;
    });

    y += 6;
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFillColor(...yellow);
    doc.rect(14, y, pageW - 28, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 40, 0);

    const COL = { sponsor: 14, program: 55, type: 102, status: 122, date: 145, dueDate: 168, amount: pageW - 14 };
    doc.text('SPONSOR', COL.sponsor + 2, y + 5.5);
    doc.text('PROGRAM', COL.program + 2, y + 5.5);
    doc.text('TYPE', COL.type + 2, y + 5.5);
    doc.text('STATUS', COL.status + 2, y + 5.5);
    doc.text('DEL. DATE', COL.date + 2, y + 5.5);
    doc.text('DUE DATE', COL.dueDate + 2, y + 5.5);
    doc.text('AMOUNT', COL.amount, y + 5.5, { align: 'right' });
    y += 8;

    filteredDonors.forEach((d, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 252 : 248, i % 2 === 0 ? 240 : 235);
      doc.rect(14, y, pageW - 28, 7, 'F');
      doc.setDrawColor(240, 200, 100);
      doc.setLineWidth(0.1);
      doc.rect(14, y, pageW - 28, 7, 'S');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...black);
      doc.text(String(d.sponsor || '—').substring(0, 18), COL.sponsor + 2, y + 5);
      doc.text(String(d.project || '—').substring(0, 20), COL.program + 2, y + 5);
      doc.text(String(d.type || '—').substring(0, 10), COL.type + 2, y + 5);
      doc.text(normalizeStatus(d.status).substring(0, 10), COL.status + 2, y + 5);
      doc.text(d.deliveryDate ? String(d.deliveryDate).slice(0, 10) : '—', COL.date + 2, y + 5);
      doc.text(d.dueDate ? String(d.dueDate).slice(0, 10) : '—', COL.dueDate + 2, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`PHP ${Number(d.amount || 0).toLocaleString()}`, COL.amount, y + 5, { align: 'right' });
      y += 7;
    });

    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFillColor(...orange);
    doc.rect(14, y, pageW - 28, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...white);
    doc.text('TOTAL', COL.sponsor + 2, y + 6);
    doc.text(`PHP ${sponTotal.toLocaleString()}`, COL.amount, y + 6, { align: 'right' });

    const totalPdfPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPdfPages; i++) {
      doc.setPage(i);
      doc.setFillColor(...orange);
      doc.rect(0, 278, pageW, 1.5, 'F');
      doc.setFillColor(...yellow);
      doc.rect(0, 279.5, pageW, 18, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 40, 0);
      doc.text('Thank you for your generous support of quality education for every Filipino child.', pageW / 2, 287, { align: 'center' });
      doc.text(`Knowledge Channel Foundation  ·  finance@knowledgechannel.org  ·  www.knowledgechannel.org  ·  Page ${i} of ${totalPdfPages}`, pageW / 2, 293, { align: 'center' });
    }

    doc.save(`sponsorship-report-${rptNo}.pdf`);
  };

  // Unique values for dropdowns
  const uniqueTypes = useMemo(() => [...new Set(donors.map((d) => d.type).filter(Boolean))].sort(), [donors]);
  const uniqueStatuses = ['Active', 'Completed', 'Inactive'];

  return (
    <div className="space-y-6">

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Overview of sponsorship records.</p>
        </div>
        <Button variant="secondary" onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" /> Export PDF
        </Button>
      </div>

      {/* ─── GLOBAL FILTERS ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <Input type="date" className="w-auto" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} />
            <span className="text-gray-400">–</span>
            <Input type="date" className="w-auto" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} />
            <div className="flex items-center gap-2 ml-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Type:</span>
            </div>
            <div className="w-44">
              <Select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                options={[
                  { label: 'All Sponsor Types', value: 'All' },
                  { label: 'Government', value: 'Government' },
                  { label: 'Corporate', value: 'Corporate' },
                  { label: 'Individual', value: 'Individual' },
                  { label: 'NGOs', value: 'NGOs' },
                  { label: 'Grants', value: 'Grants' },
                  { label: 'Others', value: 'Others' },
                ]}
              />
            </div>
            <Button variant="secondary" onClick={handleFilterReset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── SUMMARY STATS ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">₱{sponTotal.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">All sponsorships</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{sponActive}</p>
            <p className="text-xs text-gray-400 mt-1">Active sponsorships</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</p>
            <p className="mt-2 text-2xl font-bold text-green-600">{sponCompleted}</p>
            <p className="text-xs text-gray-400 mt-1">Fully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Records</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{filteredDonors.length}</p>
            <p className="text-xs text-gray-400 mt-1">{sponInactive} inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── MONTHLY TREND ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsorship Amount by Month (Payment Date)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="colSpon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `₱${v}`} />
                <Tooltip formatter={(v) => `₱${Number(v).toLocaleString()}`} />
                <Legend />
                <Area type="monotone" dataKey="Sponsorships" stroke="#22c55e" strokeWidth={2} fill="url(#colSpon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── CHARTS ROW ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Sponsorships by Program</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: Math.max(320, byProgramData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byProgramData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={140} />
                  <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {byProgramData.length === 0 && <p className="text-center text-sm text-gray-400 mt-4">No data.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sponsorships by Sponsor Type</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value" label>
                    {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {byTypeData.map((e, i) => (
                <div key={e.name} className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {e.name} ({e.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sponStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                    {sponStatusData.map((e, i) => (
                      <Cell key={i} fill={
                        e.name === 'Completed' ? '#22c55e' :
                        e.name === 'Active' ? '#3b82f6' : '#6b7280'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── SPONSORSHIP RECORDS TABLE ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Sponsorship Records</CardTitle>
              {hasActiveColFilters && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                  {tableFilteredDonors.length} result{tableFilteredDonors.length !== 1 ? 's' : ''}
                  <button onClick={clearColFilters} className="ml-0.5 hover:text-orange-900 transition-colors" title="Clear column filters">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <Button variant="secondary" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {/* ── Column headers ── */}
                <tr>
                  {['Project', 'Sponsor', 'Amount', 'Type', 'Status', 'Delivery Date', 'Due Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
                {/* ── Per-column filter row ── */}
                <tr className="bg-orange-50/60 border-t border-orange-100">
                  {/* Project */}
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={colFilters.project}
                      onChange={setCol('project')}
                      placeholder="Filter…"
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    />
                  </th>
                  {/* Sponsor */}
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={colFilters.sponsor}
                      onChange={setCol('sponsor')}
                      placeholder="Filter…"
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    />
                  </th>
                  {/* Amount */}
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={colFilters.amount}
                      onChange={setCol('amount')}
                      placeholder=">500000…"
                      title="Type a number, >500000, or <100000"
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    />
                  </th>
                  {/* Type */}
                  <th className="px-3 py-2">
                    <select
                      value={colFilters.type}
                      onChange={setCol('type')}
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    >
                      <option value="All">All</option>
                      {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </th>
                  {/* Status */}
                  <th className="px-3 py-2">
                    <select
                      value={colFilters.status}
                      onChange={setCol('status')}
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
                    >
                      <option value="All">All</option>
                      {uniqueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </th>
                  {/* Delivery Date */}
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={colFilters.deliveryDate}
                      onChange={setCol('deliveryDate')}
                      placeholder="YYYY-MM…"
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    />
                  </th>
                  {/* Due Date */}
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={colFilters.dueDate}
                      onChange={setCol('dueDate')}
                      placeholder="YYYY-MM…"
                      className="w-full text-xs rounded-md border border-gray-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-gray-300"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedDonors.length > 0 ? paginatedDonors.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.project}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{d.sponsor}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₱{Number(d.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        normalizeStatus(d.status) === 'Completed' ? 'bg-green-100 text-green-800' :
                        normalizeStatus(d.status) === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>{normalizeStatus(d.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.deliveryDate ? new Date(d.deliveryDate).toISOString().split('T')[0] : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.dueDate ? new Date(d.dueDate).toISOString().split('T')[0] : '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <p className="text-sm text-gray-400">No records match the current filters.</p>
                      {hasActiveColFilters && (
                        <button onClick={clearColFilters} className="mt-2 text-xs text-orange-500 hover:text-orange-700 font-medium underline">
                          Clear column filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINATION ───────────────────────────────────────────────────── */}
          {tableFilteredDonors.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(safePage - 1) * PAGE_SIZE + 1}</span>–
                <span className="font-medium">{Math.min(safePage * PAGE_SIZE, tableFilteredDonors.length)}</span> of{' '}
                <span className="font-medium">{tableFilteredDonors.length}</span> records
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 px-2 rounded-md text-sm border ${
                          safePage === p
                            ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}