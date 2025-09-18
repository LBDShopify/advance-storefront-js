async function fetchSizeChart() {
    if (currentPage !== "PRODUCT_PAGE") {
        return; // âŒ Not product page, do nothing
    }
    if (!token || token.trim() === "" || !productId) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/v1/sizechart/product/detail`, {
            method: "POST", // Use POST because there's a request body
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({productId}) // Include request body
        });
        if (response.ok) {
            const text = await response.text();
            const data = JSON.parse(text);
            updateOnUI(data);
        }
    } catch (error) {
        console.error("Error fetching size chart:", error.message);
    }
}

function updateOnUI(data) {
    if (!data || !data.sizeChartSetting || !data.sizeChart) {
        console.warn("No size chart data available.");
        return;
    }

    const {textDisplay, textDisplayColor, textDisplaySize, iconUrl, iconSize} = data.sizeChartSetting;
    if (!textDisplay && !iconUrl) {
        console.warn("Missing text display and icon URL in size chart settings.");
        return;
    }

    const targetSelectors = [
        ".product__description",
        ".product-description",
        ".product-details",
        ".product-single__description",

        ".product__title",
        ".product__title h1",
        ".product-single__title",

        /* Price & form areas */
        ".price__container",
        ".product-single__price",
        "#ProductPrice",

        ".product-form__buttons",
        ".main-product__form",
        ".product-single__form",
        ".add-to-cart",
        ".product-form__quantity",
        ".product__share",
    ];

    for (let selector of targetSelectors) {
        const targetElement = document.querySelector(selector);
        if (targetElement) {
            // Create a wrapper div for icon + text
            const wrapper = document.createElement("div");
            if (wrapper && wrapper.style) {
                wrapper.style.display = "inline-flex";
                wrapper.style.width = "fit-content";
                wrapper.style.alignItems = "center";
                wrapper.style.gap = "5px";
                wrapper.style.cursor = "pointer";
                wrapper.style.marginTop = "10px"; // Adds spacing between the target element and wrapper
            }

            // Create the icon element
            const icon = document.createElement("img");
            icon.src = iconUrl;
            if (icon && icon.style) {
                icon.style.width = `${iconSize}px`;
                icon.style.height = `${iconSize}px`;
                icon.style.border = "none";
                icon.style.outline = "none";
                icon.style.display = "block"; // Prevents inline spacing issues
                icon.style.cursor = "pointer";
            }

            // Create the text element
            const sizeChartText = document.createElement("span");
            sizeChartText.innerText = textDisplay;
            if (sizeChartText && sizeChartText.style) {
                sizeChartText.style.color = textDisplayColor;
                sizeChartText.style.fontSize = `${textDisplaySize}px`;
            }

            // Append icon and text to wrapper
            wrapper.appendChild(icon);
            wrapper.appendChild(sizeChartText);

            // Insert wrapper **after** the targetElement (instead of inside it)
            targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);

            // Add click event to open modal
            wrapper.addEventListener("click", () => showSizeChartModal(data.sizeChartSetting, data.sizeChart));
            break;
        }
    }
}

function showSizeChartModal(sizeChartSetting, sizeChart) {
    let overlay = document.getElementById("sizeChartOverlay");
    let modal = document.getElementById("sizeChartModal");
    document.body.style.overflow = "hidden"; // ðŸ”’ lock background scroll

    // Create overlay if not exists
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "sizeChartOverlay";
        if (overlay && overlay.style) {
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100vw";
            overlay.style.height = "100vh";
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
            overlay.style.zIndex = "999";
            overlay.style.display = "none";
        }
        document.body.appendChild(overlay);
    }

    // Create modal if not exists
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "sizeChartModal";
        if (modal && modal.style) {
            modal.style.position = "fixed";
            modal.style.padding = "0px";
            modal.style.zIndex = "1000";
            modal.style.overflow = "auto";
            modal.style.display = "flex";
            modal.style.alignItems = "center";
            modal.style.justifyContent = "center";
        }
        document.body.appendChild(modal);
    }

    // Create content box
    let contentBox = document.getElementById("sizeChartContentBox");
    if (!contentBox) {
        contentBox = document.createElement("div");
        contentBox.id = "sizeChartContentBox";
        if (contentBox && contentBox.style) {
            contentBox.style.padding = "20px";
            contentBox.style.borderRadius = "10px";
            contentBox.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            contentBox.style.backgroundColor = sizeChartSetting.modalBackgroundColor;
            contentBox.style.display = "flex";
            contentBox.style.flexDirection = "column";
            contentBox.style.alignItems = "center";
            contentBox.style.position = "relative";
            contentBox.style.maxHeight = "100vh"; // Allow scroll if content is too tall
            contentBox.style.overflowY = "auto";
        }
        modal.appendChild(contentBox);
    }

    // Clear previous content
    contentBox.innerHTML = `<div id="sizeChartHeader">${sizeChart.header}</div>`;
    applyQuillStyles(document.getElementById("sizeChartHeader"));

    // Create table
    const table = document.createElement("table");
    if (table && table.style) {
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.textAlign = "center";
        table.style.border = `1px solid ${sizeChartSetting.modalBorderColor}`;
        table.style.tableLayout = "fixed";
    }

    // Calculate modal width
    const columnCount = sizeChart.sizesData[0].length;
    const cellWidth = 120;

    const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) {
        contentBox.style.width = "100vw";
        contentBox.style.overflowX = "auto"; // allow scroll inside modal
    } else {
        const modalWidth = columnCount * cellWidth + 120;
        contentBox.style.width = `${modalWidth}px`;
    }

    const colorMouseEnter = "#3BB9FF"
    const colorEventRow = "#C9DFEC"
    const colorOddRow = "#ffffff"

    sizeChart.sizesData.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");
        tr.style.backgroundColor = rowIndex % 2 === 0 ? colorEventRow : colorOddRow;

        row.forEach((cellText) => {
            const cell = document.createElement("th");
            cell.innerText = cellText;
            if (cell && cell.style) {
                cell.style.border = `1px solid ${sizeChartSetting.modalBorderColor}`;
                cell.style.padding = "8px";
                cell.style.fontWeight = rowIndex === 0 ? "bold" : "normal";
                cell.style.width = "120px";
                cell.style.color = sizeChartSetting.modalTextColor;
                cell.style.textAlign = "center";
                cell.style.verticalAlign = "middle"; // optional, for vertical centering
            }

            tr.addEventListener("mouseenter", () => {
                tr.style.backgroundColor = colorMouseEnter;
            });
            tr.addEventListener("mouseleave", () => {
                tr.style.backgroundColor = rowIndex % 2 === 0 ? colorEventRow : colorOddRow;
            });

            tr.appendChild(cell);
        });

        table.appendChild(tr);
    });

    const scrollWrapper = document.createElement("div");
    Object.assign(scrollWrapper.style, {
        overflowX: "auto",
        maxWidth: "100%",
        WebkitOverflowScrolling: "touch",
    });

    table.style.minWidth = `${columnCount * cellWidth}px`; // force horizontal overflow if needed
    scrollWrapper.appendChild(table);
    contentBox.appendChild(scrollWrapper);

    const footerDiv = document.createElement("div");
    footerDiv.id = "sizeChartFooter";
    footerDiv.innerHTML = sizeChart.footer;
    contentBox.appendChild(footerDiv);
    applyQuillStyles(footerDiv);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.id = "closeSizeChartModal";
    closeButton.innerHTML = "&times;";
    Object.assign(closeButton.style, {
        position: "absolute",
        top: "10px",
        right: "10px",
        fontSize: "22px",
        fontWeight: "100",
        color: "black",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "5px",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease-in-out"
    });
    closeButton.onmouseover = function () {
        this.style.background = "rgba(0,0,0,0.1)";
        this.style.borderRadius = "4px";
    };
    closeButton.onmouseout = function () {
        this.style.background = "none";
        this.style.borderRadius = "0px";
    };
    contentBox.appendChild(closeButton);

    // Set modal position and style
    switch (sizeChartSetting.position) {
        case "TOP":
            if (modal && modal.style) {
                modal.style.top = "0";
                modal.style.left = "0";
                modal.style.right = "0";
                modal.style.transform = "none";
                modal.style.width = "100vw";
                modal.style.height = "auto";
                modal.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            }
            break;
        case "BOTTOM":
            if (modal && modal.style) {
                modal.style.bottom = "0";
                modal.style.left = "0";
                modal.style.right = "0";
                modal.style.transform = "none";
                modal.style.width = "100vw";
                modal.style.height = "auto";
                modal.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            }
            break;
        case "LEFT":
            if (modal && modal.style) {
                modal.style.top = "0";
                modal.style.left = "0";
                modal.style.bottom = "0";
                modal.style.transform = "none";
                modal.style.width = "auto";
                modal.style.height = "100vh";
                modal.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            }
            break;
        case "RIGHT":
            if (modal && modal.style) {
                modal.style.top = "0";
                modal.style.right = "0";
                modal.style.bottom = "0";
                modal.style.transform = "none";
                modal.style.width = "auto";
                modal.style.height = "100vh";
                modal.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            }
            break;
        case "CENTER":
        default:
            if (modal && modal.style) {
                modal.style.top = "50%";
                modal.style.left = "50%";
                modal.style.transform = "translate(-50%, -50%)";
                modal.style.backgroundColor = "transparent";
            }
            break;
    }

    // Show modal & overlay
    overlay.style.display = "block";
    modal.style.display = "flex";

    // Close modal when clicking overlay
    overlay.addEventListener("click", () => {
        overlay.style.display = "none";
        modal.style.display = "none";
        document.body.style.overflow = ""; // ðŸ”“ restore scroll
    });

    // Close modal from button
    closeButton.addEventListener("click", () => {
        overlay.style.display = "none";
        modal.style.display = "none";
        document.body.style.overflow = ""; // ðŸ”“ restore scroll
    });
}

/**
 * Manually applies missing styles for Quill-generated HTML.
 */
function applyQuillStyles(element) {
    // Ensure paragraphs have proper spacing and readability
    element.querySelectorAll("p").forEach(el => {
        el.style.marginBottom = "10px";
        el.style.lineHeight = "1.5";
    });

    // Style inline text elements
    element.querySelectorAll("strong").forEach(el => (el.style.fontWeight = "bold"));
    element.querySelectorAll("em").forEach(el => (el.style.fontStyle = "italic"));
    element.querySelectorAll("u").forEach(el => (el.style.textDecoration = "underline"));
    element.querySelectorAll("s").forEach(el => (el.style.textDecoration = "line-through"));

    // Ensure lists are properly formatted
    element.querySelectorAll("ul, ol").forEach(el => {
        el.style.marginBottom = "10px";
        el.style.paddingLeft = "20px";
    });
    element.querySelectorAll("li").forEach(el => {
        el.style.marginBottom = "5px";
    });

    // Apply styles to blockquotes and preformatted text
    element.querySelectorAll("blockquote").forEach(el => {
        el.style.borderLeft = "4px solid #ccc";
        el.style.paddingLeft = "10px";
        el.style.marginBottom = "10px";
        el.style.fontStyle = "italic";
    });

    element.querySelectorAll("pre").forEach(el => {
        el.style.backgroundColor = "#f4f4f4";
        el.style.padding = "10px";
        el.style.borderRadius = "5px";
        el.style.overflowX = "auto";
    });

    // Ensure tables are styled correctly
    element.querySelectorAll("table").forEach(el => {
        el.style.width = "100%";
        el.style.borderCollapse = "collapse";
        el.style.marginBottom = "10px";
    });

    element.querySelectorAll("th, td").forEach(el => {
        el.style.border = "1px solid #ddd";
        el.style.padding = "8px";
        el.style.textAlign = "left";
    });

    element.querySelectorAll("th").forEach(el => {
        el.style.backgroundColor = "#f2f2f2";
        el.style.fontWeight = "bold";
    });

    // Ensure links have a proper color and behavior
    element.querySelectorAll("a").forEach(el => {
        el.style.color = "#007acc";
        el.style.textDecoration = "none";
        el.style.fontWeight = "bold";
    });

    // Ensure alignment classes are correctly applied
    element.querySelectorAll(".ql-align-center").forEach(el => {
        el.style.textAlign = "center";
    });

    element.querySelectorAll(".ql-align-right").forEach(el => {
        el.style.textAlign = "right";
    });

    element.querySelectorAll(".ql-align-justify").forEach(el => {
        el.style.textAlign = "justify";
    });
}

fetchSizeChart();