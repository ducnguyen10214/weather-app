import * as d3 from "https://cdn.skypack.dev/d3@7";

const key = "ec639ca44b959f2f626d921c2a33a9ac";

const city = document.querySelector("#city");
const cityError = document.querySelector(".cityError");
const countryCode = document.querySelector("#country-code");
const countryError = document.querySelector(".countryError");
const submitButton = document.querySelector("#submit");

const destination = document.querySelector("#destination");
const temperature = document.querySelector("#temperature");
const weatherIcon = document.querySelector("#weather-icon");
const weatherCondition = document.querySelector("#weather-condition");

const humidity = document.querySelector("#humidity");
const windSpeed = document.querySelector("#wind-speed");
const pressure = document.querySelector("#pressure");
const dewPoint = document.querySelector("#dew-point");
const visibility = document.querySelector("#visibility");
const uv = document.querySelector("#uv");

const dailyForecast = document.querySelector(".day-forecast");
const hourForecast = document.querySelector(".hour-forecast");

const mapApp = L.map("map");

city.addEventListener("input", function (e) {
  if (city.value == "") {
    cityError.textContent = "Please fill in a valid city";
  } else {
    cityError.textContent = "";
  }
});

countryCode.addEventListener("input", function (e) {
  console.log();
  if (countryCode.value == "") {
    countryError.textContent = "Please fill in a valid country code";
  } else {
    countryError.textContent = "";
  }
});

submitButton.addEventListener("click", function (e) {
  e.preventDefault();
  if (city.value !== "" && countryCode.value !== "") {
    process(city.value, countryCode.value);
  } else {
    process("San Jose", "US");
  }
});

async function getLatLon(city, code) {
  const response = await fetch(
    `http://api.openweathermap.org/geo/1.0/direct?q=${city},,${code}&limit=1&appid=${key}`
  );
  const data = await response.json();
  if (data.length == 0) {
    return {};
  } else {
    const lat = data[0]["lat"];
    const lon = data[0]["lon"];
    return { lat, lon };
  }
}

async function getData(lat, lon) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`
  );
  const data = await response.json();
  return data;
}

function convertTimestampToDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const dt = date.getDate();
  const hours = date.getHours();
  return { month, dt, hours };
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/line-chart
function LineChart(
  data,
  {
    x = ([x]) => x, // given d in data, returns the (temporal) x-value
    y = ([, y]) => y, // given d in data, returns the (quantitative) y-value
    defined, // for gaps in data
    curve = d3.curveLinear, // method of interpolation between points
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 1100, // outer width, in pixels
    height = 500, // outer height, in pixels
    xType = d3.scalePoint,
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // the y-scale type
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    yFormat, // a format specifier string for the y-axis
    yLabel, // a label for the y-axis
    color = "currentColor", // stroke color of line
    strokeLinecap = "round", // stroke line cap of the line
    strokeLinejoin = "round", // stroke line join of the line
    strokeWidth = 2, // stroke width of line, in pixels
    strokeOpacity = 1, // stroke opacity of line
  } = {}
) {
  // Compute values.
  const X = d3.map(data, x);
  const Y = d3.map(data, y);
  const I = d3.range(X.length);
  if (defined === undefined) defined = (d, i) => !isNaN(X[i]) && !isNaN(Y[i]);
  const D = d3.map(data, defined);

  // Compute default domains.
  if (xDomain === undefined) xDomain = d3.extent(X);
  if (yDomain === undefined) yDomain = [0, d3.max(Y)];

  // Construct scales and axes.
  const xScale = xType(xDomain, xRange);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(width / 80)
    .tickSizeOuter(0);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

  // Construct a line generator.
  const line = d3
    .line()
    .curve(curve)
    .x((i) => xScale(X[i]))
    .y((i) => yScale(Y[i]));

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .style("font-size", "0.8rem");

  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .style("font-size", "0.8rem")
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("x2", width - marginLeft - marginRight)
        .attr("stroke-opacity", 0.1)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(yLabel)
    );

  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", strokeWidth)
    .attr("stroke-linecap", strokeLinecap)
    .attr("stroke-linejoin", strokeLinejoin)
    .attr("stroke-opacity", strokeOpacity)
    .attr("d", line(I));

  return svg.node();
}

async function process(cityInput, codeInput) {
  cityInput = cityInput.trim();
  codeInput = codeInput.trim();

  const latLon = await getLatLon(cityInput, codeInput);
  if (Object.keys(latLon).length === 0) {
    alert("City Not Found");
    city.value = "";
    countryCode.value = "";
    city.focus();
  } else {
    const lat = latLon["lat"];
    const lon = latLon["lon"];
    const data = await getData(lat, lon);

    destination.textContent = cityInput + ", " + codeInput;

    // set up current stat
    const currentData = data["current"];
    const iconCode = currentData["weather"][0]["icon"];
    weatherIcon.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherCondition.textContent =
      currentData["weather"][0]["main"] +
      ". Feels like " +
      Math.round(currentData["feels_like"]) +
      "°F";
    humidity.textContent = "Humidity: " + currentData["humidity"] + "%";
    windSpeed.textContent = "Wind: " + currentData["wind_speed"] + "mph";
    temperature.textContent = Math.round(currentData["temp"]) + "°F";
    pressure.textContent = "Pressure: " + currentData["pressure"] + "hPa";
    dewPoint.textContent =
      "Dew point: " + Math.round(currentData["dew_point"]) + "°F";
    visibility.textContent = "Visibility: " + currentData["visibility"] + "m";
    uv.textContent = "UV index: " + currentData["uvi"];

    // set up daily forecast
    const daily = data["daily"];
    dailyForecast.textContent = "";
    const title = document.createElement("div");
    title.classList.add("day-forecast-title");
    title.textContent = "8-day forecast";
    dailyForecast.appendChild(title);
    for (let i = 0; i < daily.length; i += 1) {
      const day = document.createElement("div");
      day.classList.add("day-forecast-row");

      const date = document.createElement("div");
      const icon = document.createElement("img");
      icon.classList.add("day-forecast-icon");
      const tempRange = document.createElement("div");
      const description = document.createElement("div");

      const convertedTimestamp = convertTimestampToDate(daily[i]["dt"]);
      date.textContent =
        convertedTimestamp["month"] + " " + convertedTimestamp["dt"];
      const subIconCode = daily[i]["weather"][0]["icon"];
      icon.src = `http://openweathermap.org/img/wn/${subIconCode}@2x.png`;
      const tempMin = Math.round(daily[i]["temp"]["min"]);
      const tempMax = Math.round(daily[i]["temp"]["max"]);
      tempRange.textContent = tempMin + " / " + tempMax + "°F";
      description.textContent = daily[i]["weather"][0]["description"];

      day.append(date, icon, tempRange, description);
      dailyForecast.appendChild(day);
    }

    // set up hour forecast
    const hourly = data["hourly"];
    hourly.splice(24);
    let process = [],
      xDomain = [];
    for (let i = 0; i < hourly.length; i += 1) {
      let curr = hourly[i];
      let currHour = convertTimestampToDate(curr["dt"])["hours"];
      let key = "";
      if (currHour >= 12) {
        key = currHour - 12 + "pm";
      } else {
        key = currHour + "am";
      }
      let temp = curr["temp"];
      xDomain.push(key);
      process.push({ key, temp });
    }
    hourForecast.textContent = "";
    const hourTitle = document.createElement("div");
    hourTitle.classList.add("hour-forecast-title");
    hourTitle.textContent = "Hour forecast";
    hourForecast.appendChild(hourTitle);

    const chart = LineChart(process, {
      x: (d) => d.key,
      y: (d) => d.temp,
      xDomain: xDomain,
      yLabel: "Temperature",
      color: "blue",
    });
    chart.classList.add("chart");
    hourForecast.appendChild(chart);
    
    mapApp.textContent = "";
    
    let map = mapApp.setView([lat, lon], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.marker([lat, lon]).addTo(map)
    .bindPopup(cityInput + ", " + codeInput)
    .openPopup();

    city.value = "";
    countryCode.value = "";
    city.focus();
  }
}

process("San Jose", "US");