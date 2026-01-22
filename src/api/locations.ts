import { api } from "./dashboard";

export interface Location {
  _id?: string;
  id: string;
  Location: string;
  Address?: string;
  Phone?: string;
  Email?: string;
  Status?: "Active" | "Inactive";
  img?: string;
  Span?: string;
  // Additional fields that might come from backend
  [key: string]: any;
}

export interface LocationResponse {
  data: Location[];
  total?: number;
  page?: number;
  limit?: number;
}

export const fetchLocations = async (): Promise<Location[]> => {
  // NOTE: `api` baseURL already includes `/api`
  const { data } = await api.get<LocationResponse | Location[]>("/locations");
  // Handle both array response and paginated response
  if (Array.isArray(data)) {
    return data;
  }
  return data.data || [];
};

export const createLocation = async (locationData: Partial<Location>): Promise<Location> => {
  const { data } = await api.post<Location>("/locations", locationData);
  return data;
};

export const updateLocation = async (id: string, locationData: Partial<Location>): Promise<Location> => {
  const { data } = await api.patch<Location>(`/locations/${id}`, locationData);
  return data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/locations/${id}`);
};
