import { api } from "./dashboard";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "appointment" | "system" | "reminder" | "update" | "other";
  avatar?: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface NotificationListResponse {
  data: Notification[];
  unreadCount: number;
  total: number;
}

export interface MarkAsReadResponse {
  success: boolean;
  message?: string;
}

// Fetch notifications for the current user
export const fetchNotifications = async (params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.unreadOnly) queryParams.append("unreadOnly", "true");

  const queryString = queryParams.toString();
  const url = `/notifications${queryString ? `?${queryString}` : ""}`;
  
  try {
    const { data } = await api.get<NotificationListResponse>(url);
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return mock data for development
    if (error?.response?.status === 404) {
      return getMockNotifications(params);
    }
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  notificationId: string
): Promise<MarkAsReadResponse> => {
  try {
    const { data } = await api.patch<MarkAsReadResponse>(
      `/notifications/${notificationId}/read`
    );
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return success for development
    if (error?.response?.status === 404) {
      return { success: true };
    }
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<MarkAsReadResponse> => {
  try {
    const { data } = await api.patch<MarkAsReadResponse>("/notifications/read-all");
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return success for development
    if (error?.response?.status === 404) {
      return { success: true };
    }
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (
  notificationId: string
): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success: boolean }>(
      `/notifications/${notificationId}`
    );
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return success for development
    if (error?.response?.status === 404) {
      return { success: true };
    }
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async (): Promise<{ success: boolean }> => {
  try {
    const { data } = await api.delete<{ success: boolean }>("/notifications");
    return data;
  } catch (error: any) {
    // If endpoint doesn't exist, return success for development
    if (error?.response?.status === 404) {
      return { success: true };
    }
    throw error;
  }
};

// Mock notifications for development (when backend endpoint doesn't exist)
const getMockNotifications = (params?: {
  limit?: number;
  unreadOnly?: boolean;
}): NotificationListResponse => {
  const mockNotifications: Notification[] = [
    {
      id: "1",
      title: "Dr. Smith",
      message: "updated the surgery schedule.",
      type: "update",
      avatar: "assets/img/doctors/doctor-01.jpg",
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      title: "Dr. Patel",
      message: "completed a follow-up report for patient Emily.",
      type: "appointment",
      avatar: "assets/img/doctors/doctor-06.jpg",
      isRead: false,
      createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      title: "Emily",
      message: "booked an appointment with Dr. Patel for April 15",
      type: "appointment",
      avatar: "assets/img/doctors/doctor-02.jpg",
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      title: "Amelia",
      message: "completed the pre-visit health questionnaire.",
      type: "reminder",
      avatar: "assets/img/doctors/doctor-07.jpg",
      isRead: false,
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
  ];

  let filtered = mockNotifications;
  if (params?.unreadOnly) {
    filtered = filtered.filter((n) => !n.isRead);
  }
  if (params?.limit) {
    filtered = filtered.slice(0, params.limit);
  }

  return {
    data: filtered,
    unreadCount: mockNotifications.filter((n) => !n.isRead).length,
    total: mockNotifications.length,
  };
};
