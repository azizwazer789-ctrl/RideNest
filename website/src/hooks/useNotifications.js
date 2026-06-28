import { useEffect, useState } from "react";
import {
  deleteNotification,
  getErrorMessage,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/api";
import { getToken } from "../services/auth";

/** Accepts a plain array, the API's real {notifications, unread_count}
 * shape, or a generic {items, ...} paginated shape, and normalizes them. */
function parseNotificationsResponse(data) {
  const list = Array.isArray(data)
    ? data
    : data?.notifications || data?.items || [];
  const unreadCount =
    typeof data?.unread_count === "number"
      ? data.unread_count
      : list.filter((notification) => !notification.is_read).length;
  return { list, unreadCount };
}

/**
 * Single source of truth for the logged-in user's notifications. Mounted
 * once in MainLayout and shared with the navbar bell (via props) and the
 * Notifications page (via Outlet context), so read/delete actions taken
 * in either place stay in sync everywhere.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState("");
  const [mutatingId, setMutatingId] = useState(null);

  async function refresh() {
    if (!getToken()) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getMyNotifications();
      const { list, unreadCount: count } = parseNotificationsResponse(data);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      if (!getToken()) {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getMyNotifications();
        const { list, unreadCount: count } = parseNotificationsResponse(data);
        if (!cancelled) {
          setNotifications(list);
          setUnreadCount(count);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  async function markRead(notificationId) {
    setMutatingId(notificationId);
    setError("");

    try {
      await markNotificationRead(notificationId);
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  }

  async function markAllRead() {
    setError("");

    try {
      await markAllNotificationsRead();
      setNotifications((previous) =>
        previous.map((notification) => ({ ...notification, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function remove(notificationId) {
    setMutatingId(notificationId);
    setError("");

    try {
      await deleteNotification(notificationId);
      const target = notifications.find((notification) => notification.id === notificationId);
      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== notificationId)
      );
      if (target && !target.is_read) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    mutatingId,
    refresh,
    markRead,
    markAllRead,
    remove,
  };
}
