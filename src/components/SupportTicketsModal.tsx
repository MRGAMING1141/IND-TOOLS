import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../types';
import {
  LifeBuoy,
  X,
  Plus,
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  User,
  Shield,
  ArrowLeft,
  FolderOpen,
} from 'lucide-react';

interface SupportTicketsModalProps {
  onClose: () => void;
}

export const SupportTicketsModal: React.FC<SupportTicketsModalProps> = ({ onClose }) => {
  const { user, signIn, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('activation');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [orderId, setOrderId] = useState('');
  const [message, setMessage] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Ticket[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setTickets(list);
        setLoading(false);

        // Keep selected ticket in sync if viewing
        if (selectedTicket) {
          const updated = list.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      },
      (err) => {
        console.error('Error fetching tickets:', err);
        handleFirestoreError(err, OperationType.LIST, 'tickets');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      setCreateError('Please fill in both a subject and message.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError('');

    try {
      const ticketsRef = collection(db, 'tickets');
      const docRef = await addDoc(ticketsRef, {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Customer',
        subject: subject.trim(),
        category,
        priority,
        orderId: orderId.trim(),
        message: message.trim(),
        status: 'open' as TicketStatus,
        responses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubject('');
      setMessage('');
      setOrderId('');
      setIsCreating(false);
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      handleFirestoreError(err, OperationType.CREATE, 'tickets');
      setCreateError(err.message || 'Failed to submit ticket.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!user || !selectedTicket || !replyText.trim()) return;
    setReplyLoading(true);

    try {
      const newResponse = {
        id: `resp_${Date.now()}`,
        senderId: user.uid,
        senderEmail: user.email || '',
        senderRole: (isAdmin ? 'admin' : 'user') as 'admin' | 'user',
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedResponses = [...(selectedTicket.responses || []), newResponse];

      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        responses: updatedResponses,
        updatedAt: serverTimestamp(),
      });

      setReplyText('');
    } catch (err: any) {
      console.error('Failed to send response:', err);
      handleFirestoreError(err, OperationType.UPDATE, `tickets/${selectedTicket.id}`);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    try {
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Support & Inquiry Tickets</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Direct Response
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Order verification, custom script inquiries, and bug assistance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs bg-white/70">
          {!user ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center shadow-xs">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Sign In to Access Tickets</h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Submit inquiries, report bugs, track tool activation status, and communicate directly with the engineering team.
                </p>
              </div>
              <button
                onClick={signIn}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white clay-button-primary flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-sm"
              >
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : selectedTicket ? (
            /* Viewing specific ticket thread */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Tickets</span>
                </button>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold tracking-wider ${
                      selectedTicket.status === 'open'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : selectedTicket.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : selectedTicket.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicket}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 cursor-pointer"
                    >
                      Close Ticket
                    </button>
                  )}
                </div>
              </div>

              {/* Ticket Details */}
              <div className="p-4.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h4>
                  <span className="text-[10px] text-slate-500 uppercase font-mono font-semibold">
                    Category: {selectedTicket.category}
                  </span>
                </div>
                {selectedTicket.orderId && (
                  <span className="text-[11px] text-blue-600 block font-mono font-semibold">
                    Order Ref: #{selectedTicket.orderId}
                  </span>
                )}
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pt-1">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Conversation Responses */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Thread Responses ({selectedTicket.responses?.length || 0})
                </span>

                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  selectedTicket.responses.map((resp) => {
                    const isAdminSender = resp.senderRole === 'admin';
                    return (
                      <div
                        key={resp.id}
                        className={`p-3.5 rounded-2xl border ${
                          isAdminSender
                            ? 'bg-blue-50/60 border-blue-200 ml-4'
                            : 'bg-slate-50 border-slate-200 mr-4'
                        } space-y-1 shadow-xs`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold flex items-center gap-1.5">
                            {isAdminSender ? (
                              <>
                                <Shield className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-blue-900 font-bold">IND Support (Admin)</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-slate-800 font-semibold">{resp.senderEmail}</span>
                              </>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{resp.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-xs italic">
                    No replies yet. An administrator will review your ticket and reply directly here.
                  </p>
                )}
              </div>

              {/* Reply Input Box */}
              {selectedTicket.status !== 'closed' && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Type your reply or follow-up question here..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendReply}
                      disabled={replyLoading || !replyText.trim()}
                      className="px-4 py-2 rounded-xl font-bold text-xs text-white clay-button-primary flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{replyLoading ? 'Sending...' : 'Send Reply'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isCreating ? (
            /* Creating new ticket form */
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to My Tickets</span>
                </button>
                <span className="text-xs font-bold text-slate-900">New Ticket</span>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-slate-800 font-semibold mb-1">Subject / Issue Title *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Order #4289 activation check / Luau obfuscator question"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-800 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="activation">Pack Activation</option>
                    <option value="order">Payment / Order Query</option>
                    <option value="bug">Bug Report</option>
                    <option value="script_request">Custom Script Request</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 shadow-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold mb-1">Order Ref ID (Optional)</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. 7X89A12B"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-semibold mb-1">Detailed Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your request, issue, or question with as much detail as possible..."
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white clay-button-primary disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {createSubmitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          ) : (
            /* Ticket List */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">
                  My Submitted Tickets ({tickets.length})
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white clay-button-primary flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Open New Ticket</span>
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">No Support Tickets</h5>
                    <p className="text-slate-500 text-xs mt-0.5">
                      You haven't submitted any support requests yet.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 cursor-pointer shadow-xs"
                  >
                    Open your first ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {t.subject}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] uppercase font-bold tracking-wider ${
                              t.status === 'open'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : t.status === 'in_progress'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : t.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="capitalize">{t.category}</span>
                          <span>•</span>
                          <span>{t.responses?.length || 0} replies</span>
                          {t.orderId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-blue-600 font-semibold">Order #{t.orderId}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
