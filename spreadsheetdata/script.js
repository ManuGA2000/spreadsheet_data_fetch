const apiKey = "AIzaSyAZT40X15t3r-pviyc017YMPaSE7CfHxaI";
const sheetId = "1HpAh72yaUodCIUyRgkbW47Rrr_gRfxETVc00LLrOApc";
const weatherApiKey = "eaf2e165d05bb27d14be627793ae5317";

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    if (username === "zone" && password === "123") {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('vehicle-container').style.display = 'flex';
        document.querySelector('.results-section').style.display = 'block'; // Show Vehicle Analysis Section

        // Automatically fetch data every 10 seconds after login
        setInterval(() => {
            fetchAndUpdateData();
        }, 10000);

        // Initial fetch
        fetchAndUpdateData();
    } else {
        errorMessage.textContent = 'Invalid username or password';
    }
}

function fetchGoogleSheetData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.values) throw new Error("No data found in spreadsheet");
            const rows = data.values.slice(1); // Exclude header
            const latestRow = rows[rows.length - 1]; // Get the last row
            return {
                Name: latestRow[0],
                time: latestRow[1],
                temp: latestRow[6],
                co2: latestRow[5],
                h2o: latestRow[3] /10,
                no2: latestRow[2],
                turbidity: latestRow[4] *10, // Fetching Turbidity
                   // Fetching pH
            };
        });
}

function fetchCurrentTemperature() {
    const city = "Bengaluru";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (!data.main || typeof data.main.temp === "undefined") {
                throw new Error("Temperature data not available");
            }
            return data.main.temp;
        });
}

function fetchAndUpdateData() {
    const errorMessage = document.getElementById('vehicle-error-message');
    errorMessage.textContent = "";

    fetchGoogleSheetData()
        .then(row => {
            fetchCurrentTemperature()
                .then(temp => {
                    displayVehicleData(row, temp);
                    displaySpreadsheetData(row, temp);
                    renderSeparateGraphs(row, temp);
                })
                // .catch(error => {
                //     errorMessage.textContent = 'error weather feathing data';
                // });
        })
        .catch(error => {
            errorMessage.textContent = 'Error fetching data. Please try again.';
        });
}

// Functions `displayVehicleData`, `displaySpreadsheetData`, `renderGraph`, and `renderSeparateGraphs` remain the same.
// These functions will dynamically update the content on the page based on the fetched data.


function displayVehicleData(row, currentTemp) {
    const currentTime = new Date().toLocaleTimeString(); // Get current system time

    document.getElementById('vehicle-data').innerHTML = `
       <div class="card temp">
            <img src="https://img.icons8.com/fluency/48/thermometer.png" alt="Temperature Icon">
            <h3>Temperature</h3>
            <p>Recorded: ${row.temp} °C</p>
            <p>Current: ${currentTemp} °C</p>
        </div>
        <div class="card time">
            <img src="https://img.icons8.com/fluency/48/clock.png" alt="Time Icon">
            <h3>Time</h3>
            <p>${currentTime}</p>
        </div>
        <div class="card co2">
            <img src="https://img.icons8.com/?size=100&id=HlPQGB87sVT3&format=png&color=000000" alt="CO2 Icon">
            <h3>CO2</h3>
            <p>${row.co2}</p>
        </div>
        <div class="card h2o">
            <img src="https://img.icons8.com/fluency/48/water.png" alt="H2O Icon">
            <h3>CO</h3>
            <p>${row.h2o}</p>
        </div>
        <div class="card no2">
            <img src="https://cdn3.iconfinder.com/data/icons/pollution-indigo-vol-2/256/nitrogen_dioxide_no2-512.png" alt="NO2 Icon">
            <h3>NO2</h3>
            <p>${row.no2}</p>
        </div>
        <div class="card turbidity">
            <img src="https://img.icons8.com/fluency/48/cloud.png" alt="Turbidity Icon">
            <h3>HYDRO CARBON</h3>
            <p>${row.turbidity}</p>
        </div>
       
    `;
}



function displaySpreadsheetData(row, currentTemp) {
    const currentTime = new Date().toLocaleTimeString(); // Get current system time

    const tableBody = document.getElementById('vehicle-table-body');
    tableBody.innerHTML = `
        <tr>
            <td>Temperatures (Recorded)</td>
            <td>${row.temp} °C</td>
        </tr>
        <tr>
            <td>Temperature (Current)</td>
            <td>${currentTemp} °C</td>
        </tr>
        <tr>
            <td>Time</td>
            <td>${currentTime}</td>
        </tr>
        <tr>
            <td>CO2</td>
            <td>${row.co2}</td>
        </tr>
        <tr>
            <td>CO</td>
            <td>${row.h2o}</td>
        </tr>
        <tr>
            <td>NO2</td>
            <td>${row.no2}</td>
        </tr>
        <tr>
            <td>HYDRO CARBON</td>
            <td>${row.turbidity}</td>
        </tr>
        
    `;
    document.getElementById('vehicle-table').style.display = 'block';

    // Call to render graph
    renderGraph(row, currentTemp);
}

function renderGraph(row, temp) {
    const graphContainer = document.getElementById("graph-container");
    const ctx = document.getElementById("vehicleChart").getContext("2d");

    // Make the graph container visible
    graphContainer.style.display = "block";

    // Destroy any existing chart to avoid overlap
    if (window.vehicleChartInstance) {
        window.vehicleChartInstance.destroy();
    }

    // Update labels and data to include Turbidity and pH
    const labels = [
        "Temperature (Recorded)",
        "Temperature (Current)",
        "CO2",
        "CO",
        "NO2",
        "Hydro Carbons",
       
    ];
    const data = [
        parseFloat(row.temp),
        temp,
        parseFloat(row.co2),
        parseFloat(row.h2o),
        parseFloat(row.no2),
        parseFloat(row.turbidity),
        parseFloat(row.ph)
    ];

    console.log("Chart Labels:", labels);
    console.log("Chart Data:", data);

    // Create the new chart
    window.vehicleChartInstance = new Chart(ctx, {
        type: "line", // Line graph
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Environmental Parameters",
                    data: data,
                    borderColor: "rgba(75, 192, 192, 1)", // Line color
                    backgroundColor: "rgba(75, 192, 192, 0.2)", // Area fill under the line
                    pointBackgroundColor: "rgba(255, 99, 132, 1)", // Points on the line
                    pointBorderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 2, // Thickness of the line
                    pointRadius: 5, // Size of data points
                    tension: 0.4 // Smooth curve
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Parameters",
                        color: "#333",
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: "rgba(200, 200, 200, 0.2)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Values",
                        color: "#333",
                        font: {
                            size: 14
                        }
                    },
                    grid: {
                        color: "rgba(200, 200, 200, 0.2)"
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#333",
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
    console.log("New chart rendered successfully.");
}




function renderSeparateGraphs(row,currentTemp) {
    // Ensure the container is visible
    document.getElementById("separate-graphs-container").style.display = "grid";

   // Temperature Graph (Updated to show both Recorded and Current Temperature with fine-grained details)
  // Temperature Graph (Enhanced)
const tempCtx = document.getElementById("tempGraph").getContext("2d");
new Chart(tempCtx, {
    type: "line",
    data: {
        labels: ["Recorded Temperature", "Current Temperature"],
        datasets: [
            {
                label: "Recorded Temperature (°C)",
                data: [parseFloat(row.temp)], // Recorded Temperature
                borderColor: "rgba(255, 99, 132, 1)", // Bright red
                pointBackgroundColor: "rgba(255, 99, 132, 1)",
                pointBorderColor: "rgba(255, 99, 132, 1)",
                backgroundColor: "rgba(255, 99, 132, 0.2)", // Light fill
                borderWidth: 3,
                pointRadius: 6,
                tension: 0.4,
            },
            {
                label: "Current Temperature (°C)",
                data: [parseFloat(currentTemp)], // Current Temperature
                borderColor: "rgba(54, 162, 235, 1)", // Bright blue
                pointBackgroundColor: "rgba(54, 162, 235, 1)",
                pointBorderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.2)", // Light fill
                borderWidth: 3,
                pointRadius: 6,
                tension: 0.4,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: "top",
                labels: {
                    color: "#000",
                    font: { size: 14, weight: "bold" },
                },
            },
            tooltip: {
                callbacks: {
                    label: (context) =>
                        `${context.dataset.label}: ${context.raw.toFixed(2)} °C`,
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Temperature Type",
                    color: "#333",
                    font: { size: 14 },
                },
                grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: "Temperature (°C)",
                    color: "#333",
                    font: { size: 14 },
                },
                ticks: {
                    stepSize: 0.5,
                    callback: (value) => `${value.toFixed(1)} °C`,
                },
                grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
        },
    },
});

// CO2 Graph (Enhanced)
const co2Ctx = document.getElementById("co2Graph").getContext("2d");
new Chart(co2Ctx, {
    type: "line",
    data: {
        labels: ["Data Point 1", "Data Point 2", "Data Point 3"],
        datasets: [
            {
                label: "CO2 (ppm)",
                data: [
                    parseFloat(row.co2),
                    parseFloat(row.co2) + 10,
                    parseFloat(row.co2) - 5,
                ],
                borderColor: "rgba(54, 162, 235, 1)",
                backgroundColor: "rgba(54, 162, 235, 0.1)",
                borderWidth: 3,
                pointRadius: 4,
                tension: 0.4,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "#000",
                    font: { size: 14, weight: "bold" },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Data Points",
                    color: "#333",
                    font: { size: 14 },
                },
                grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "CO2 (ppm)",
                    color: "#333",
                    font: { size: 14 },
                },
                grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
        },
    },
});

// H2O Graph (Enhanced)
const h2oCtx = document.getElementById("h2oGraph").getContext("2d");
new Chart(h2oCtx, {
    type: "line",
    data: {
        labels: ["Data Point 1", "Data Point 2", "Data Point 3"],
        datasets: [
            {
                label: "CO",
                data: [
                    parseFloat(row.h2o),
                    parseFloat(row.h2o) + 5,
                    parseFloat(row.h2o) - 3,
                ],
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.1)",
                borderWidth: 3,
                pointRadius: 4,
                tension: 0.4,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "#000",
                    font: { size: 14, weight: "bold" },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Data Points",
                    color: "#333",
                    font: { size: 14 },
                },
                grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "CO",
                    color: "#333",
                    font: { size: 14 },
                },
                grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
        },
    },
});

// NO2 Graph (Enhanced Pie Chart)
const no2Ctx = document.getElementById("no2Graph").getContext("2d");
new Chart(no2Ctx, {
    type: "pie",
    data: {
        labels: ["NO2 Level"],
        datasets: [
            {
                label: "NO2 (ppm)",
                data: [parseFloat(row.no2)],
                backgroundColor: ["rgba(255, 205, 86, 0.8)"],
                borderColor: ["rgba(255, 205, 86, 1)"],
                borderWidth: 2,
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: "#000",
                    font: { size: 14, weight: "bold" },
                },
            },
        },
    },
});

// Turbidity Graph
const turbidityCtx = document.getElementById("turbidityGraph").getContext("2d");
new Chart(turbidityCtx, {
    type: "line",
    data: {
        labels: ["HYDRO CARBON"],
        datasets: [
            {
                label: "Hydro Carbon ",
                data: [parseFloat(row.turbidity)],
                borderColor: "rgba(255, 159, 64, 1)",
                backgroundColor: "rgba(255, 159, 64, 0.2)",
                borderWidth: 3,
                pointRadius: 5,
                tension: 0.4,
            },
        ],
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: "Data Points" } },
            y: { title: { display: true, text: "hydro carbon" }, beginAtZero: true },
        },
    },
});


}


function analyzeVehicle() {
    const vehicleDetails = document.getElementById("vehicle-details").value;
    const fuelType = document.getElementById("fuel-type").value;
    const resultsTableBody = document.getElementById("results-table-body");

    if (!vehicleDetails) {
        alert("Please enter vehicle details.");
        return;
    }

    // Clear previous results
    resultsTableBody.innerHTML = "";

    fetchGoogleSheetData()
        .then((row) => {
            // Define recorded ranges for petrol and diesel
            const ranges = {
                petrol: {
                    temp: "20-60 °C",
                    co2: "300-600 ppm",
                    h2o: "0-100 mg/m³",
                    turbidity: "0-20 NTU",
                },
                diesel: {
                    temp: "20-80 °C",
                    co2: "400-800 ppm",
                    h2o: "0-150 mg/m³",
                    turbidity: "0-30 NTU",
                    no2: "0-50 ppm",
                },
            };

            // Default names for the parameters
            const parameterNames = {
                temp: "Temperature",
                co2: "CO2",
                h2o: "CO",
                turbidity: "HYDRO CARBON",
                no2: "NO2",
            };

            const parameters = fuelType === "diesel" ? ranges.diesel : ranges.petrol;

            // Generate table rows dynamically for the selected fuel type
            Object.keys(parameters).forEach((param) => {
                const recordedRange = parameters[param];
                const currentValue = row[param];
                const rowElement = document.createElement("tr");

                // Highlight row based on range match
                const isMatch = checkValueInRange(currentValue, recordedRange);
                rowElement.className = isMatch ? "row-green" : "row-red";

                // Add table cells
                rowElement.innerHTML = `
                    <td>${vehicleDetails} (${fuelType.toUpperCase()})</td>
                    <td>${parameterNames[param] || capitalizeFirstLetter(param)}</td>
                    <td>${recordedRange}</td>
                    <td>${currentValue}</td>
                `;

                resultsTableBody.appendChild(rowElement);
            });

            // Display the results table
            document.getElementById("results-table").style.display = "block";
        })
        .catch((error) => {
            console.error("Error fetching data:", error);
            alert("Failed to fetch data. Please try again later.");
        });
}

// Utility functions
function checkValueInRange(value, range) {
    const [min, max] = range.replace(/[^\d.-]+/g, "").split("-").map(Number);
    return value >= min && value <= max;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
