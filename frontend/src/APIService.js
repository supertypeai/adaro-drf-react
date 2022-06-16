export default class APIService {
  static GetLocations() {
    return fetch("http://localhost:8000/api/locs/", {
      method: "GET",
      headers: {
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
      },
    })
      .then((resp) => resp.json());
  }

  static AddLocation(body) {
    return fetch("http://127.0.0.1:8000/api/locs/add-location/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f"
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static GetData(locId) {
    return fetch(`http://127.0.0.1:8000/api/locs/data/${locId}`, {
      method: "GET",
      headers: {
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
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

  static AddData(locId, body) {
    return fetch(`http://127.0.0.1:8000/api/locs/data/${locId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static EditData(pk, body) {
    return fetch(`http://127.0.0.1:8000/api/locs/single-data/${pk}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static DeleteData(pk) {
    return fetch(`http://127.0.0.1:8000/api/locs/single-data/${pk}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
      },
    })
  }

  static getForecastData(body) {
    return fetch("http://127.0.0.1:8000/api/locs/forecast-data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }
}
