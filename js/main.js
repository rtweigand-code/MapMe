require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic"
], function(esriConfig, Map, MapView, Locate, Search, FeatureLayer, GraphicsLayer, Graphic) {

  // API key for the ArcGIS basemap and search tools
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // AGOL feature layer used as the app's backend
  const reportsUrl = "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/MapMe_Issue_Reports/FeatureServer/0";

  let selectedPoint = null;
  let objectIdField = "OBJECTID";
  let currentStatusFilter = "all";

  const categoryLabels = {
    abandoned_property: "Abandoned Property",
    environmental_concerns: "Environmental Concerns",
    general_service_request: "General Service Request",
    graffiti_and_vandalism: "Graffiti and Vandalism",
    parks_and_public_spaces: "Parks and Public Spaces",
    roadway_maintenance: "Roadway Maintenance",
    sidewalk_and_bikeway_maintenance: "Sidewalk and Bikeway Maintenance",
    snow_and_ice_management: "Snow and Ice Management",
    traffic_signals_and_lighting: "Traffic Signals and Lighting",
    trees_and_vegetation: "Trees and Vegetation",
    waste_and_illegal_dumping: "Waste and Illegal Dumping",
    water_and_sewer_infrastructure: "Water and Sewer Infrastructure"
  };

  const statusLabels = {
    open: "Open",
    under_review: "Under Review",
    scheduled: "Scheduled",
    resolved: "Resolved"
  };

  const priorityLabels = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent"
  };

  const departmentLabels = {
    building_inspection: "Building Inspection",
    engineering: "Engineering",
    metro_transit: "Metro Transit",
    parks: "Parks",
    parking: "Parking",
    planning: "Planning",
    public_health: "Public Health",
    public_works: "Public Works",
    streets_and_urban_forestry: "Streets and Urban Forestry",
    traffic_engineering: "Traffic Engineering",
    transportation: "Transportation",
    water_utility: "Water Utility",
    review_required: "Review Required"
  };

  // basic map setup
  const map = new Map({
    basemap: "streets-vector"
  });

  // layer for the temporary selected report pin
  const pinLayer = new GraphicsLayer();

  // real report layer from ArcGIS Online
  const reportsLayer = new FeatureLayer({
    url: reportsUrl,
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

    renderer: {
      type: "unique-value",
      field: "status",

      uniqueValueInfos: [
        {
          value: "open",
          label: "Open",
          symbol: {
            type: "simple-marker",
            color: "#f97316",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          }
        },
        {
          value: "under_review",
          label: "Under Review",
          symbol: {
            type: "simple-marker",
            color: "#facc15",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          }
        },
        {
          value: "scheduled",
          label: "Scheduled",
          symbol: {
            type: "simple-marker",
            color: "#2563eb",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          }
        },
        {
          value: "resolved",
          label: "Resolved",
          symbol: {
            type: "simple-marker",
            color: "#22c55e",
            size: 10,
            outline: {
              color: "white",
              width: 1
            }
          }
        }
      ]
    }
  });

  map.add(reportsLayer);
  map.add(pinLayer);

  // starts the map over downtown Madison
  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4012, 43.0731],
    zoom: 13
  });

  // locate button for mobile use
  const locate = new Locate({
    view: view
  });

  view.ui.add(locate, "top-left");

  // search widget placed in the custom search area
  const search = new Search({
    view: view,
    container: "searchContainer"
  });

  // stores a point when the user clicks the map
  view.on("click", function(event) {
    selectedPoint = event.mapPoint;
    drawSelectedPin(selectedPoint);
    updateSelectedLocationText(selectedPoint);
  });

  reportsLayer.load().then(function() {
    objectIdField = reportsLayer.objectIdField;
    loadDashboardReports();
  });

  // draws the temporary pin before the report is actually submitted
  function drawSelectedPin(point) {
    pinLayer.removeAll();

    const pin = new Graphic({
      geometry: point,
      symbol: {
        type: "simple-marker",
        color: "#003b64",
        size: 14,
        outline: {
          color: "white",
          width: 2
        }
      }
    });

    pinLayer.add(pin);
  }

  function updateSelectedLocationText(point) {
    const x = point.longitude.toFixed(5);
    const y = point.latitude.toFixed(5);

    document.getElementById("selectedLocationText").textContent = `Selected location: ${y}, ${x}`;
  }

  function clearSelectedPin() {
    selectedPoint = null;
    pinLayer.removeAll();
    document.getElementById("selectedLocationText").textContent = "Click the map to place a report pin";
  }

  // sends the submitted report to AGOL
  function submitReport() {
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const address = document.getElementById("address").value.trim();
    const photoFile = document.getElementById("photoInput").files[0];

    if (!category || !description || !selectedPoint) {
      alert("Please choose a category, add a description, and click the map to place the report.");
      return;
    }

    const newReport = new Graphic({
      geometry: selectedPoint,

      attributes: {
        category: category,
        description: description,
        address: address,
        status: "open",
        priority: "medium",
        department: "review_required"
      }
    });

    reportsLayer.applyEdits({
      addFeatures: [newReport]
    }).then(function(result) {
      const addResult = result.addFeatureResults[0];

      if (!addResult || addResult.error) {
        alert("The report could not be submitted.");
        console.log(addResult.error);
        return;
      }

      const objectId = addResult.objectId;

      if (photoFile) {
        addPhotoAttachment(objectId, photoFile);
      }

      clearForm();
      clearSelectedPin();
      reportsLayer.refresh();
      loadDashboardReports();

      alert("Report submitted successfully.");
    }).catch(function(error) {
      console.log(error);
      alert("Something went wrong while submitting the report.");
    });
  }

  // adds a photo attachment after the feature is created
  function addPhotoAttachment(objectId, file) {
    const formData = new FormData();

    formData.append("f", "json");
    formData.append("attachment", file);

    fetch(`${reportsUrl}/${objectId}/addAttachment`, {
      method: "POST",
      body: formData
    }).then(function(response) {
      return response.json();
    }).then(function(result) {
      if (!result.addAttachmentResult || !result.addAttachmentResult.success) {
        console.log("Photo upload did not complete.", result);
      }
    }).catch(function(error) {
      console.log("Photo upload failed.", error);
    });
  }

  // loads real reports from AGOL for the dashboard
  function loadDashboardReports() {
    let whereClause = "1=1";

    if (currentStatusFilter !== "all") {
      whereClause = `status = '${currentStatusFilter}'`;
    }

    reportsLayer.queryFeatures({
      where: whereClause,
      outFields: ["*"],
      returnGeometry: false,
      orderByFields: ["CreationDate DESC"],
      num: 25
    }).then(function(results) {
      renderDashboardReports(results.features);
    }).catch(function(error) {
      console.log(error);
    });
  }

  // builds the dispatcher cards from real AGOL features
  function renderDashboardReports(features) {
    const reportList = document.getElementById("reportList");

    reportList.innerHTML = "";

    if (features.length === 0) {
      reportList.innerHTML = `<p class="empty-message">No reports found.</p>`;
      return;
    }

    features.forEach(function(feature) {
      const attrs = feature.attributes;
      const objectId = attrs[objectIdField];

      const card = document.createElement("div");
      card.className = "report-card";

      card.innerHTML = `
        <h3>${categoryLabels[attrs.category] || attrs.category || "Report"}</h3>
        <p><strong>Address:</strong> ${attrs.address || "No address provided"}</p>
        <p>${attrs.description || ""}</p>

        <label>Status</label>
        <select class="dashboard-status" data-object-id="${objectId}">
          ${buildOptions(statusLabels, attrs.status)}
        </select>

        <label>Priority</label>
        <select class="dashboard-priority" data-object-id="${objectId}">
          ${buildOptions(priorityLabels, attrs.priority)}
        </select>

        <label>Department</label>
        <select class="dashboard-department" data-object-id="${objectId}">
          ${buildOptions(departmentLabels, attrs.department)}
        </select>

        <button class="save-report" data-object-id="${objectId}">Save Updates</button>
      `;

      reportList.appendChild(card);
    });
  }

  function buildOptions(labelObject, selectedValue) {
    let options = "";

    for (const code in labelObject) {
      const selected = code === selectedValue ? "selected" : "";
      options += `<option value="${code}" ${selected}>${labelObject[code]}</option>`;
    }

    return options;
  }

  // lets the dispatcher update status, priority, and department
  function updateDashboardReport(objectId) {
    const status = document.querySelector(`.dashboard-status[data-object-id="${objectId}"]`).value;
    const priority = document.querySelector(`.dashboard-priority[data-object-id="${objectId}"]`).value;
    const department = document.querySelector(`.dashboard-department[data-object-id="${objectId}"]`).value;

    const updatedReport = new Graphic({
      attributes: {
        [objectIdField]: Number(objectId),
        status: status,
        priority: priority,
        department: department
      }
    });

    reportsLayer.applyEdits({
      updateFeatures: [updatedReport]
    }).then(function() {
      reportsLayer.refresh();
      loadDashboardReports();
      alert("Report updated.");
    }).catch(function(error) {
      console.log(error);
      alert("The report could not be updated.");
    });
  }

  function clearForm() {
    document.getElementById("category").value = "";
    document.getElementById("description").value = "";
    document.getElementById("address").value = "";
    document.getElementById("photoInput").value = "";
  }

  // dashboard open and close controls
  document.getElementById("dashboardBtn").onclick = function() {
    document.getElementById("dashboardPanel").classList.remove("hidden");
    loadDashboardReports();
  };

  document.getElementById("closeDashboard").onclick = function() {
    document.getElementById("dashboardPanel").classList.add("hidden");
  };

  document.getElementById("submitBtn").onclick = submitReport;

  document.getElementById("clearLocationBtn").onclick = clearSelectedPin;

  document.getElementById("clearFormBtn").onclick = function(event) {
    event.preventDefault();
    clearForm();
    clearSelectedPin();
  };

  document.getElementById("mobileReportBtn").onclick = function() {
    document.getElementById("reportPanel").scrollIntoView({
      behavior: "smooth"
    });
  };

  // handles dashboard filter buttons
  document.querySelectorAll(".filter-tab").forEach(function(button) {
    button.onclick = function() {
      document.querySelectorAll(".filter-tab").forEach(function(tab) {
        tab.classList.remove("active");
      });

      button.classList.add("active");
      currentStatusFilter = button.dataset.status;
      loadDashboardReports();
    };
  });

  // handles dispatcher save buttons
  document.getElementById("reportList").onclick = function(event) {
    if (event.target.classList.contains("save-report")) {
      updateDashboardReport(event.target.dataset.objectId);
    }
  };

});