require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic"
], function(
  esriConfig,
  Map,
  MapView,
  Locate,
  Search,
  FeatureLayer,
  GraphicsLayer,
  Graphic
) {

  // ArcGIS API key
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // AGOL feature layer
  const reportsUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/MapMe_Issue_Reports/FeatureServer/0";

  let selectedPoint = null;

  let currentFilter = "all";

  let objectIdField = "OBJECTID";

  // map setup
  const map = new Map({
    basemap: "streets-vector"
  });

  // temp graphics layer for selected pin
  const pinLayer = new GraphicsLayer();

  // report layer
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

    // status colors
    renderer: {

      type: "unique-value",

      field: "status",

      uniqueValueInfos: [

        {
          value: "open",

          symbol: {
            type: "simple-marker",
            color: "#f97316",
            size: 11,

            outline: {
              color: "white",
              width: 1
            }
          }
        },

        {
          value: "under_review",

          symbol: {
            type: "simple-marker",
            color: "#facc15",
            size: 11,

            outline: {
              color: "white",
              width: 1
            }
          }
        },

        {
          value: "scheduled",

          symbol: {
            type: "simple-marker",
            color: "#2563eb",
            size: 11,

            outline: {
              color: "white",
              width: 1
            }
          }
        },

        {
          value: "resolved",

          symbol: {
            type: "simple-marker",
            color: "#22c55e",
            size: 11,

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

  // view
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

  // search widget
  const search = new Search({

    view: view,

    container: "searchContainer"

  });

  // store selected map point
  view.on("click", function(event) {

    selectedPoint = event.mapPoint;

    drawSelectedPoint();

  });

  // selected point symbol
  function drawSelectedPoint() {

    pinLayer.removeAll();

    const graphic = new Graphic({

      geometry: selectedPoint,

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

    pinLayer.add(graphic);

    // update location text
    document.getElementById("selectedLocationText").innerHTML =
      `
      Pin selected at:
      <br>
      ${selectedPoint.latitude.toFixed(5)},
      ${selectedPoint.longitude.toFixed(5)}
      `;

  }

  // submit report
  function submitReport() {

    const category =
      document.getElementById("category").value;

    const description =
      document.getElementById("description").value.trim();

    const address =
      document.getElementById("address").value.trim();

    const photoFile =
      document.getElementById("photoInput").files[0];

    // basic validation
    if (!category || !description || !selectedPoint) {

      alert(
        "Please complete the report form and place a pin on the map."
      );

      return;
    }

    // feature to add
    const newFeature = new Graphic({

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

    // add to AGOL
    reportsLayer.applyEdits({

      addFeatures: [newFeature]

    })

    .then(function(result) {

      const addResult =
        result.addFeatureResults[0];

      if (!addResult || addResult.error) {

        alert("Could not submit report.");

        console.log(addResult.error);

        return;
      }

      // photo attachment
      if (photoFile) {

        uploadAttachment(
          addResult.objectId,
          photoFile
        );

      }

      reportsLayer.refresh();

      loadReports();

      clearForm();

      alert("Report submitted.");

    })

    .catch(function(error) {

      console.log(error);

      alert("Something went wrong.");

    });

  }

  // upload photo
  function uploadAttachment(objectId, file) {

    const formData = new FormData();

    formData.append("attachment", file);

    formData.append("f", "json");

    fetch(
      `${reportsUrl}/${objectId}/addAttachment`,
      {
        method: "POST",
        body: formData
      }
    )

    .then(function(response) {

      return response.json();

    })

    .then(function(data) {

      console.log("Attachment uploaded");

    })

    .catch(function(error) {

      console.log(error);

    });

  }

  // load reports for dashboard
  function loadReports() {

    let whereClause = "1=1";

    if (currentFilter !== "all") {

      whereClause =
        `status='${currentFilter}'`;

    }

    reportsLayer.queryFeatures({

      where: whereClause,

      outFields: ["*"],

      returnGeometry: false,

      orderByFields: ["CreationDate DESC"],

      num: 25

    })

    .then(function(results) {

      renderDashboard(
        results.features
      );

    });

  }

  // dashboard cards
  function renderDashboard(features) {

    const reportList =
      document.getElementById("reportList");

    reportList.innerHTML = "";

    features.forEach(function(feature) {

      const attrs =
        feature.attributes;

      const card =
        document.createElement("div");

      card.className =
        "report-card";

      card.innerHTML = `

        <h3>${formatLabel(attrs.category)}</h3>

        <p>
          <strong>Status:</strong>
          ${formatLabel(attrs.status)}
        </p>

        <p>
          <strong>Address:</strong>
          ${attrs.address || "Not provided"}
        </p>

        <p>
          ${attrs.description || ""}
        </p>

        <label>Status</label>

        <select
          class="status-select"
          data-id="${attrs[objectIdField]}"
        >

          <option value="open">
            Open
          </option>

          <option value="under_review">
            Under Review
          </option>

          <option value="scheduled">
            Scheduled
          </option>

          <option value="resolved">
            Resolved
          </option>

        </select>

        <button
          class="save-report"
          data-id="${attrs[objectIdField]}"
        >
          Save Updates
        </button>

      `;

      reportList.appendChild(card);

      // set selected value
      const select =
        card.querySelector(".status-select");

      select.value =
        attrs.status;

    });

  }

  // update report status
  function updateReport(objectId, status) {

    const updateFeature =
      new Graphic({

        attributes: {

          [objectIdField]:
            Number(objectId),

          status: status

        }

      });

    reportsLayer.applyEdits({

      updateFeatures: [updateFeature]

    })

    .then(function() {

      reportsLayer.refresh();

      loadReports();

    });

  }

  // clean labels
  function formatLabel(value) {

    if (!value) return "";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, c => c.toUpperCase());

  }

  // clear form
  function clearForm() {

    document.getElementById("category").value = "";

    document.getElementById("description").value = "";

    document.getElementById("address").value = "";

    document.getElementById("photoInput").value = "";

    document.getElementById("selectedLocationText").innerHTML =
      "Click the map to place a report pin";

    pinLayer.removeAll();

    selectedPoint = null;

  }

  // report drawer
  const reportDrawer =
    document.getElementById("reportDrawer");

  document.getElementById("openReportBtn")
    .onclick = function() {

      reportDrawer.classList.add("open");

    };

  document.getElementById("closeDrawerBtn")
    .onclick = function() {

      reportDrawer.classList.remove("open");

    };

  // menu drawer
  const menuPanel =
    document.getElementById("menuPanel");

  document.getElementById("menuBtn")
    .onclick = function() {

      menuPanel.classList.remove("hidden");

    };

  document.getElementById("closeMenuBtn")
    .onclick = function() {

      menuPanel.classList.add("hidden");

    };

  // dashboard
  document.getElementById("dashboardBtn")
    .onclick = function() {

      document.getElementById("dashboardPanel")
        .classList.remove("hidden");

      loadReports();

    };

  document.getElementById("closeDashboard")
    .onclick = function() {

      document.getElementById("dashboardPanel")
        .classList.add("hidden");

    };

  // submit report
  document.getElementById("submitBtn")
    .onclick = submitReport;

  // clear form
  document.getElementById("clearFormBtn")
    .onclick = clearForm;

  // clear pin
  document.getElementById("clearLocationBtn")
    .onclick = function() {

      pinLayer.removeAll();

      selectedPoint = null;

      document.getElementById("selectedLocationText")
        .innerHTML =
        "Click the map to place a report pin";

    };

  // filters
  document.querySelectorAll(".filter-tab")
    .forEach(function(button) {

      button.onclick = function() {

        document.querySelectorAll(".filter-tab")
          .forEach(function(tab) {

            tab.classList.remove("active");

          });

        button.classList.add("active");

        currentFilter =
          button.dataset.status;

        loadReports();

      };

    });

  // save report buttons
  document.getElementById("reportList")
    .onclick = function(event) {

      if (
        event.target.classList.contains("save-report")
      ) {

        const objectId =
          event.target.dataset.id;

        const status =
          event.target.parentElement
            .querySelector(".status-select")
            .value;

        updateReport(
          objectId,
          status
        );

      }

    };

  // get object id field
  reportsLayer.load()
    .then(function() {

      objectIdField =
        reportsLayer.objectIdField;

    });

});