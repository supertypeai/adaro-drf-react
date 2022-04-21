export default class APIService {
  static GetLocations() {
    return fetch("http://localhost:8000/api/locs/").then((resp) => resp.json());
  }

  static AddLocation(body) {
    return fetch("http://127.0.0.1:8000/api/locs/add-location/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static GetData(locId) {
    return fetch(`http://127.0.0.1:8000/api/locs/data/${locId}`, {
      method: "GET",
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

  static AddData(body) {
    return fetch("http://127.0.0.1:8000/api/locs/add-data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }
}
