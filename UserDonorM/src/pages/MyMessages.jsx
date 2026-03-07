import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, Clock, CheckCircle, Plus, Inbox } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useData } from '../context/DataContext';

const API_URL = 'http://localhost:5001';

export function MyMessages() {
  const { token, user } = useData();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  // Chat reply state
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // Keep selected message in sync with latest replies
        if (selectedMessage) {
          const updated = data.find((m) => m.id === selectedMessage.id);
          if (updated) setSelectedMessage(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Scroll to bottom of chat when replies update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessage?.replies?.length]);

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    setShowCompose(false);
    setReplyText('');
  };

  const handleCompose = () => {
    setSelectedMessage(null);
    setSubject('');
    setBody('');
    setSendStatus(null);
    setShowCompose(true);
  };

  const handleSend = async () => {
    if (!body.trim() || !token) return;
    setSending(true);
    setSendStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, message: body, name: user?.name, email: user?.email }),
      });
      if (res.ok) {
        setSendStatus('success');
        setSubject('');
        setBody('');
        fetchMessages();
        setTimeout(() => setShowCompose(false), 1500);
      } else {
        setSendStatus('error');
      }
    } catch (err) {
      console.error(err);
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !token || !selectedMessage) return;
    setReplying(true);
    try {
      const res = await fetch(`${API_URL}/api/messages/${selectedMessage.id}/user-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ replyBody: replyText }),
      });
      if (res.ok) {
        setReplyText('');
        await fetchMessages();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
        <Mail className="h-10 w-10" />
        <p className="text-sm font-medium">Please log in to view your messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Messages</h1>
          <p className="text-sm text-gray-500">Send a message to the admin and view replies here.</p>
        </div>
        <Button onClick={handleCompose}>
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4" style={{ minHeight: '520px' }}>
        {/* Left: message list */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <span className="text-xs font-semibold text-gray-500 uppercase">Inbox</span>
            <span className="text-xs text-gray-400">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading...</div>
            )}
            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">No messages yet</p>
                <button onClick={handleCompose} className="text-xs text-blue-500 hover:underline">
                  Send your first message
                </button>
              </div>
            )}
            {messages.map((m) => {
              const hasReplies = m.replies?.length > 0;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMessage(m)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === m.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {hasReplies && (
                          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" title="Admin replied" />
                        )}
                        <p className={`text-sm truncate ${hasReplies ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {m.subject || '(no subject)'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{m.message}</p>
                      {hasReplies && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          {m.replies.length} {m.replies.length === 1 ? 'reply' : 'replies'}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: detail or compose */}
        <Card className="flex flex-col overflow-hidden">

          {/* Compose */}
          {showCompose && (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900">New Message to Admin</h2>
                {user && (
                  <p className="text-xs text-gray-500 mt-0.5">Sending as <span className="font-medium">{user.name}</span> · {user.email}</p>
                )}
              </div>
              <div className="flex-1 px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subject</label>
                  <Input
                    placeholder="What is this about?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={8}
                    placeholder="Write your message here..."
                    value={body}
                    onChange={(e) => { setBody(e.target.value); setSendStatus(null); }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
                <div>
                  {sendStatus === 'success' && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="h-3.5 w-3.5" /> Message sent!
                    </span>
                  )}
                  {sendStatus === 'error' && (
                    <span className="text-xs text-red-500 font-medium">Failed to send. Try again.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <button
                    onClick={handleSend}
                    disabled={sending || !body.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message detail — chat view */}
          {!showCompose && selectedMessage && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Thread header */}
              <div className="px-6 py-4 border-b flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900">
                  {selectedMessage.subject || '(no subject)'}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  <span>Started: {new Date(selectedMessage.created_at).toLocaleString()}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    selectedMessage.replies?.length > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedMessage.replies?.length > 0
                      ? <><CheckCircle className="h-3 w-3 mr-1" />Active</>
                      : <><Clock className="h-3 w-3 mr-1" />Awaiting reply</>
                    }
                  </span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {/* Original message — user bubble (right) */}
                <div className="flex justify-end">
                  <div className="max-w-[75%]">
                    <p className="text-[10px] text-gray-400 text-right mb-1">
                      You · {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selectedMessage.replies?.map((r) => {
                  const isUser = r.sender === 'user';
                  return (
                    <div key={r.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%]">
                        <p className={`text-[10px] text-gray-400 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {isUser ? 'You' : 'Admin'} · {new Date(r.sent_at).toLocaleString()}
                        </p>
                        <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                        }`}>
                          {r.reply_body}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Waiting state */}
                {selectedMessage.replies?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
                    <Clock className="h-6 w-6" />
                    <p className="text-sm">Waiting for admin reply...</p>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Reply input */}
              <div className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={replying || !replyText.trim()}
                    className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!showCompose && !selectedMessage && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Mail className="h-10 w-10" />
              <p className="text-sm font-medium">Select a message to view</p>
              <button onClick={handleCompose} className="text-xs text-blue-500 hover:underline">
                Or send a new message
              </button>
            </div>
          )}

        </Card>
      </div>
    </div>
  );
}