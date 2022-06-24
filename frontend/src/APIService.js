export default class APIService {

  static GetLocations(token) {
    return fetch("http://localhost:8000/api/locs/", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
      },
    })
      .then((resp) => resp.json());
  }

  static AddLocation(body, token) {
    return fetch("http://127.0.0.1:8000/api/locs/add-location/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static GetData(locId, token) {
    return fetch(`http://127.0.0.1:8000/api/locs/data/${locId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
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
    return fetch(`http://127.0.0.1:8000/api/locs/data/${locId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static EditData(pk, body, token) {
    return fetch(`http://127.0.0.1:8000/api/locs/single-data/${pk}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static DeleteData(pk, token) {
    return fetch(`http://127.0.0.1:8000/api/locs/single-data/${pk}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
      },
    })
  }

  static getForecastData(body, token) {
    return fetch("http://127.0.0.1:8000/bq/locs/forecast-data/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
        // "Authorization": "Token a5a6d1e4d36c9742497e347e58755a5883d7843f",
        // "Authorization": "Token e97756b569afa2bc841fcc5d98df11c63ac53b56"
      },
      body: JSON.stringify(body),
    }).then((response) => response.json());
  }

  static registerUser(body) {
    return fetch("http://127.0.0.1:8000/api/users/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (response.status !== 201) {
          throw response;
        }
        return response.json();
      })
  }

  static loginUser(body) {
    return fetch("http://127.0.0.1:8000/api/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        console.log(response)
        if (response.status !== 200) {
          throw response;
        }
        return response.json();
      })
  }
}
