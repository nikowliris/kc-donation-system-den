import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Edit, Trash, Eye, Clock, ExternalLink, Paperclip, X, Upload, Download, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { useData } from '../context/DataContext';
import jsPDF from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';
import kcLogo from '../assets/1.png';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

const blankForm = {
  sponsor: '',
  contactPerson: '',
  contact: '',
  email: '',
  project: 'Video Production',
  projectOther: '',
  campaign_id: '',
  unitsCount: '',
  unitsLabel: '',
  deliveryDate: '',
  dueDate: '',
  amount: '',
  tranches: '',
  type: 'Government',
  status: 'Active',
  description: '',
};

export function Donors() {
  const {
    donors, campaigns,
    addDonor, updateDonor, deleteDonor,
    saveDonorSnapshot, fetchDonorHistory,
  } = useData();

  const { user } = useAuth();
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
  const [modalPage, setModalPage] = useState(1);
  const [dueNotif, setDueNotif] = useState({ open: false, donors: [] }); // ← NEW

  const [form, setForm] = useState(blankForm);
  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const KNOWN_PROGRAMS = [
    'Video Production',
    'Knowledge Channel TV Package (KCTV)',
    'KCTV',
    'Knowledge Portable Media Library (KCPML)',
    'KCPML',
    'Teacher Training',
    'Broadcast',
    'On the Ground',
    'Online Conference',
  ];

  const isKnownProgram = (val) => !val || KNOWN_PROGRAMS.includes(val) || val === 'Others';

  const parseUnits = (val) => {
    if (!val && val !== 0) return { unitsCount: '', unitsLabel: '' };
    const str = String(val).trim();
    const match = str.match(/^(\d+)\s*(.*)$/);
    if (match) return { unitsCount: match[1], unitsLabel: match[2].trim() };
    return { unitsCount: '', unitsLabel: str };
  };

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name) => {
    const ext = (name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📋';
    return '📎';
  };

  const normalizeStatus = (s) => {
    const v = String(s || '').trim().toLowerCase();
    if (v === 'done' || v === 'complete' || v === 'completed') return 'Completed';
    if (v === 'inactive') return 'Inactive';
    if (v === 'on-going' || v === 'ongoing') return 'On-Going';
    if (v === 'active') return 'Active';
    return s || 'Active';
  };

  const statusBadgeVariant = (status) => {
    const s = normalizeStatus(status);
    if (s === 'Active' || s === 'Completed') return 'success';
    if (s === 'On-Going') return 'warning';
    return 'secondary';
  };

  const getLinkedCampaign = (donor) => {
    if (!donor?.campaign_id) return null;
    return (campaigns || []).find((c) => String(c.id) === String(donor.campaign_id)) || null;
  };

  // ── useEffects ────────────────────────────────────────────────────────────

  useEffect(() => {
    const openDonorId = location.state?.openDonorId;
    if (!openDonorId) return;
    const found = (donors || []).find((d) => String(d.id) === String(openDonorId));
    if (found) handleViewProfile(found);
  }, [location.state, donors]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, typeFilter]);

  // ── Due date notification (modal popup) ──────────────────────────────────
  useEffect(() => {
    if (!donors || donors.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

  const dueSoon = donors.filter((d) => {
  if (!d.dueDate) return false;
  const due = new Date(d.dueDate);
  due.setHours(0, 0, 0, 0);
  return (
    due.getTime() <= tomorrow.getTime() &&
    normalizeStatus(d.status) !== 'Completed'
  );
});

    if (dueSoon.length === 0) return;

    const notifKey = `due-notif-${today.toISOString().split('T')[0]}`;
    if (sessionStorage.getItem(notifKey)) return;
    sessionStorage.setItem(notifKey, '1');

    setTimeout(() => setDueNotif({ open: true, donors: dueSoon }), 800);
  }, [donors]);

  // ── Due notif email handler ───────────────────────────────────────────────
  const handleDueNotifEmail = () => {
    const lines = dueNotif.donors.map((d) =>
      `• ${d.sponsor} — ${d.project} | Due: ${formatDate(d.dueDate)} | Amount: PHP ${Number(d.amount || 0).toLocaleString()}`
    ).join('\n');
    const subject = encodeURIComponent(`⚠️ ${dueNotif.donors.length} Sponsorship Record(s) Due Soon`);
    const body = encodeURIComponent(
      `Good day,\n\nThe following sponsorship records are due today or tomorrow:\n\n${lines}\n\nPlease take the necessary action.\n\n— Knowledge Channel Foundation System`
    );
    window.open(`mailto:${user?.email || ''}?subject=${subject}&body=${body}`, '_blank');
    setDueNotif({ open: false, donors: [] });
  };

  // ── Filtered + grouped donors ─────────────────────────────────────────────

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
  const paginatedSponsors = sponsorNames.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleGroup = (name) => setCollapsedGroups((prev) => ({ ...prev, [name]: !prev[name] }));

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
    setForm(blankForm);
    setAttachments([]);
    setModalPage(1);
    setIsModalOpen(true);
  };

  const handleEditDonor = (donor) => {
    setCurrentDonor(donor);
    const savedProject = donor.project || 'Video Production';
    const isCustom = !isKnownProgram(savedProject);
    const { unitsCount, unitsLabel } = parseUnits(donor.units);
    setForm({
      sponsor:       donor.sponsor       || '',
      contactPerson: donor.contactPerson || '',
      contact:       donor.contact       || '',
      email:         donor.email         || '',
      project:       isCustom ? 'Others' : savedProject,
      projectOther:  isCustom ? savedProject : '',
      campaign_id:   donor.campaign_id   ? String(donor.campaign_id) : '',
      unitsCount,
      unitsLabel,
      deliveryDate:  donor.deliveryDate ? String(donor.deliveryDate).slice(0, 10) : '',
      dueDate:       donor.dueDate      ? String(donor.dueDate).slice(0, 10) : '',
      amount:        donor.amount       != null ? String(donor.amount) : '',
      tranches:      donor.tranches     != null ? String(donor.tranches) : '',
      type:          donor.type         || 'Government',
      status:        normalizeStatus(donor.status),
      description:   donor.description  || '',
    });
    setAttachments(
      (donor.attachments || []).map((a) => ({
        id: a.id,
        file: null,
        title: a.title,
        name: a.name,
        size: a.size,
        url: a.url || null,
        existing: true,
      }))
    );
    setModalPage(1);
    fetchDonorHistory(donor.id).then(setDonorHistory);
    setIsModalOpen(true);
  };

  const handleDeleteDonor = (id) => {
    if (confirm('Are you sure you want to delete this record?')) deleteDonor(id);
  };

  const handleGoToProject = (campaignId) => {
    setIsProfileOpen(false);
    navigate('/campaigns', { state: { openCampaignId: campaignId } });
  };

  const resolveProject = () => form.project === 'Others' ? (form.projectOther.trim() || 'Others') : form.project;

  const resolveUnits = () => {
    const count = form.unitsCount.trim();
    const label = form.unitsLabel.trim();
    if (!count && !label) return null;
    return [count, label].filter(Boolean).join(' ');
  };

  const resolveCampaignId = () => {
    const title = (form.campaign_id || '').trim();
    if (title) {
      if (/^\d+$/.test(title)) return Number(title);
      const match = (campaigns || []).find(
        (c) => c.title.toLowerCase() === title.toLowerCase()
      );
      if (match) return Number(match.id);
    }
    const programName = resolveProject();
    if (programName) {
      const exactMatch = (campaigns || []).find(
        (c) => c.title.toLowerCase() === programName.toLowerCase()
      );
      if (exactMatch) return Number(exactMatch.id);
    }
    if (!isKnownProgram(resolveProject())) {
      const othersMatch = (campaigns || []).find(
        (c) => c.title.toLowerCase() === 'others'
      );
      if (othersMatch) return Number(othersMatch.id);
    }
    return null;
  };

  // ── Attachment handlers ───────────────────────────────────────────────────

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            file,
            title: file.name.replace(/\.[^/.]+$/, ''),
            name: file.name,
            size: file.size,
            url: dataUrl,
            existing: false,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachmentTitleChange = (id, newTitle) =>
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, title: newTitle } : a)));

  const handleRemoveAttachment = (id) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const serializedAttachments = attachments.map((a) => ({
        id: a.id,
        title: a.title,
        name: a.name || (a.file ? a.file.name : ''),
        size: a.size || (a.file ? a.file.size : 0),
        url: a.url || null,
      }));
      const newDonor = {
        id:            currentDonor ? currentDonor.id : undefined,
        sponsor:       form.sponsor,
        contactPerson: form.contactPerson || null,
        contact:       form.contact       || null,
        email:         form.email         || null,
        project:       resolveProject(),
        campaign_id:   resolveCampaignId(),
        units:         resolveUnits(),
        deliveryDate:  form.deliveryDate || null,
        dueDate:       form.dueDate      || null,
        amount:        Number(form.amount   || 0),
        tranches:      Number(form.tranches || 0),
        type:          form.type,
        status:        normalizeStatus(form.status),
        description:   form.description  || null,
        attachments:   serializedAttachments,
      };
      if (currentDonor) {
        await saveDonorSnapshot(currentDonor.id, { ...currentDonor });
        await updateDonor(newDonor);
        const updated = await fetchDonorHistory(currentDonor.id);
        setDonorHistory(updated);
        setCurrentDonor((prev) => ({ ...prev, ...newDonor }));
      } else {
        await addDonor(newDonor);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageDataUrl = (att) =>
    new Promise((resolve) => {
      const src = att.url;
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), w: img.width, h: img.height });
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const handleDownloadSummary = async () => {
    if (!currentDonor) return;
    const linkedCampaign = getLinkedCampaign(currentDonor);
    const savedAttachments = currentDonor.attachments || [];
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = 595;
    const orange = [230, 126, 14], white = [255,255,255], black = [0,0,0], gray = [120,120,120], lightOrange = [255,243,220];

    doc.setFillColor(...orange); doc.rect(0,0,W,8,'F');
    doc.addImage(kcLogo,'PNG',30,14,60,60);
    doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
    doc.text('Knowledge Channel Foundation, Inc.',105,45);
    doc.text('Congressional Ave., Quezon City, Metro Manila',105,57);
    doc.text('finance@knowledgechannel.org',105,69);
    const recCountKey = 'kc_rec_counter';
    const nextNum = parseInt(localStorage.getItem(recCountKey) || '0', 10) + 1;
    localStorage.setItem(recCountKey, String(nextNum));
    const statNo = `REC-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    doc.setTextColor(...gray); doc.setFontSize(8); doc.setFont('helvetica','normal');
    doc.text('Record No.',W-40,35,{align:'right'});
    doc.setTextColor(...black); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(statNo,W-40,47,{align:'right'});
    doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text('Date',W-40,62,{align:'right'});
    doc.setTextColor(...black); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(today,W-40,74,{align:'right'});
    doc.setFillColor(...orange); doc.rect(0,82,W,3,'F');

    doc.setDrawColor(...orange); doc.setLineWidth(2); doc.line(40,105,40,125);
    doc.setTextColor(...orange); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('SPONSOR',50,119);
    doc.setTextColor(...black); doc.setFontSize(14); doc.setFont('helvetica','bold');
    doc.text(currentDonor.sponsor||'-',40,147);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...gray);
    let sponsorY = 162;
    if (currentDonor.email) { doc.text(currentDonor.email,40,sponsorY); sponsorY+=13; }
    if (currentDonor.contact) doc.text(currentDonor.contact,40,sponsorY);

    const COL = {desc:52,prog:220,due:360,status:450,amt:W-40};
    const tableTop = 192;
    doc.setFillColor(...orange); doc.rect(40,tableTop,W-80,22,'F');
    doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    doc.text('DESCRIPTION',COL.desc,tableTop+15);
    doc.text('PROGRAM',COL.prog,tableTop+15);
    doc.text('DUE DATE',COL.due,tableTop+15);
    doc.text('STATUS',COL.status,tableTop+15);
    doc.text('AMOUNT',COL.amt,tableTop+15,{align:'right'});

    let rowY = tableTop+22;
    const currentAmt = Number(currentDonor.amount||0);
    const tranches = Number(currentDonor.tranches)||1;
    const perTranche = Math.round(currentAmt/tranches);
    doc.setFillColor(...lightOrange); doc.rect(40,rowY,W-80,38,'F');
    doc.setDrawColor(...orange); doc.setLineWidth(0.5); doc.rect(40,rowY,W-80,38,'S');
    doc.setTextColor(...black); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('CURRENT',COL.desc,rowY+13);
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    const descLabel = currentDonor.description
      ? String(currentDonor.description).slice(0,30)+(currentDonor.description.length>30?'…':'')
      : '-';
    doc.setTextColor(...gray); doc.text(descLabel,COL.desc,rowY+25);
    doc.setTextColor(...black);
    doc.text(currentDonor.project||'-',COL.prog,rowY+13);
    doc.text(formatDate(currentDonor.dueDate),COL.due,rowY+13);
    doc.text(normalizeStatus(currentDonor.status),COL.status,rowY+13);
    doc.setFont('helvetica','bold');
    doc.text(`PHP ${currentAmt.toLocaleString()}`,COL.amt,rowY+13,{align:'right'});
    doc.setFont('helvetica','normal'); doc.setTextColor(...orange); doc.setFontSize(7.5);
    doc.text(`${tranches} tranche${tranches>1?'s':''} · PHP ${perTranche.toLocaleString()} each`,COL.prog,rowY+27);
    rowY += 38;

    if (donorHistory && donorHistory.length > 0) {
      doc.setFillColor(245,230,200); doc.rect(40,rowY,W-80,18,'F');
      doc.setTextColor(...orange); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
      doc.text('EDIT HISTORY (PREVIOUS VERSIONS — FOR REFERENCE ONLY)',COL.desc,rowY+12);
      rowY += 18;
      donorHistory.forEach((snap,idx) => {
        if (idx%2===0) { doc.setFillColor(245,245,245); } else { doc.setFillColor(255,255,255); }
        doc.rect(40,rowY,W-80,24,'F');
        doc.setTextColor(...orange); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
        doc.text(`v${donorHistory.length-idx}`,COL.desc,rowY+16);
        const snapDesc = snap.description
          ? String(snap.description).slice(0,25)+(snap.description.length>25?'…':'')
          : '-';
        doc.setTextColor(...gray); doc.setFont('helvetica','italic'); doc.setFontSize(8);
        doc.text(snapDesc,COL.desc+18,rowY+16);
        doc.setTextColor(100,100,100); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
        const snapProg = (snap.project||'-').length > 18 ? (snap.project||'-').slice(0,18)+'…' : (snap.project||'-');
        doc.text(snapProg, COL.prog, rowY+16);
        doc.text(formatDate(snap.dueDate), COL.due, rowY+16);
        doc.text(normalizeStatus(snap.status), COL.status, rowY+16);
        doc.setTextColor(150,150,150); doc.setFont('helvetica','normal');
        doc.text(`PHP ${Number(snap.amount||0).toLocaleString()}`,COL.amt,rowY+16,{align:'right'});
        doc.setDrawColor(220,220,220); doc.setLineWidth(0.3); doc.rect(40,rowY,W-80,24,'S');
        rowY += 24;
        if (rowY > 750) { doc.addPage(); rowY = 40; }
      });
    }

    const historyTotal = donorHistory
      ? donorHistory.reduce((sum,snap) => sum+Number(snap.amount||0), 0)
      : 0;
    const overallTotal = currentAmt + historyTotal;
    const totTop = rowY+18;
    doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text('Current Record:',340,totTop);
    doc.setTextColor(...black); doc.setFont('helvetica','bold');
    doc.text(`PHP ${currentAmt.toLocaleString()}`,W-52,totTop,{align:'right'});
    doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text('Previous Versions:',340,totTop+14);
    doc.setTextColor(100,100,100); doc.setFont('helvetica','bold');
    doc.text(`PHP ${historyTotal.toLocaleString()}`,W-52,totTop+14,{align:'right'});
    doc.setDrawColor(220,220,220); doc.setLineWidth(0.5); doc.line(340,totTop+22,W-52,totTop+22);
    doc.setFillColor(...orange); doc.rect(300,totTop+28,W-340,26,'F');
    doc.setTextColor(...white); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('OVERALL TOTAL:',312,totTop+46);
    doc.text(`PHP ${overallTotal.toLocaleString()}`,W-52,totTop+46,{align:'right'});

    const payTop = totTop+72;
    doc.setDrawColor(220,220,220); doc.setLineWidth(0.5); doc.roundedRect(40,payTop,W-80,118,4,4,'S');
    doc.setDrawColor(...orange); doc.setLineWidth(2); doc.line(55,payTop+16,55,payTop+34);
    doc.setTextColor(...orange); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('RECORD DETAILS',65,payTop+28);
    const detailFields = [
      ['Type / Source:', currentDonor.type||'-'],
      ['Contact Person:', currentDonor.contactPerson||'-'],
      ['Payment Date:', formatDate(currentDonor.deliveryDate)],
      ['Due Date:', formatDate(currentDonor.dueDate)],
      ['Beneficiaries:', String(currentDonor.units??'-')],
      ['Added By:', currentDonor.created_by||'-'],
    ];
    if (linkedCampaign) detailFields.push(['Linked Project:', linkedCampaign.title]);
    let detY = payTop+50;
    detailFields.forEach(([label,value]) => {
      doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text(label,55,detY);
      doc.setTextColor(...black); doc.setFont('helvetica','bold');
      doc.text(String(value),175,detY);
      detY += 15;
    });

    doc.setFillColor(...orange); doc.rect(0,780,W,61,'F');
    doc.setTextColor(...white); doc.setFont('helvetica','italic'); doc.setFontSize(9);
    doc.text('Thank you for your generous support of quality education for every Filipino child.',W/2,800,{align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.text('Knowledge Channel Foundation  ·  finance@knowledgechannel.org  ·  www.knowledgechannel.org',W/2,820,{align:'center'});

    if (savedAttachments.length > 0) {
      const AW = 595;
      doc.addPage();
      doc.setFillColor(...orange); doc.rect(0,0,AW,40,'F');
      doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.text('ATTACHMENTS',40,26);
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      doc.text(
        `${savedAttachments.length} file${savedAttachments.length!==1?'s':''} attached to this record`,
        AW-40,26,{align:'right'}
      );

      let ay = 68;
      savedAttachments.forEach((att, idx) => {
        if (ay > 750) { doc.addPage(); ay = 40; }
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.name||'');
        const isPdf   = /\.pdf$/i.test(att.name||'');
        doc.setFillColor(idx%2===0 ? 252 : 255, idx%2===0 ? 248 : 255, idx%2===0 ? 240 : 255);
        doc.roundedRect(40,ay,AW-80,30,3,3,'F');
        doc.setDrawColor(...orange); doc.setLineWidth(0.4);
        doc.roundedRect(40,ay,AW-80,30,3,3,'S');
        doc.setFillColor(...orange); doc.roundedRect(40,ay,28,30,3,3,'F');
        doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(9);
        doc.text(String(idx+1),54,ay+19,{align:'center'});
        const title = att.title||att.name||'Untitled';
        doc.setTextColor(...black); doc.setFont('helvetica','bold'); doc.setFontSize(9);
        doc.text(title.length>52 ? title.slice(0,52)+'…' : title, 78, ay+13);
        const meta = [att.name, att.size ? formatFileSize(att.size) : null].filter(Boolean).join(' · ');
        doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
        doc.text(meta.length>65 ? meta.slice(0,65)+'…' : meta, 78, ay+23);
        const typeLabel = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'FILE';
        const typeColor = isPdf ? [220,50,50] : isImage ? [34,150,90] : [100,100,200];
        doc.setFillColor(...typeColor); doc.roundedRect(AW-88,ay+8,36,14,2,2,'F');
        doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(7);
        doc.text(typeLabel,AW-70,ay+18,{align:'center'});
        if (att.url) {
          doc.setTextColor(0,102,204); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
          doc.textWithLink('Open ↗',AW-48,ay+13,{url:att.url});
        }
        ay += 36;
      });

      const imageAttachments = savedAttachments.filter(a =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(a.name||'') && a.url
      );
      for (const att of imageAttachments) {
        const result = await getImageDataUrl(att);
        if (!result) continue;
        doc.addPage();
        doc.setFillColor(...orange); doc.rect(0,0,AW,36,'F');
        doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text(att.title||att.name||'Attachment',40,23);
        doc.setFont('helvetica','normal'); doc.setFontSize(8);
        doc.text(att.name||'',AW-40,23,{align:'right'});
        const maxW = AW-80;
        const maxH = 841-36-60;
        const ratio = Math.min(maxW/result.w, maxH/result.h);
        const imgW = result.w*ratio;
        const imgH = result.h*ratio;
        const imgX = (AW-imgW)/2;
        doc.addImage(result.dataUrl,'JPEG',imgX,52,imgW,imgH);
        doc.setTextColor(...gray); doc.setFont('helvetica','italic'); doc.setFontSize(8);
        doc.text(att.title||att.name||'',AW/2,52+imgH+18,{align:'center'});
      }

      const nonImageFiles = savedAttachments.filter(a =>
        !/\.(jpg|jpeg|png|gif|webp)$/i.test(a.name||'')
      );
      if (nonImageFiles.length > 0) {
        doc.addPage();
        doc.setFillColor(...orange); doc.rect(0,0,AW,36,'F');
        doc.setTextColor(...white); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text('NON-IMAGE ATTACHMENTS',40,23);
        let ny = 60;
        doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
        doc.text('The following files cannot be embedded directly in this PDF.',40,ny);
        doc.text('Use the links in the Attachments index page to open them.',40,ny+13);
        ny += 36;
        nonImageFiles.forEach((att, idx) => {
          if (ny > 750) { doc.addPage(); ny = 40; }
          doc.setFillColor(250,250,250);
          doc.roundedRect(40,ny,AW-80,28,3,3,'F');
          doc.setDrawColor(220,220,220); doc.setLineWidth(0.3);
          doc.roundedRect(40,ny,AW-80,28,3,3,'S');
          doc.setTextColor(...black); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
          doc.text(`${idx+1}. ${(att.title||att.name||'Untitled').slice(0,60)}`,52,ny+11);
          doc.setTextColor(...gray); doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
          doc.text(att.name||'',52,ny+21);
          if (att.url) {
            doc.setTextColor(0,102,204);
            doc.textWithLink('Open file ↗',AW-52,ny+16,{url:att.url,align:'right'});
          }
          ny += 34;
        });
      }
    }

    const fileSafeName = String(currentDonor.project||currentDonor.sponsor||'record')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-');
    doc.save(`${fileSafeName}-record-summary.pdf`);
  };

  // ── Campaign autocomplete ─────────────────────────────────────────────────

  const [campaignSuggestions, setCampaignSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleCampaignInput = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, campaign_id: val }));
    if (!val.trim()) { setCampaignSuggestions([]); setShowSuggestions(false); return; }
    const filtered = (campaigns || []).filter((c) => c.title.toLowerCase().includes(val.toLowerCase()));
    setCampaignSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleSelectCampaign = (campaign) => {
    setForm((prev) => ({ ...prev, campaign_id: campaign.title }));
    setCampaignSuggestions([]);
    setShowSuggestions(false);
  };

  const getCampaignDisplayValue = () => {
    const val = form.campaign_id;
    if (!val) return '';
    if (/^\d+$/.test(val)) {
      const match = (campaigns || []).find((c) => String(c.id) === val);
      return match ? match.title : val;
    }
    return val;
  };

  const handleRequestToProceed = (row) => {
    const linkedCampaign = getLinkedCampaign(row);
    const subject = encodeURIComponent(
      `Request to Proceed – ${row.project || 'Sponsorship'} | ${row.sponsor}`
    );
    const body = encodeURIComponent(
      `Good day,\n\nWe would like to formally request approval to proceed with the following sponsorship record:\n\n` +
      `Sponsor       : ${row.sponsor || '—'}\n` +
      `Contact Person: ${row.contactPerson || '—'}\n` +
      `Program       : ${row.project || '—'}\n` +
      (linkedCampaign ? `Linked Project: ${linkedCampaign.title}\n` : '') +
      `Amount        : PHP ${Number(row.amount || 0).toLocaleString()}\n` +
      `Tranches      : ${row.tranches || '—'}\n` +
      `Payment Date  : ${formatDate(row.deliveryDate)}\n` +
      `Due Date      : ${formatDate(row.dueDate)}\n` +
      `Status        : ${normalizeStatus(row.status)}\n` +
      (row.description ? `\nDescription:\n${row.description}\n` : '') +
      `\nKindly review and provide your approval at your earliest convenience.\n\n` +
      `— Knowledge Channel Foundation System`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 px-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Sponsorship Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track projects, sponsors, and amounts.</p>
        </div>
        <Button onClick={handleAddDonor} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />Add Record
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input placeholder="Search sponsor, program, project..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full sm:w-44 shrink-0">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
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

          <div className="space-y-2">
            {paginatedSponsors.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No records found.</div>
            )}
            {paginatedSponsors.map((sponsorName) => {
              const rows = grouped[sponsorName];
              const isCollapsed = collapsedGroups[sponsorName];
              const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
              return (
                <div key={sponsorName} className="rounded-xl border border-gray-200 overflow-hidden">
                  <button onClick={() => toggleGroup(sponsorName)}
                    className="w-full flex items-center justify-between px-4 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xs font-bold shrink-0">
                        {sponsorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{sponsorName}</p>
                        <p className="text-xs text-gray-500">{rows.length} record{rows.length !== 1 ? 's' : ''} · ₱{totalAmount.toLocaleString()} total</p>
                      </div>
                    </div>
                    {isCollapsed ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />}
                  </button>

                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100">
                      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-1 bg-white border-b border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Program</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Project</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-right">Amount</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Status</span>
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-center">Actions</span>
                      </div>
                      {rows.map((row) => {
                        const linkedCampaign = getLinkedCampaign(row);
                        return (
                          <div key={row.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-1.5 hover:bg-gray-50/60 transition-colors">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{row.project || '—'}</p>
                              {row.description && <p className="text-xs text-gray-400 truncate mt-0.5">{row.description}</p>}
                            </div>
                            <div className="shrink-0">
                              {linkedCampaign ? (
                                <button onClick={() => handleGoToProject(linkedCampaign.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-colors max-w-[140px] truncate"
                                  title={linkedCampaign.title}>
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{linkedCampaign.title}</span>
                                </button>
                              ) : <span className="text-xs text-gray-300 italic">—</span>}
                            </div>
                            <span className="text-sm font-bold text-gray-900 whitespace-nowrap text-right">₱{Number(row.amount || 0).toLocaleString()}</span>
                            <Badge variant={statusBadgeVariant(row.status)}>{normalizeStatus(row.status)}</Badge>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleViewProfile(row)} className="p-1.5 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="View"><Eye className="h-4 w-4" /></button>
                              <button onClick={() => handleEditDonor(row)} className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleRequestToProceed(row)} className="p-1.5 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Request to Proceed"><Send className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteDonor(row.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete"><Trash className="h-4 w-4" /></button>
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

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{paginatedSponsors.length}</span> of{' '}
              <span className="font-medium text-gray-700">{sponsorNames.length}</span> sponsors
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
                    <button key={item} onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === item ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {item}
                    </button>
                  )
                )}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Add / Edit Modal ── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDonor ? 'Edit Record' : 'Add New Record'}>
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <button type="button" onClick={() => setModalPage(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${modalPage === 1 ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${modalPage === 1 ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-600'}`}>1</span>
              Record Info
            </button>
            <div className="flex-1 h-px bg-gray-200" />
            <button type="button" onClick={() => setModalPage(2)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${modalPage === 2 ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${modalPage === 2 ? 'bg-white text-primary-600' : 'bg-gray-300 text-gray-600'}`}>2</span>
              Attachments
              {attachments.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${modalPage === 2 ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'}`}>
                  {attachments.length}
                </span>
              )}
            </button>
          </div>

          {modalPage === 1 && (
            <div className="overflow-y-auto pr-1 flex-1 space-y-5">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name of Sponsor</label>
                  <Input value={form.sponsor} onChange={setField('sponsor')} placeholder="Enter sponsor name" className="w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person</label>
                  <Input value={form.contactPerson} onChange={setField('contactPerson')} placeholder="Enter contact person name" className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                    <Input value={form.contact} onChange={setField('contact')} placeholder="e.g. 09123456789" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <Input type="email" value={form.email} onChange={setField('email')} placeholder="example@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Program
                    <span className="ml-1.5 text-xs font-normal text-violet-500">← links to matching Project</span>
                  </label>
                  <Select value={form.project}
                    onChange={(e) => setForm((prev) => ({ ...prev, project: e.target.value, projectOther: e.target.value !== 'Others' ? '' : prev.projectOther }))}
                    options={[
                      { label: 'Video Production', value: 'Video Production' },
                      { label: 'Knowledge Channel TV Package (KCTV)', value: 'Knowledge Channel TV Package (KCTV)' },
                      { label: 'Knowledge Portable Media Library (KCPML)', value: 'Knowledge Portable Media Library (KCPML)' },
                      { label: 'Teacher Training', value: 'Teacher Training' },
                      { label: 'Broadcast', value: 'Broadcast' },
                      { label: 'On the Ground', value: 'On the Ground' },
                      { label: 'Online Conference', value: 'Online Conference' },
                      { label: 'Others', value: 'Others' },
                    ]}
                  />
                  {form.project === 'Others' && (
                    <div className="mt-2">
                      <Input value={form.projectOther} onChange={setField('projectOther')} placeholder="Please specify the program..." className="w-full" autoFocus />
                    </div>
                  )}
                  {form.project && (() => {
                    const matched = (campaigns || []).find(
                      (c) => c.title.toLowerCase() === form.project.toLowerCase()
                    );
                    return matched ? (
                      <p className="mt-1.5 text-xs text-violet-600 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Will link to project: <span className="font-semibold">{matched.title}</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-gray-400">
                        No matching project found for this program name.
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Linked Campaign <span className="ml-1 text-xs font-normal text-gray-400">(optional override)</span>
                  </label>
                  <div className="relative">
                    <Input value={getCampaignDisplayValue()} onChange={handleCampaignInput}
                      onFocus={() => {
                        const val = getCampaignDisplayValue();
                        if (val) {
                          const filtered = (campaigns || []).filter((c) => c.title.toLowerCase().includes(val.toLowerCase()));
                          setCampaignSuggestions(filtered);
                          setShowSuggestions(filtered.length > 0);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Override: manually pick a different project..." className="w-full" />
                    {getCampaignDisplayValue() && (
                      <button type="button" onClick={() => { setForm((prev) => ({ ...prev, campaign_id: '' })); setCampaignSuggestions([]); setShowSuggestions(false); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                    )}
                    {showSuggestions && (
                      <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {campaignSuggestions.map((c) => (
                          <li key={c.id}>
                            <button type="button" onMouseDown={() => handleSelectCampaign(c)}
                              className="w-full text-left px-3 py-2.5 text-sm text-gray-800 hover:bg-sky-50 hover:text-sky-700 transition-colors">
                              <span className="font-medium">{c.title}</span>
                              {c.status && <span className="ml-2 text-xs text-gray-400 capitalize">{c.status}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Beneficiaries</label>
                  <div className="flex gap-2">
                    <Input type="number" value={form.unitsCount} onChange={setField('unitsCount')} placeholder="0" className="w-24 shrink-0" min="0" />
                    <Input value={form.unitsLabel} onChange={setField('unitsLabel')} placeholder="e.g. schools, episodes, ES, units…" className="flex-1" />
                  </div>
                  {(form.unitsCount || form.unitsLabel) && (
                    <p className="mt-1.5 text-xs text-gray-400">Preview: <span className="font-medium text-gray-600">{[form.unitsCount, form.unitsLabel].filter(Boolean).join(' ')}</span></p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Payment</label>
                    <Input type="date" value={form.deliveryDate} onChange={setField('deliveryDate')} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                    <Input type="date" value={form.dueDate} onChange={setField('dueDate')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₱)</label>
                    <Input type="number" value={form.amount} onChange={setField('amount')} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Tranches</label>
                    <Input type="number" value={form.tranches} onChange={setField('tranches')} placeholder="Enter number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Source of Funds</label>
                    <Select value={form.type} onChange={setField('type')}
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <Select value={form.status} onChange={setField('status')}
                      options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'On-Going', value: 'On-Going' },
                        { label: 'Completed', value: 'Completed' },
                        { label: 'Inactive', value: 'Inactive' },
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Project Description</label>
                  <textarea value={form.description} onChange={setField('description')} placeholder="Enter project description..." rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none" />
                </div>
              </div>
            </div>
          )}

          {modalPage === 2 && (
            <div className="overflow-y-auto pr-1 flex-1 space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-0.5">Attached Files</p>
                  <p className="text-xs text-gray-400 mb-4">Upload supporting documents such as MOAs, receipts, or reports. Give each file a descriptive title.</p>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-8 px-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Click to upload files</p>
                      <p className="text-xs text-gray-400 mt-0.5">PDF, Word, Excel, images and more · Max 5MB per file</p>
                    </div>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv" />
                  </div>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {attachments.length} file{attachments.length !== 1 ? 's' : ''} added
                    </p>
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="h-9 w-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg shrink-0 shadow-sm">
                          {getFileIcon(att.name || (att.file ? att.file.name : ''))}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Input value={att.title} onChange={(e) => handleAttachmentTitleChange(att.id, e.target.value)}
                            placeholder="Enter file title..." className="w-full text-sm" />
                          <p className="text-xs text-gray-400 truncate pl-1">
                            {att.name || (att.file ? att.file.name : '')}
                            {att.size ? <span className="ml-2 text-gray-300">· {formatFileSize(att.size)}</span> : null}
                            {att.existing && <span className="ml-2 text-emerald-500 font-medium">· saved</span>}
                          </p>
                        </div>
                        <button type="button" onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 mt-0.5" title="Remove">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {attachments.length === 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    No files attached yet. Files are optional.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2 shrink-0">
            <div>
              {modalPage === 2 && (
                <Button variant="secondary" type="button" onClick={() => setModalPage(1)}>← Back</Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              {modalPage === 1 ? (
                <Button type="button" onClick={() => setModalPage(2)}>Next: Attachments →</Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* ── View Profile Modal ── */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="Record Details">
        {currentDonor && (() => {
          const linkedCampaign = getLinkedCampaign(currentDonor);
          const savedAttachments = currentDonor.attachments || [];
          return (
            <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
              <div className="flex items-center gap-4 pb-3">
                <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-xl font-bold shrink-0">
                  {(currentDonor.sponsor || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{currentDonor.sponsor}</h3>
                  <p className="text-sm text-gray-500 truncate">{currentDonor.project}</p>
                  {currentDonor.contactPerson && <p className="text-xs text-gray-500 truncate">👤 {currentDonor.contactPerson}</p>}
                  {currentDonor.email && <p className="text-xs text-gray-400 truncate">{currentDonor.email}</p>}
                  {currentDonor.contact && <p className="text-xs text-gray-400 truncate">{currentDonor.contact}</p>}
                  {linkedCampaign && (
                    <button onClick={() => handleGoToProject(linkedCampaign.id)}
                      className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-100 transition-colors">
                      <ExternalLink className="h-3 w-3 shrink-0" />{linkedCampaign.title}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex border-b border-gray-200 mb-4">
                {['details', 'attachments', 'history'].map((tab) => (
                  <button key={tab} onClick={() => setProfileTab(tab)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${profileTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'history' && <Clock className="h-3.5 w-3.5" />}
                    {tab === 'attachments' && <Paperclip className="h-3.5 w-3.5" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'history' && donorHistory.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">{donorHistory.length}</span>
                    )}
                    {tab === 'attachments' && savedAttachments.length > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">{savedAttachments.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {profileTab === 'details' && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-white rounded-xl border border-sky-200 shadow-sm">
                      <p className="text-[10px] text-sky-600 uppercase font-semibold tracking-wide mb-1">Amount</p>
                      <p className="text-xl font-bold text-sky-700">₱{Number(currentDonor.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-1">Status</p>
                      <div className="mt-1"><Badge variant={statusBadgeVariant(currentDonor.status)}>{normalizeStatus(currentDonor.status)}</Badge></div>
                    </div>
                  </div>
                  {linkedCampaign && (
                    <div className="p-3.5 bg-violet-50 rounded-xl border border-violet-200 shadow-sm">
                      <p className="text-[10px] text-violet-600 uppercase font-semibold tracking-wide mb-2">Linked Project</p>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-violet-900 truncate">{linkedCampaign.title}</p>
                          {linkedCampaign.description && <p className="text-xs text-violet-700 mt-0.5 line-clamp-2">{linkedCampaign.description}</p>}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-violet-600">
                            {linkedCampaign.target && <span>Target: ₱{Number(linkedCampaign.target).toLocaleString()}</span>}
                            {linkedCampaign.status && <span className="capitalize">{linkedCampaign.status}</span>}
                          </div>
                        </div>
                        <button onClick={() => handleGoToProject(linkedCampaign.id)}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                          <ExternalLink className="h-3 w-3" /> View
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Type', value: currentDonor.type },
                      { label: 'Contact Person', value: currentDonor.contactPerson ?? '—' },
                      { label: 'Contact Number', value: currentDonor.contact ?? '—' },
                      { label: 'Beneficiaries', value: currentDonor.units ?? '—' },
                      { label: 'Payment Date', value: formatDate(currentDonor.deliveryDate) },
                      { label: 'Due Date', value: formatDate(currentDonor.dueDate) },
                      { label: 'Tranches', value: currentDonor.tranches ?? '—' },
                      { label: 'Added By', value: currentDonor.created_by ?? '—' },
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

              {profileTab === 'attachments' && (
                <div className="overflow-y-auto flex-1 pr-1">
                  {savedAttachments.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Paperclip className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-400">No attachments for this record.</p>
                      <p className="text-xs text-gray-300 mt-1">Edit the record to add files.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {savedAttachments.length} file{savedAttachments.length !== 1 ? 's' : ''} attached
                      </p>
                      {savedAttachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors group">
                          <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-xl shrink-0">
                            {getFileIcon(att.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{att.title || att.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {att.name}
                              {att.size ? <span className="ml-2">· {formatFileSize(att.size)}</span> : null}
                            </p>
                          </div>
                          {att.url && (
                            <a href={att.url} download={att.name} target="_blank" rel="noreferrer"
                              className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                              title="Download">
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'history' && (
                <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                  {donorHistory.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">No history available.</div>
                  ) : (
                    donorHistory.map((snap, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Version {idx + 1}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{formatDateTime(snap.saved_at)}</span>
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

              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4 shrink-0">
                <Button variant="secondary" type="button" onClick={handleDownloadSummary}>Download PDF</Button>
                <Button type="button" onClick={() => setIsProfileOpen(false)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Due Date Notification Modal ── */}
      {dueNotif.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDueNotif({ open: false, donors: [] })}
          />
          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-amber-500 px-6 py-5 text-center relative">
              <button
                onClick={() => setDueNotif({ open: false, donors: [] })}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-xl font-bold text-white">Due Date Alert</h2>
              <p className="text-amber-100 text-sm mt-1">
                {dueNotif.donors.length} record{dueNotif.donors.length !== 1 ? 's' : ''} due soon or overdue
              </p>
            </div>
            {/* Body */}
            <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-3">
              {dueNotif.donors.map((d) => (
                <div key={d.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                    {(d.sponsor || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{d.sponsor}</p>
                    <p className="text-xs text-gray-500 truncate">{d.project}</p>
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                      Due: {formatDate(d.dueDate)} · PHP {Number(d.amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setDueNotif({ open: false, donors: [] })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleDueNotifEmail}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> Send Email
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}