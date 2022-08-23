const PATH = "https://adaro-data-warehouse.et.r.appspot.com";
// const PATH = "http://localhost:8000";

export default class APIService {
  static GetLocations(token) {
    return fetch(`${PATH}/api/locs/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((resp) => resp.json());
  }

  static AddLocation(body, token) {
    return fetch(`${PATH}/api/locs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static GetData(locId, token) {
    return fetch(`${PATH}/api/locs/data/${locId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((response) =>
        response.map((x) => {
          return {
            ...x,
            DateHour: `${x["date"]}-${x["hour"]}`,
          };
        })
      )
      .then((response) =>
        response.sort(function (a, b) {
          return (
            // Descending order of date
            b.date.localeCompare(a.date) || parseInt(a.hour) - parseInt(b.hour)
          );
        })
      );
  }

  static AddData(locId, body, token) {
    return fetch(`${PATH}/api/locs/data/${locId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static EditData(pk, body, token) {
    return fetch(`${PATH}/api/locs/single-data/${pk}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static DeleteData(pk, token) {
    return fetch(`${PATH}/api/locs/single-data/${pk}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  static getForecastData(body, token) {
    return fetch(`${PATH}/bq/locs/forecast-data/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static registerUser(body) {
    return fetch(`${PATH}/api/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => {
      if (response.status !== 201) {
        throw response;
      }
      return response.json();
    });
  }

  static loginUser(body) {
    return fetch(`${PATH}/api/token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => {
      if (response.status !== 200) {
        throw response;
      }
      return response.json();
    });
  }

  static RequestPasswordEmail(body) {
    return fetch(`${PATH}/api/request-reset-email/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => {
      if (response.status !== 200) {
        throw response;
      }
      return response.json();
    });
  }

  static ResetPassword(body) {
    return fetch(`${PATH}/api/password-reset-complete/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => {
      if (response.status !== 200) {
        throw response;
      }
      return response.json();
    });
  }

  static ChangePassword(body, token) {
    return fetch(`${PATH}/api/change-password/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }).then((response) => {
      if (response.status !== 200) {
        throw response;
      }
      return response.json();
    });
  }
}
