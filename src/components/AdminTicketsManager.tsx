import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, ADMIN_EMAIL } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Ticket, TicketStatus, TicketPriority } from '../types';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  MessageSquare,
  Shield,
  User,
  ArrowRight,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

export const AdminTicketsManager: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Ticket[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setTickets(list);
        setLoading(false);

        if (selectedTicket) {
          const fresh = list.find((t) => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      },
      (err) => {
        console.error('Error fetching admin tickets:', err);
        handleFirestoreError(err, OperationType.LIST, 'tickets');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.userEmail?.toLowerCase().includes(q) ||
      t.userName?.toLowerCase().includes(q) ||
      t.subject?.toLowerCase().includes(q) ||
      t.orderId?.toLowerCase().includes(q)
    );
  });

  const handleSendAdminReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setActionLoading(true);

    try {
      const newResponse = {
        id: `resp_${Date.now()}`,
        senderId: user?.uid || 'admin',
        senderEmail: user?.email || ADMIN_EMAIL,
        senderRole: 'admin' as const,
        text: replyText.trim(),
        createdAt: new Date().toISOString(),
      };

      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        responses: [...(selectedTicket.responses || []), newResponse],
        status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
        updatedAt: serverTimestamp(),
      });

      setReplyText('');
      setSuccessMsg('Reply sent to customer!');
      addToast({
        type: 'success',
        title: 'Reply Sent',
        message: `Response recorded for ticket #${selectedTicket.id.slice(-6).toUpperCase()}.`,
      });
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Reply Failed',
        message: err.message || 'Error sending reply.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setSuccessMsg(`Ticket status updated to ${newStatus.replace('_', ' ')}!`);
      addToast({
        type: 'order-updated',
        title: 'Status Updated',
        message: `Ticket #${selectedTicket.id.slice(-6).toUpperCase()} marked as ${newStatus.replace('_', ' ')}.`,
      });
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Error updating status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Total Inquiries</span>
          <span className="text-xl font-bold font-mono text-slate-900">{tickets.length}</span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Open / Unanswered</span>
          <span className={`text-xl font-bold font-mono ${openCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {openCount}
          </span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">In Progress</span>
          <span className="text-xl font-bold font-mono text-blue-600">{inProgressCount}</span>
        </div>

        <div className="glass-card bg-white/80 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">Resolved</span>
          <span className="text-xl font-bold font-mono text-emerald-600">{resolvedCount}</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-xs">
          <span className="font-semibold">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket subject, email, order ref..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses ({tickets.length})</option>
            <option value="open">Open ({openCount})</option>
            <option value="in_progress">In Progress ({inProgressCount})</option>
            <option value="resolved">Resolved ({resolvedCount})</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Split: Ticket List vs Conversation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading tickets...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white/80 rounded-2xl border border-slate-200 shadow-xs">
              No tickets matching criteria.
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedTicket?.id === t.id
                    ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-slate-900 text-xs truncate max-w-[220px]">
                    {t.subject}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider shrink-0 ${
                      t.status === 'open'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : t.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : t.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <span className="block text-slate-700 font-medium truncate">{t.userName} ({t.userEmail})</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="capitalize">{t.category}</span>
                    <span>•</span>
                    <span className="uppercase text-amber-600 font-semibold">{t.priority} priority</span>
                    <span>•</span>
                    <span>{t.responses?.length || 0} replies</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Ticket Conversation Workspace */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <div className="glass-panel bg-white/90 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
              {/* Header and Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h3>
                  <span className="text-[11px] text-slate-500">
                    From: <strong className="text-slate-800">{selectedTicket.userName}</strong> ({selectedTicket.userEmail})
                  </span>
                </div>

                {/* Status Switchers */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus('in_progress')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold cursor-pointer"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                  >
                    Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('closed')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[10px] font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Initial Customer Message */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Initial Problem Statement
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>
                {selectedTicket.orderId && (
                  <span className="text-[11px] font-mono text-blue-600 block pt-1 font-semibold">
                    Related Order ID: #{selectedTicket.orderId}
                  </span>
                )}
              </div>

              {/* Responses Thread */}
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
                  selectedTicket.responses.map((resp) => {
                    const isAdmin = resp.senderRole === 'admin';
                    return (
                      <div
                        key={resp.id}
                        className={`p-3 rounded-2xl border ${
                          isAdmin
                            ? 'bg-blue-50/70 border-blue-200 ml-4'
                            : 'bg-slate-50 border-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold flex items-center gap-1.5">
                            {isAdmin ? (
                              <>
                                <Shield className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-blue-800 font-bold">Admin Response ({resp.senderEmail})</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-slate-700 font-medium">{resp.senderEmail}</span>
                              </>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(resp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{resp.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-[11px] italic text-center py-4">
                    No responses yet. Type an admin reply below.
                  </p>
                )}
              </div>

              {/* Reply Box */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type official admin response to customer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendAdminReply}
                    disabled={actionLoading || !replyText.trim()}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-white clay-button-primary flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Sending...' : 'Send Customer Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 glass-panel bg-white/80 rounded-3xl border border-slate-200 shadow-xs">
              Select a ticket on the left to review the inquiry thread and send replies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
