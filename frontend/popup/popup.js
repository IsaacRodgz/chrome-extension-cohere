// Function to execute when button is clicked
function report_db() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        let activeTab = tabs[0];
        console.log(activeTab.url)

        // Send info to backend API
        fetch('https://verifai-cohere.ue.r.appspot.com/report', {
            method: 'POST',
            body: JSON.stringify({
                site_name: activeTab.title,
                url: activeTab.url,
                document: activeTab.bodyHTML,
                label: 'reported',
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
        .then((response) => response.json())
        .then((json) => console.log(json));
    });

    // Show message to user in popup
    const confirmMessage = document.createElement("P");
    confirmMessage.innerText = "Thanks! We'll review the information sent";
    document.body.appendChild(confirmMessage);
}

function create_item(key, value) {
    let report_row = document.createElement("div")
    report_row.className = "report-item";
    // Add key
    let report_key = document.createElement("P");
    report_key.innerText = key;
    report_row.appendChild(report_key)
    // Add value
    if (value.length > 0) {
        let report_value = document.createElement("P");
        report_value.innerText = value;
        report_value.className = "item-value"
        report_row.appendChild(report_value)
    }
    return report_row
}

// Function to execute when button is clicked
function get_context() {
    chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
        const activeTab = tabs[0];
        console.log("Contextualize pressed")
        console.log(activeTab.url)

        //Show loading animation
        var loader = document.createElement("div");
        loader.className = "loader";
        loader.appendChild(document.createElement("div"));
        loader.appendChild(document.createElement("div"));
        loader.appendChild(document.createElement("div"));
        var container = document.querySelector(".extension-container");
        container.appendChild(loader);

        // Send info to backend API
        return await fetch('https://verifai-cohere.ue.r.appspot.com/verify', {
            method: 'POST',
            body: JSON.stringify({
                url: activeTab.url,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
        .then((response) => response.json())
        .then((data) => {

            // Disable button
            const button = document.getElementById('context-button');
            button.setAttribute('disabled', '');

            // Remove loader animation
            var container = document.querySelector(".extension-container");
            container.removeChild(container.lastChild);
            
            // Report container
            let report_title = document.createElement("h3");
            report_title.innerText = "What we found:";
            container.appendChild(report_title);

            // Report elements
            let report = document.createElement("div");
            report.className = "report-container";
            container.appendChild(report);

            // Authors
            if(data.authors !== null){
                report_row = create_item(`Authors:`, data.authors.join(', '))
            }
            else {
                report_row = create_item(`Authors:`, 'No authors found')
            }
            report.appendChild(report_row);

            // Publish date
            if(data.published_date !== null){
                report_row = create_item(`Article was published in:`, data.published_date)
            }
            else {
                report_row = create_item(`Article was published in:`, 'No date found')
            }
            report.appendChild(report_row);

            // Show Cohere result
            if(data.found_claims.length > 0){
                let report_title = document.createElement("h4");
                report_title.innerText = "Detected claims:";
                report.appendChild(report_title);

                data.found_claims.forEach(function (item, index) {
                    report_row = create_item(item.predicted_category, item.claim_text);
                    report.appendChild(report_row);
                });
            }
            else {
                let report_title = document.createElement("h4");
                report_title.innerText = "No claim detected in our database";
                report.appendChild(report_title);
            }

        })
        .catch((error) => console.log(`Oops! Error while making request: ${error.message}`));
    });
}

// Bind functions to buttons
document.addEventListener("DOMContentLoaded", function(){
    //document.getElementById("report").addEventListener("click", report_db);
    document.getElementById("context-button").addEventListener("click", get_context);
})