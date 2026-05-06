require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Locate",
  "esri/layers/FeatureLayer"
], function(esriConfig, Map, MapView, Locate, FeatureLayer) {

  // ArcGIS API key
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // main map setup
  const map = new Map({
    basemap: "streets-vector"
  });

  // hosted feature layer from AGOL
  const reportsLayer = new FeatureLayer({
    url: "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/MapMe_Issue_Reports/FeatureServer/0",

    outFields: ["*"],

    popupTemplate: {
      title: "{category}",
      content: `
        <b>Status:</b> {status}<br>
        <b>Priority:</b> {priority}<br>
        <b>Department:</b> {department}<br>
        <b>Address:</b> {address}<br><br>
        {description}
      `
    },

    // different colors based on report status
    renderer: {
      type: "unique-value",
      field: "status",

      uniqueValueInfos: [
        {
          value: "open",
          symbol: {
            type: "simple-marker",
            color: "#f97316",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          },
          label: "Open"
        },

        {
          value: "under_review",
          symbol: {
            type: "simple-marker",
            color: "#facc15",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          },
          label: "Under Review"
        },

        {
          value: "scheduled",
          symbol: {
            type: "simple-marker",
            color: "#2563eb",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          },
          label: "Scheduled"
        },

        {
          value: "resolved",
          symbol: {
            type: "simple-marker",
            color: "#22c55e",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          },
          label: "Resolved"
        }
      ]
    }
  });

  map.add(reportsLayer);

  // map view centered on Madison
  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4012, 43.0731],
    zoom: 13
  });

  // locate button
  const locate = new Locate({
    view: view
  });

  view.ui.add(locate, "top-left");

});


/* =========================
   dashboard controls
========================= */

const dashboardBtn = document.getElementById("dashboardBtn");
const dashboardPanel = document.getElementById("dashboardPanel");
const closeDashboard = document.getElementById("closeDashboard");

dashboardBtn.onclick = () => {
  dashboardPanel.classList.remove("hidden");
};

closeDashboard.onclick = () => {
  dashboardPanel.classList.add("hidden");
};


/* =========================
   temporary dashboard data
========================= */

const reports = [
  {
    title: "Traffic Signals and Lighting",
    desc: "Street light flickering near intersection.",
    status: "Open",
    location: "State St"
  },

  {
    title: "Roadway Maintenance",
    desc: "Large pothole forming near bike lane.",
    status: "Under Review",
    location: "University Ave"
  },

  {
    title: "Waste and Illegal Dumping",
    desc: "Overflowing trash bins near park entrance.",
    status: "Scheduled",
    location: "James Madison Park"
  }
];

const reportList = document.getElementById("reportList");

function renderReports() {

  reportList.innerHTML = "";

  reports.forEach(report => {

    const div = document.createElement("div");

    div.className = "report-card";

    div.innerHTML = `
      <h3>${report.title}</h3>
      <p><strong>Location:</strong> ${report.location}</p>
      <p>${report.desc}</p>
      <span class="badge">${report.status}</span>
    `;

    reportList.appendChild(div);

  });

}

renderReports();


/* =========================
   basic report form
========================= */

const submitBtn = document.getElementById("submitBtn");

submitBtn.onclick = () => {

  const category = document.getElementById("category").value;

  const description = document.getElementById("description").value;

  if (!category || !description) {

    alert("Please complete the report form.");

    return;
  }

  reports.unshift({
    title: category,
    desc: description,
    status: "Open",
    location: "User submitted"
  });

  renderReports();

  document.getElementById("category").value = "";

  document.getElementById("description").value = "";

  alert("Report submitted.");

};