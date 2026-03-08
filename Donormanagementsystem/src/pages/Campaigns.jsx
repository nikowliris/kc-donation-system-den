import React, { useMemo, useRef, useState } from 'react';
import { Plus, Search, Calendar, Trophy, Globe, Heart, Megaphone, Edit2, Trash2, Upload } from 'lucide-react';
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
    events, addEvent, updateEvent, deleteEvent,
    grants, addGrant, updateGrant, deleteGrant,
    causeMarketing, addCauseMarketing, updateCauseMarketing, deleteCauseMarketing,
  } = useData();

  const [activeTab, setActiveTab] = useState('Projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [currentGrant, setCurrentGrant] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentCM, setCurrentCM] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const singularLabel =
    activeTab === 'Projects' ? 'Project' :
    activeTab === 'Campaign' ? 'Campaign' :
    activeTab === 'Grants' ? 'Grant' :
    'Cause Marketing';

  const tabs = [
    { id: 'Projects', label: 'Projects', icon: Megaphone },
    { id: 'Campaign', label: 'Campaign', icon: Trophy },
    { id: 'Grants', label: 'Grants', icon: Globe },
    { id: 'CauseMarketing', label: 'Cause Marketing', icon: Heart },
  ];

  const filteredCampaigns = useMemo(() => {
    const list = campaigns || [];
    const q = searchTerm.toLowerCase();
    return list.filter(c =>
      String(c.title || '').toLowerCase().includes(q) ||
      String(c.description || '').toLowerCase().includes(q)
    );
  }, [campaigns, searchTerm]);

  const totalTarget = useMemo(
    () => (campaigns || []).reduce((sum, c) => sum + Number(c.target || 0), 0),
    [campaigns]
  );
  const totalRaised = useMemo(
    () => (campaigns || []).reduce((sum, c) => sum + Number(getCampaignRaised(c.title) || 0), 0),
    [campaigns, getCampaignRaised]
  );
  const activeCount = useMemo(
    () => (campaigns || []).filter(c => c.status === 'Active').length,
    [campaigns]
  );
  const completedCount = useMemo(
    () => (campaigns || []).filter(c => c.status === 'Completed').length,
    [campaigns]
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCampaign(null);
    setCurrentGrant(null);
    setCurrentEvent(null);
    setCurrentCM(null);
    setImagePreview(null);
  };

  const handleOpenCreate = () => { closeModal(); setIsModalOpen(true); };

  const handleEditProject = (e, project) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentCampaign(project); setIsModalOpen(true);
  };
  const handleDeleteProject = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) await deleteCampaign(id);
  };

  const handleEditGrant = (grant) => { setCurrentGrant(grant); setIsModalOpen(true); };
  const handleDeleteGrant = async (id) => {
    if (confirm('Are you sure you want to delete this grant?')) await deleteGrant(id);
  };

  const handleEditEvent = (event) => {
    setCurrentEvent(event); setImagePreview(event.image || null); setIsModalOpen(true);
  };
  const handleDeleteEvent = async (id) => {
    if (confirm('Are you sure you want to delete this campaign event?')) await deleteEvent(id);
  };

  const handleEditCM = (cm) => { setCurrentCM(cm); setIsModalOpen(true); };
  const handleDeleteCM = async (id) => {
    if (confirm('Are you sure you want to delete this cause marketing entry?')) await deleteCauseMarketing(id);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    if (activeTab === 'Projects') {
      const projectData = {
        id: currentCampaign?.id,
        title: formData.get('title'),
        target: parseFloat(formData.get('target') || '0'),
        endDate: formData.get('endDate'),
        description: formData.get('description'),
        status: formData.get('status') || 'Active',
      };
      if (currentCampaign) await updateCampaign(projectData); else await addCampaign(projectData);
    }

    if (activeTab === 'Grants') {
      const grantData = {
        id: currentGrant?.id,
        title: formData.get('title'),
        org: formData.get('org'),
        status: formData.get('status') || 'Under Review',
        amount: parseFloat(formData.get('amount') || '0'),
        deadline: formData.get('deadline'),
        propId: formData.get('propId'),
      };
      if (currentGrant) await updateGrant(grantData); else await addGrant(grantData);
    }

    if (activeTab === 'Campaign') {
      const imageFile = fileInputRef.current?.files[0] || null;
      const eventData = {
        id: currentEvent?.id,
        title: formData.get('title'),
        date: formData.get('date'),
        time: formData.get('time'),
        goal: parseFloat(formData.get('goal') || '0'),
        status: formData.get('status') || 'Upcoming',
        description: formData.get('description'),
        ...(imageFile && { image: imageFile }),
      };
      if (currentEvent) await updateEvent(eventData); else await addEvent(eventData);
    }

    if (activeTab === 'CauseMarketing') {
      const cmData = {
        id: currentCM?.id,
        title: formData.get('title'),
        status: formData.get('status') || 'Active',
        description: formData.get('description'),
        raisedYtd: parseFloat(formData.get('raisedYtd') || '0'),
        activePartners: parseInt(formData.get('activePartners') || '0'),
      };
      if (currentCM) await updateCauseMarketing(cmData); else await addCauseMarketing(cmData);
    }

    closeModal();
    e.target.reset();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Projects':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((project) => (
              <div key={project.id} className="relative group">
                <Link to={`/campaigns/${project.id}`} className="block h-full">
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2 pt-5 px-5">
                      <div className="flex justify-between items-center">
                        <Badge variant={project.status === 'Active' ? 'success' : 'secondary'}>
                          {project.status}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(project.endDate)}
                        </span>
                      </div>
                      <CardTitle className="mt-2.5 text-lg leading-snug group-hover:text-primary-600 transition-colors pr-10">
                        {project.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-900">
                            ₱{Number(getCampaignRaised(project.title) || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-400">of ₱{Number(project.target || 0).toLocaleString()}</span>
                        </div>
                        <ProgressBar value={Number(getCampaignRaised(project.title) || 0)} max={Number(project.target || 0)} />
                        <div className="flex justify-end text-xs text-gray-400">
                          {Number(project.target || 0)
                            ? Math.round((Number(getCampaignRaised(project.title) || 0) / Number(project.target || 0)) * 100)
                            : 0}% Funded
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditProject(e, project)}
                    className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredCampaigns.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-gray-400">No projects found.</div>
            )}
          </div>
        );

      case 'Campaign':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(events || []).length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-gray-400">No campaign events yet.</div>
            )}
            {(events || []).map((event) => (
              <Card key={event.id} className="overflow-hidden group relative">
                <div className="h-44 bg-gray-100 relative">
                  <img
                    src={event.image || 'https://via.placeholder.com/800x400?text=Campaign'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 left-3" variant={event.status === 'Upcoming' ? 'success' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
                <CardHeader className="pb-1 pt-4 px-5">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(event.date)}</span>
                    <span>{event.time || '—'}</span>
                  </div>
                  <CardTitle className="mt-2 text-lg">{event.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="text-sm">
                      <span className="text-gray-400">Goal:</span>
                      <span className="ml-1.5 font-bold text-gray-900">₱{Number(event.goal || 0).toLocaleString()}</span>
                    </div>
                    <Button variant="outline" size="sm">Register / Tickets</Button>
                  </div>
                </CardContent>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditEvent(event)} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-amber-600 hover:bg-amber-50 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteEvent(event.id)} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        );

      case 'Grants':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-800">Grant Pipeline</h3>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {(grants || []).length} Active Proposals
              </span>
            </div>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <div className="rounded-lg overflow-hidden border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Grant Opportunity', 'Organization', 'Status', 'Request Amount', 'Deadline', 'Actions'].map(h => (
                          <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === 'Actions' ? 'text-center' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {(grants || []).length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">No grants found.</td></tr>
                      )}
                      {(grants || []).map((grant) => (
                        <tr key={grant.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="text-sm font-semibold text-gray-900">{grant.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Proposal ID: {grant.propId}</div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{grant.org}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <Badge variant={grant.status === 'Approved' ? 'success' : grant.status === 'Under Review' ? 'warning' : 'secondary'}>
                              {grant.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5 text-sm font-bold text-gray-900 whitespace-nowrap">
                            ₱{Number(grant.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {formatDate(grant.deadline)}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEditGrant(grant)} className="p-1.5 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteGrant(grant.id)} className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'CauseMarketing':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(causeMarketing || []).length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-gray-400">No cause marketing records yet.</div>
            ) : (
              (causeMarketing || []).map((cm) => (
                <Card key={cm.id} className="hover:shadow-md transition-shadow group relative">
                  <CardHeader className="pt-5 pb-2 px-5">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-base leading-snug">{cm.title}</CardTitle>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => handleEditCM(cm)} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-amber-600 hover:bg-amber-50 transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCM(cm.id)} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <Badge variant={cm.status === 'Active' ? 'success' : 'secondary'}>{cm.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-3">
                    <p className="text-sm text-gray-500 line-clamp-2">{cm.description}</p>
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Raised YTD</span>
                        <span className="font-bold text-gray-900">₱{Number(cm.raisedYtd || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Active Partners</span>
                        <span className="font-bold text-gray-900">{Number(cm.activePartners || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const modalTitle = () => {
    if (activeTab === 'Grants') return currentGrant ? 'Edit Grant' : 'Create New Grant';
    if (activeTab === 'Campaign') return currentEvent ? 'Edit Campaign Event' : 'Create New Campaign Event';
    if (activeTab === 'CauseMarketing') return currentCM ? 'Edit Cause Marketing' : 'Create New Cause Marketing';
    return currentCampaign ? `Edit ${singularLabel}` : `Create New ${singularLabel}`;
  };

  return (
    <div className="space-y-5 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Fundraising & Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Strategic planning and management of all revenue streams.</p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Create New {singularLabel}
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex p-1 bg-gray-100 rounded-xl gap-0.5 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'
              }`}
            >
              <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats — Projects only */}
      {activeTab === 'Projects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Projects</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs text-gray-400 mt-1">{completedCount} completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Target</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">₱{totalTarget.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Raised</p>
              <p className="mt-2 text-2xl font-bold text-primary-700">₱{totalRaised.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">
                {totalTarget ? Math.round((totalRaised / totalTarget) * 100) : 0}% of overall goal
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content */}
      <div>{renderTabContent()}</div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalTitle()}>
        <form onSubmit={handleSubmit} className="space-y-4">

          {activeTab === 'Projects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <Input name="title" required placeholder="Enter project title..." defaultValue={currentCampaign?.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                    <Input name="target" type="number" className="pl-7" placeholder="0.00" required min="1" defaultValue={currentCampaign?.target} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <Input name="endDate" type="date" required defaultValue={toInputDate(currentCampaign?.endDate)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <Select name="status" defaultValue={currentCampaign?.status || 'Active'} options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Completed', value: 'Completed' },
                  { label: 'Paused', value: 'Paused' },
                ]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea name="description" required defaultValue={currentCampaign?.description}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                  placeholder="Describe the goals and impact..." />
              </div>
            </>
          )}

          {activeTab === 'Campaign' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
                <Input name="title" required placeholder="Enter event title..." defaultValue={currentEvent?.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <Input name="date" type="date" required defaultValue={toInputDate(currentEvent?.date)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time</label>
                  <Input name="time" type="time" defaultValue={currentEvent?.time} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                    <Input name="goal" type="number" className="pl-7" placeholder="0.00" min="0" defaultValue={currentEvent?.goal} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <Select name="status" defaultValue={currentEvent?.status || 'Upcoming'} options={[
                    { label: 'Upcoming', value: 'Upcoming' },
                    { label: 'Ongoing', value: 'Ongoing' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Cancelled', value: 'Cancelled' },
                  ]} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                      <Upload className="h-7 w-7 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP up to 5MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea name="description" defaultValue={currentEvent?.description}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                  placeholder="Describe this campaign event..." />
              </div>
            </>
          )}

          {activeTab === 'Grants' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Grant Title</label>
                <Input name="title" required placeholder="Enter grant opportunity..." defaultValue={currentGrant?.title} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization</label>
                <Input name="org" required placeholder="Funding organization" defaultValue={currentGrant?.org} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Request Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                    <Input name="amount" type="number" className="pl-7" placeholder="0.00" required min="1" defaultValue={currentGrant?.amount} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                  <Input name="deadline" type="date" required defaultValue={toInputDate(currentGrant?.deadline)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <Select name="status" defaultValue={currentGrant?.status || 'Under Review'} options={[
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Under Review', value: 'Under Review' },
                    { label: 'Drafting', value: 'Drafting' },
                    { label: 'Declined', value: 'Declined' },
                  ]} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Proposal ID</label>
                  <Input name="propId" required placeholder="PR-YYYY-XXX" defaultValue={currentGrant?.propId} />
                </div>
              </div>
            </>
          )}

          {activeTab === 'CauseMarketing' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <Input name="title" required placeholder="Enter campaign title..." defaultValue={currentCM?.title} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <Select name="status" defaultValue={currentCM?.status || 'Active'} options={[
                  { label: 'Active', value: 'Active' },
                  { label: 'Inactive', value: 'Inactive' },
                  { label: 'Completed', value: 'Completed' },
                ]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Raised YTD</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                    <Input name="raisedYtd" type="number" className="pl-7" placeholder="0.00" min="0" defaultValue={currentCM?.raisedYtd} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Active Partners</label>
                  <Input name="activePartners" type="number" placeholder="0" min="0" defaultValue={currentCM?.activePartners} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea name="description" defaultValue={currentCM?.description}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] resize-none"
                  placeholder="Describe this cause marketing initiative..." />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit">
              {activeTab === 'Grants' ? (currentGrant ? 'Update Grant' : 'Create Grant') :
               activeTab === 'Campaign' ? (currentEvent ? 'Update Event' : 'Create Event') :
               activeTab === 'CauseMarketing' ? (currentCM ? 'Update' : 'Create') :
               (currentCampaign ? 'Update Project' : 'Create Project')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}