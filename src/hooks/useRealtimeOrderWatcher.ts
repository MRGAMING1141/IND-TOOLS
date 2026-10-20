import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where, orderBy, DocumentChange } from 'firebase/firestore';
import { db, isUserAdmin } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order, OrderStatus } from '../types';

interface RealtimeWatcherOptions {
  onOpenSalesLog?: () => void;
  onOpenMyOrders?: () => void;
}

export function useRealtimeOrderWatcher(options?: RealtimeWatcherOptions) {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Keep options in ref to avoid re-triggering effect when callbacks change
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Track known orders to detect real changes across snapshots
  const knownOrdersRef = useRef<Map<string, Order>>(new Map());
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset tracker on user switch
    knownOrdersRef.current.clear();
    initializedRef.current = false;

    if (!user) return;

    const isAdmin = isUserAdmin(user.email);

    let q;
    if (isAdmin) {
      // Admin listens to all recent orders across the system
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    } else {
      // Customer listens to their personal orders
      q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // If this is the initial snapshot, index all existing orders without alerting
        if (!initializedRef.current) {
          snapshot.docs.forEach((doc) => {
            const data = doc.data() as Order;
            knownOrdersRef.current.set(doc.id, { ...data, id: doc.id });
          });
          initializedRef.current = true;
          return;
        }

        // Process incremental document changes in real-time
        snapshot.docChanges().forEach((change: DocumentChange) => {
          const docId = change.doc.id;
          const currentOrder = { ...change.doc.data(), id: docId } as Order;
          const prevOrder = knownOrdersRef.current.get(docId);
          const shortId = docId.slice(-6).toUpperCase();

          if (change.type === 'added') {
            // New order placed in real-time
            const orderAmount = currentOrder.amount ?? currentOrder.totalAmount ?? 0;
            if (!prevOrder) {
              if (isAdmin) {
                addToast({
                  type: 'order-new',
                  title: `🔔 New Order Received #${shortId}`,
                  message: `${currentOrder.userEmail || 'Customer'} placed an order for ₹${orderAmount} (${(currentOrder.packs || []).join(', ') || 'Pack'}).`,
                  metadata: {
                    orderId: docId,
                    amount: orderAmount,
                    userEmail: currentOrder.userEmail,
                    newStatus: currentOrder.status,
                    packs: currentOrder.packs,
                  },
                  action: optionsRef.current?.onOpenSalesLog
                    ? {
                        label: 'View in Sales Log',
                        onClick: optionsRef.current.onOpenSalesLog,
                      }
                    : undefined,
                });
              } else {
                addToast({
                  type: 'order-new',
                  title: `Order #${shortId} Submitted`,
                  message: `Your order for ₹${orderAmount} was recorded and is awaiting activation verification.`,
                  action: optionsRef.current?.onOpenMyOrders
                    ? {
                        label: 'View Order',
                        onClick: optionsRef.current.onOpenMyOrders,
                      }
                    : undefined,
                });
              }
            }
            knownOrdersRef.current.set(docId, currentOrder);
          } else if (change.type === 'modified') {
            const oldStatus = prevOrder?.status;
            const newStatus = currentOrder.status;

            if (isAdmin) {
              // Admin notification for Sales Log modification
              if (oldStatus !== newStatus) {
                if (newStatus === 'approved') {
                  addToast({
                    type: 'order-approved',
                    title: `⚡ Order #${shortId} Approved`,
                    message: `Status updated to Approved by ${currentOrder.approvedBy || 'Admin'}. Customer pack entitlements granted.`,
                    metadata: {
                      orderId: docId,
                      oldStatus,
                      newStatus,
                      userEmail: currentOrder.userEmail,
                    },
                    action: optionsRef.current?.onOpenSalesLog
                      ? { label: 'Open Sales Log', onClick: optionsRef.current.onOpenSalesLog }
                      : undefined,
                  });
                } else if (newStatus === 'completed') {
                  addToast({
                    type: 'order-completed',
                    title: `✅ Order #${shortId} Completed`,
                    message: `Order marked Completed & permanently confirmed.`,
                    metadata: { orderId: docId, oldStatus, newStatus },
                  });
                } else if (newStatus === 'rejected') {
                  addToast({
                    type: 'order-rejected',
                    title: `❌ Order #${shortId} Rejected`,
                    message: `Order rejected. Reason: ${currentOrder.rejectionReason || 'Payment verification failed'}.`,
                    metadata: { orderId: docId, oldStatus, newStatus },
                  });
                } else {
                  addToast({
                    type: 'order-updated',
                    title: `📝 Order #${shortId} Status: ${newStatus}`,
                    message: `Sales log status transitioned from ${oldStatus || 'unknown'} to ${newStatus}.`,
                    metadata: { orderId: docId, oldStatus, newStatus },
                  });
                }
              } else {
                // Same status, but other sales log fields modified
                addToast({
                  type: 'order-updated',
                  title: `📝 Sales Log Entry #${shortId} Updated`,
                  message: `Order record details (notes, reference, or entitlements) were updated in real-time.`,
                  metadata: {
                    orderId: docId,
                    userEmail: currentOrder.userEmail,
                  },
                });
              }
            } else {
              // Customer notifications
              if (oldStatus !== newStatus) {
                if (newStatus === 'approved') {
                  addToast({
                    type: 'order-approved',
                    title: `🎉 Order #${shortId} Approved & Activated!`,
                    message: `Your payment was verified and your tool packs are now unlocked in your workspace!`,
                    duration: 9000,
                    metadata: { orderId: docId, oldStatus, newStatus },
                    action: optionsRef.current?.onOpenMyOrders
                      ? { label: 'View Unlocked Tools', onClick: optionsRef.current.onOpenMyOrders }
                      : undefined,
                  });
                } else if (newStatus === 'completed') {
                  addToast({
                    type: 'order-completed',
                    title: `🌟 Order #${shortId} Fully Completed`,
                    message: `All license activations and entitlements are permanently synced.`,
                    duration: 8000,
                    action: optionsRef.current?.onOpenMyOrders
                      ? { label: 'My Orders', onClick: optionsRef.current.onOpenMyOrders }
                      : undefined,
                  });
                } else if (newStatus === 'rejected') {
                  addToast({
                    type: 'order-rejected',
                    title: `⚠️ Order #${shortId} Update`,
                    message: `Order verification note: "${currentOrder.rejectionReason || 'Reference mismatch'}". Tap to review.`,
                    duration: 10000,
                    action: optionsRef.current?.onOpenMyOrders
                      ? { label: 'Check Details', onClick: optionsRef.current.onOpenMyOrders }
                      : undefined,
                  });
                } else {
                  addToast({
                    type: 'order-updated',
                    title: `Order #${shortId} Status Updated`,
                    message: `Current status: ${newStatus}.`,
                  });
                }
              } else {
                addToast({
                  type: 'order-updated',
                  title: `Order #${shortId} Updated`,
                  message: `Your order details were updated by support.`,
                });
              }
            }

            knownOrdersRef.current.set(docId, currentOrder);
          } else if (change.type === 'removed') {
            if (isAdmin) {
              addToast({
                type: 'info',
                title: `Order #${shortId} Removed`,
                message: `Order record was deleted from the sales log.`,
              });
            }
            knownOrdersRef.current.delete(docId);
          }
        });
      },
      (err) => {
        console.warn('Real-time order listener notice:', err.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, addToast]);
}
