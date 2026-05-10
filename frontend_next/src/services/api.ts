const PATH = "https://adaro-data-warehouse.et.r.appspot.com";
// const PATH = "http://localhost:8000";

export interface Location {
  id: number;
  title: string;
  name: string;
  latitude: number;
  longitude: number;
  sensor: boolean;
  category: string;
}

export interface DataRecord {
  date: string;
  hour: number;
  measurement: number;
  DateHour: string;
  [key: string]: unknown;
}

export interface V3TableRecord {
  date: string;
  hour: number;
  actual: number | null;
  pred_1d: number | null;
  pred_2d: number | null;
  pred_3d: number | null;
  diff_1d: number | null;
  diff_2d: number | null;
  diff_3d: number | null;
  rain_actual?: number;
  rainfall?: number;
  rain?: number;
  rain_observed?: number;
  actual_rain?: number;
  rain_forecast_1d?: number;
  rain_forecast_2d?: number;
  rain_forecast_3d?: number;
  [key: string]: unknown;
}

function titleToSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("authTokens");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.access || null;
  } catch {
    return null;
  }
}

async function authFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const resp = await fetch(url, { ...options, headers });

  // Check for 401 (Unathorized here, if 401, then get ttokens? or before authFetch we have to make sure that the token is valid?)

  return resp.json();
}

export const APIService = {
  getLocations: (): Promise<Location[]> =>
    authFetch(`${PATH}/api/locs/`),

  addLocation: (body: Record<string, unknown>): Promise<unknown> =>
    authFetch(`${PATH}/api/locs/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  getData: async (locId: number, isSensor: boolean, locKey: string): Promise<DataRecord[]> => {
    if (isSensor) {
      const response = await authFetch<{ table_data: DataRecord[] }>(`${PATH}/bq/data/retrieve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: locKey }),
      });
      return (response.table_data || []).map((x) => ({
        ...x,
        DateHour: `${x.date}-${x.hour}`,
      }));
    } else {
      const response = await authFetch<DataRecord[]>(`${PATH}/api/locs/data/${locId}`);
      return response
        .map((x) => ({ ...x, DateHour: `${x.date}-${x.hour}` }))
        .sort((a, b) => b.date.localeCompare(a.date) || a.hour - b.hour);
    }
  },

  addData: (locId: number, body: Record<string, unknown>): Promise<unknown> =>
    authFetch(`${PATH}/api/locs/data/${locId}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  editData: (pk: number, body: Record<string, unknown>): Promise<unknown> =>
    authFetch(`${PATH}/api/locs/single-data/${pk}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  deleteData: (pk: number): Promise<unknown> =>
    authFetch(`${PATH}/api/locs/single-data/${pk}/`, { method: "DELETE" }),

  getForecastData: (loc: string): Promise<{
    response: string;
    data?: string;
    data_wide?: string;
    monthly_data?: string;
    three_months_loadable?: string;
  }> =>
    authFetch(`${PATH}/bq/locs/forecast-data/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loc),
    }),

  getV3ForecastData: (loc: string): Promise<{
    response: string;
    data?: V3TableRecord[];
    data_wide?: V3TableRecord[];
  }> =>
    authFetch(`${PATH}/bq/v3/tuhup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loc),
    }),

  loginUser: async (body: { username: string; password: string }) => {
    const resp = await fetch(`${PATH}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.status !== 200) throw resp;
    return resp.json();
  },

  refreshToken: async (refreshToken: string) => {
    const resp = await fetch(`${PATH}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (resp.status !== 200) throw resp;
    return resp.json();
  },

  changePassword: (body: Record<string, string>): Promise<unknown> =>
    authFetch(`${PATH}/api/change-password/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};

export { titleToSlug };
