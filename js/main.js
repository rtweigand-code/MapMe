require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Locate"
], function(esriConfig, Map, MapView, Locate) {

  // 🔑 ADD YOUR API KEY HERE
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  const map = new Map({
    basemap: "streets-vector"
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4012, 43.0731], // Madison
    zoom: 13
  });

  // Locate button
  const locate = new Locate({
    view: view
  });

  view.ui.add(locate, "top-left");
});


/* =========================
   UI INTERACTIONS
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
   FAKE DATA (for now)
========================= */

const reports = [
  {
    title: "Damaged Street Sign",
    desc: "Sign bent and partially detached.",
    status: "Open",
    location: "N. Park St & Main St"
  },
  {
    title: "Pothole",
    desc: "Large pothole causing traffic issues.",
    status: "Under Review",
    location: "University Ave"
  },
  {
    title: "Overflowing Trash",
    desc: "Trash bin is completely full.",
    status: "Scheduled",
    location: "James Madison Park"
  }
];

const reportList = document.getElementById("reportList");

function renderReports() {
  reportList.innerHTML = "";

  reports.forEach(r => {
    const div = document.createElement("div");
    div.className = "report-card";

    div.innerHTML = `
      <h3>${r.title}</h3>
      <p><strong>Location:</strong> ${r.location}</p>
      <p>${r.desc}</p>
      <span class="badge">${r.status}</span>
    `;

    reportList.appendChild(div);
  });
}

renderReports();


/* =========================
   SUBMIT FORM (basic)
========================= */

const submitBtn = document.getElementById("submitBtn");

submitBtn.onclick = () => {
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;

  if (!category || !description) {
    alert("Please fill out category and description.");
    return;
  }

  reports.unshift({
    title: category,
    desc: description,
    status: "Open",
    location: "User submitted"
  });

  renderReports();

  document.getElementById("description").value = "";
  document.getElementById("category").value = "";

  alert("Report submitted (demo)");
};