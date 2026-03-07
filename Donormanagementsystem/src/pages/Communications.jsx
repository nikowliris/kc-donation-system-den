import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, Plus, Settings, Clock, CheckCircle, Trash2, Inbox } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

const API = import.meta.env.VITE_API_URL || '/api';

const staticTemplates = [
  { id: 1, name: 'Donation Thank You', subject: 'Thank you for your generous donation!', lastEdited: '2 days ago' },
  { id: 2, name: 'Campaign Update', subject: 'Update on [Campaign Name]', lastEdited: '1 week ago' },
  { id: 3, name: 'Welcome New Donor', subject: 'Welcome to the Knowledge Channel family', lastEdited: '3 weeks ago' },
  { id: 4, name: 'Year-End Appeal', subject: 'Help us finish the year strong', lastEdited: '1 month ago' },
];

const staticWorkflows = [
  { id: 1, name: 'New Donor Welcome Series', trigger: 'New Donor Added', status: 'Active', steps: 3 },
  { id: 2, name: 'Donation Receipt', trigger: 'Donation Received', status: 'Active', steps: 1 },
  { id: 3, name: 'Lapsed Donor Re-engagement', trigger: 'No Donation > 6 months', status: 'Paused', steps: 2 },
];

export function Communications() {
  const [activeTab, setActiveTab] = useState('templates');

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [historySearch, setHistorySearch] = useState('');

  const [replies, setReplies] = useState([]);
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const chatBottomRef = useRef(null);
  const token = localStorage.getItem('token');

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchReplies = async (msgId) => {
    try {
      const res = await fetch(`${API}/messages/${msgId}/replies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReplies(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMessages();
    }
  }, [activeTab]);

  // Auto-refresh replies every 8 seconds when a message is selected
  useEffect(() => {
    if (!selectedMessage) return;
    const interval = setInterval(() => fetchReplies(selectedMessage.id), 8000);
    return () => clearInterval(interval);
  }, [selectedMessage?.id]);

  // Scroll to bottom when replies update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    setReplyBody('');
    setSendStatus(null);
    setReplies([]);
    fetchReplies(msg.id);

    if (msg.status === 'Unread') {
      await fetch(`${API}/messages/${msg.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: 'Read' } : m)));
      setSelectedMessage((prev) => ({ ...prev, status: 'Read' }));
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedMessage) return;
    setIsSending(true);
    setSendStatus(null);
    try {
      const res = await fetch(`${API}/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ replyBody }),
      });
      if (res.ok) {
        setSendStatus('success');
        setReplyBody('');
        fetchReplies(selectedMessage.id);
        setTimeout(() => setSendStatus(null), 2000);
      } else {
        setSendStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`${API}/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) { setSelectedMessage(null); setReplies([]); }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = messages.filter((m) => m.status === 'Unread').length;
  const filteredMessages = messages.filter((m) =>
    m.name.toLowerCase().includes(historySearch.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(historySearch.toLowerCase()) ||
    m.email.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Build chat thread: original message + all replies sorted by time
  const buildThread = () => {
    if (!selectedMessage) return [];
    const original = {
      id: `orig-${selectedMessage.id}`,
      sender: 'user',
      text: selectedMessage.message,
      time: selectedMessage.created_at,
    };
    const replyItems = replies.map((r) => ({
      id: r.id,
      sender: r.sender === 'user' ? 'user' : 'admin',
      text: r.reply_body,
      time: r.sent_at,
    }));
    return [original, ...replyItems].sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500">Manage email templates, automation, and communication history.</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />New Template</Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', label: 'Templates', icon: Mail },
            { id: 'automation', label: 'Automation', icon: Settings },
            { id: 'history', label: 'Messages', icon: Clock, badge: unreadCount },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staticTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="group-hover:text-primary-600 transition-colors">{template.name}</span>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Edit</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase font-semibold">Subject</span>
                    <p className="text-sm text-gray-700">{template.subject}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-4">
                    <span>Last edited: {template.lastEdited}</span>
                    <Mail className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed border-2 bg-gray-50 flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto text-gray-400" />
              <span className="mt-2 block text-sm font-medium text-gray-900">Create new template</span>
            </div>
          </Card>
        </div>
      )}

      {/* Automation */}
      {activeTab === 'automation' && (
        <div className="space-y-4">
          {staticWorkflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${workflow.status === 'Active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Settings className={`h-6 w-6 ${workflow.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-500">Trigger: {workflow.trigger} • {workflow.steps} steps</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={workflow.status === 'Active' ? 'success' : 'secondary'}>{workflow.status}</Badge>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Messages — chat view */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-280px)]">

          {/* Left: message list */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <Input placeholder="Search messages..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase">Inbox</span>
              <span className="text-xs text-gray-400">{filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {loadingMessages && <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading...</div>}
              {!loadingMessages && filteredMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Inbox className="h-8 w-8" /><p className="text-sm">No messages yet</p>
                </div>
              )}
              {filteredMessages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMessage(m)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === m.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {m.status === 'Unread' && <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                        <p className={`text-sm truncate ${m.status === 'Unread' ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{m.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{m.subject || '(no subject)'}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{m.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Right: chat thread */}
          <Card className="flex flex-col overflow-hidden">
            {!selectedMessage ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Mail className="h-10 w-10" />
                <p className="text-sm font-medium">Select a message to read</p>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b flex items-start justify-between flex-shrink-0">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{selectedMessage.subject || '(no subject)'}</h2>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>From: <span className="font-medium text-gray-700">{selectedMessage.name}</span></span>
                      <span className="text-blue-600">{selectedMessage.email}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        selectedMessage.status === 'Unread' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {selectedMessage.status === 'Unread'
                          ? <><Clock className="h-3 w-3 mr-1" />Unread</>
                          : <><CheckCircle className="h-3 w-3 mr-1" />Read</>
                        }
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMessage(selectedMessage.id)} className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Chat bubbles */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {buildThread().map((item) => {
                    const isAdmin = item.sender === 'admin';
                    return (
                      <div key={item.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[75%]">
                          <p className={`text-[10px] text-gray-400 mb-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                            {isAdmin ? 'You (Admin)' : selectedMessage.name} · {new Date(item.time).toLocaleString()}
                          </p>
                          <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                            isAdmin
                              ? 'bg-blue-600 text-white rounded-tr-sm'
                              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          }`}>
                            {item.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Reply input */}
                <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                  {sendStatus === 'success' && (
                    <p className="flex items-center gap-1 text-xs text-green-600 font-medium mb-2">
                      <CheckCircle className="h-3.5 w-3.5" /> Reply sent!
                    </p>
                  )}
                  {sendStatus === 'error' && (
                    <p className="text-xs text-red-500 font-medium mb-2">Failed to send. Try again.</p>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder={`Reply to ${selectedMessage.name}...`}
                      value={replyBody}
                      onChange={(e) => { setReplyBody(e.target.value); setSendStatus(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={isSending || !replyBody.trim()}
                      className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}