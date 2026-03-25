import React, { useState } from 'react';
import { Mail, Plus, Settings, Trash2, Save, Zap, X, FileText, BarChart2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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
          <h2 className="text-base font-semibold text-gray-900">
            {template?.id ? 'Edit Template' : 'New Template'}
          </h2>
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
    'New Donor Added',
    'Donation Received',
    'No Donation > 3 months',
    'No Donation > 6 months',
    'Campaign Goal Reached',
    'Campaign Ended',
    'Billing Statement Requested',
    'Progress Report Due',
  ];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...workflow,
      name,
      trigger,
      status,
      description,
      delay,
      templateId: templateId ? Number(templateId) : null,
      personInCharge,
      steps: workflow?.steps || 1,
    });
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
                  }`}>
                  {s}
                </button>
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
    <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
      <BarChart2 className={`h-6 w-6 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
    </div>
  );
  return (
    <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
      <Zap className={`h-6 w-6 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
    </div>
  );
}

// ─── WORKFLOW CARD ────────────────────────────────────────────────────────────
function WorkflowCard({ workflow, templates, onConfigure }) {
  const isActive = workflow.status === 'Active';
  const triggerColor = workflow.type === 'billing'
    ? 'bg-orange-50 text-orange-700 border border-orange-200'
    : workflow.type === 'progress'
    ? 'bg-purple-50 text-purple-700 border border-purple-200'
    : 'bg-blue-50 text-blue-700 border border-blue-200';

  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start space-x-4 min-w-0">
          <WorkflowIcon workflow={workflow} />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium text-gray-900">{workflow.name}</h3>

            {/* Trigger pill — always visible */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${triggerColor}`}>
                <span className="opacity-60">Trigger:</span> {workflow.trigger}
              </span>
              <span className="text-xs text-gray-400">
                {workflow.steps} step{workflow.steps !== 1 ? 's' : ''}
                {Number(workflow.delay) > 0 && ` · ${workflow.delay}h delay`}
              </span>
            </div>

            {workflow.description && (
              <p className="text-xs text-gray-400 mt-1">{workflow.description}</p>
            )}

            {/* Meta row: template + person in charge */}
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
        <div className="flex items-center space-x-3 flex-shrink-0 mt-0.5">
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {workflow.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={onConfigure}>
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function Communications() {
  const [activeTab, setActiveTab] = useState('templates');

  const [templates, setTemplates] = useState(defaultTemplates);
  const [templateModal, setTemplateModal] = useState(null);

  const [workflows, setWorkflows] = useState(defaultWorkflows);
  const [workflowModal, setWorkflowModal] = useState(null);

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

      {/* Modals */}
      {templateModal !== null && (
        <TemplateModal
          template={templateModal === 'new' ? null : templateModal}
          onClose={() => setTemplateModal(null)}
          onSave={handleSaveTemplate}
        />
      )}
      {workflowModal !== null && (
        <WorkflowModal
          workflow={workflowModal}
          templates={templates}
          onClose={() => setWorkflowModal(null)}
          onSave={handleSaveWorkflow}
        />
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: 'Templates', icon: Mail },
            { id: 'automation', label: 'Automation', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`${
                activeTab === id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Templates Tab ── */}
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
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span>Last edited: {template.lastEdited}</span>
                    <Mail className="h-3 w-3" />
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

      {/* ── Automation Tab ── */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">General</h3>
            <div className="space-y-3">
              {generalWorkflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} templates={templates} onConfigure={() => setWorkflowModal(workflow)} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Document Requests</h3>
            <div className="space-y-3">
              {documentWorkflows.map((workflow) => (
                <WorkflowCard key={workflow.id} workflow={workflow} templates={templates} onConfigure={() => setWorkflowModal(workflow)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}