async function fetchLabelDetailProductPage() {
    if (currentPage !== "PRODUCT_PAGE") {
        return; // ❌ Not product page, do nothing
    }

    if (!token || token.trim() === "" || !productId) {
        console.warn("Token or Product ID is missing. Skipping request.");
        return;
    }
    try {
        const response = await fetch(`${API_URL}/api/v1/label/get-active-by-product`, {
            method: "POST", // Use POST because there's a request body
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({productId}) // Include request body
        })

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseText = await response.text();
        if (!responseText) {
            throw new Error("Empty response body");
        }

        let labelList = [];
        try {
            labelList = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON response:", e);
            return;
        }

        // Check that it's an array
        if (!Array.isArray(labelList)) {
            console.warn("Expected an array of label data");
            return;
        }

        // Filter for labels with PRODUCT_PAGE in showOnPages
        const productPageLabels = labelList.filter(label =>
            Array.isArray(label.showOnPages) && label.showOnPages.includes("PRODUCT_PAGE")
        );

        if (productPageLabels.length === 0) {
            return;
        }

        // Apply all valid labels
        for (const label of productPageLabels) {
            if (label && label.type === "IMAGE" && label.iconUrl) {
                updateLabelImageOnProductPage(label)
            }

            if (label && label.type === "TEXT" && label.content) {
                updateLabelTextOnProductPage(label)
            }
        }

    } catch (error) {
        console.error("fetchLabelDetailProductPage ERROR:", error.message);
    }
}

function updateLabelImageOnProductPage(data) {
    if (!data || !data.id || !data.iconUrl) {
        console.warn("updateLabelImageOnProductPage No label data available, return now");
        return;
    }

    // ✅ Early return if PRODUCT_PAGE is not included
    if (!Array.isArray(data.showOnPages) || !data.showOnPages.includes("PRODUCT_PAGE")) {
        console.warn("updateLabelImageOnProductPage Label not configured to show on PRODUCT_PAGE, return now");
        return;
    }

    let selectorFound = null;
    for (const sel of mainImageSelectors) {
        const productMediaFound = document.querySelector(sel);
        if (productMediaFound) {
            selectorFound = sel
            break;
        }
    }

    let productMedias = document.querySelectorAll(selectorFound)
    if (productMedias.length === 0) {
        console.warn("⚠️ No product media found for selector:", selectorFound);
        return;
    }

    productMedias.forEach(productMedia => {
        const container = productMedia.querySelector("img")?.parentElement;
        container.style.position = "relative";
        container.style.overflow = "visible";

        const labelImg = document.createElement("img");
        labelImg.src = data.iconUrl;
        labelImg.className = "asf-label-overlay";

        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const labelWidth = isMobile ? data.widthMobile : data.width;
        const labelHeight = isMobile ? data.heightMobile : data.height;

        Object.assign(labelImg.style, {
            position: "absolute",
            width: `${labelWidth}px`,
            height: `${labelHeight}px`,
            opacity: data.opacity / 100,
            margin: `${data.margin}px`,
            zIndex: 999,
            pointerEvents: "none",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            transform: "",
            backgroundColor: "transparent" // ✅ no background color
        });

        const pos = data.iconPosition;
        if (pos === "TOP_LEFT") {
            labelImg.style.top = "0";
            labelImg.style.left = "0";
        } else if (pos === "TOP_CENTER") {
            labelImg.style.top = "0";
            labelImg.style.left = "50%";
            labelImg.style.transform = "translateX(-50%)";
        } else if (pos === "TOP_RIGHT") {
            labelImg.style.top = "0";
            labelImg.style.right = "0";
        } else if (pos === "CENTER_LEFT") {
            labelImg.style.top = "50%";
            labelImg.style.left = "0";
            labelImg.style.transform = "translateY(-50%)";
        } else if (pos === "CENTER") {
            labelImg.style.top = "50%";
            labelImg.style.left = "50%";
            labelImg.style.transform = "translate(-50%, -50%)";
        } else if (pos === "CENTER_RIGHT") {
            labelImg.style.top = "50%";
            labelImg.style.right = "0";
            labelImg.style.transform = "translateY(-50%)";
        } else if (pos === "BOTTOM_LEFT") {
            labelImg.style.bottom = "0";
            labelImg.style.left = "0";
        } else if (pos === "BOTTOM_CENTER") {
            labelImg.style.bottom = "0";
            labelImg.style.left = "50%";
            labelImg.style.transform = "translateX(-50%)";
        } else if (pos === "BOTTOM_RIGHT") {
            labelImg.style.bottom = "0";
            labelImg.style.right = "0";
        } else {
            labelImg.style.top = "0";
            labelImg.style.left = "0";
        }

        // === Animation logic ===
        const animation = data.animationType;
        const duration = data.duration || 1;
        const repeat = data.repeatAnimation || "infinite";
        const opacity = data.opacity / 100;

        if (animation && animation !== "NONE") {
            const transformPrefix = labelImg.style.transform || "";
            const keyframes = document.createElement("style");
            keyframes.type = "text/css";
            let animationName = "";
            let keyframeCSS = "";

            switch (animation) {
                case "FLASH":
                    animationName = "asfFlashRepeat";
                    keyframeCSS = `
          @keyframes ${animationName} {
            0% { opacity: 0; }
            100% { opacity: ${opacity}; }
          }
        `;
                    break;
                case "ZOOM_IN":
                    animationName = "asfZoomInRepeat";
                    keyframeCSS = `
          @keyframes ${animationName} {
            0% {
              transform: ${transformPrefix} scale(0);
              opacity: ${opacity};
            }
            100% {
              transform: ${transformPrefix} scale(1);
              opacity: ${opacity};
            }
          }
        `;
                    break;
                case "ZOOM_OUT":
                    animationName = "asfZoomOutRepeat";
                    keyframeCSS = `
          @keyframes ${animationName} {
            0% {
              transform: ${transformPrefix} scale(1);
              opacity: ${opacity};
            }
            100% {
              transform: ${transformPrefix} scale(0);
              opacity: ${opacity};
            }
          }
        `;
                    break;
                case "SWING":
                    animationName = "asfSwingRepeat";
                    keyframeCSS = `
          @keyframes ${animationName} {
            0% { transform: ${transformPrefix} rotate(0deg); opacity: ${opacity}; }
            25% { transform: ${transformPrefix} rotate(15deg); opacity: ${opacity}; }
            50% { transform: ${transformPrefix} rotate(-15deg); opacity: ${opacity}; }
            100% { transform: ${transformPrefix} rotate(0deg); opacity: ${opacity}; }
          }
        `;
                    break;
                case "ROLL_IN":
                    animationName = "asfRollInRepeat";
                    keyframeCSS = `
          @keyframes ${animationName} {
            0% {
              transform: ${transformPrefix} translateX(-100%) rotate(-120deg);
              opacity: 0;
            }
            100% {
              transform: ${transformPrefix} translateX(0) rotate(0deg);
              opacity: ${opacity};
            }
          }
        `;
                    break;
                case "ROLL_OUT":
                    animationName = "asfRollOutRepeat";
                    keyframeCSS = `
          @keyframes ${animationName} {
            0% {
              transform: ${transformPrefix} translateX(0) rotate(0deg);
              opacity: ${opacity};
            }
            100% {
              transform: ${transformPrefix} translateX(100%) rotate(120deg);
              opacity: 0;
            }
          }
        `;
                    break;
            }

            if (animationName && keyframeCSS) {
                keyframes.innerHTML = keyframeCSS;
                document.head.appendChild(keyframes);

                Object.assign(labelImg.style, {
                    animation: `${animationName} ${duration}s ${repeat}`,
                });
            }
        }
        container.appendChild(labelImg);
    })
}

function updateLabelTextOnProductPage(data) {
    if (!data || !data.id || !data.content) {
        return;
    }

    if (!Array.isArray(data.showOnPages) || !data.showOnPages.includes("PRODUCT_PAGE")) {
        return;
    }

    let selectorFound = null;
    for (const sel of mainImageSelectors) {
        const productMediaFound = document.querySelector(sel);
        if (productMediaFound) {
            selectorFound = sel
            break;
        }
    }

    let productMedias = document.querySelectorAll(selectorFound)
    if (productMedias.length === 0) {
        console.warn("⚠️ No product media found for selector:", selectorFound);
        return;
    }

    productMedias.forEach(productMedia => {
        if (getComputedStyle(productMedia).position === "static") {
            productMedia.style.position = "relative";
        }

        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const widthSVG = isMobile ? data.widthMobile : data.width;
        const heightSVG = isMobile ? data.heightMobile : data.height;

        const productRect = productMedia.getBoundingClientRect();
        const imageWidth = productRect.width;
        const imageHeight = productRect.height;

        const offsetLeft = imageWidth * (data.marginLeft / 100) - widthSVG * (data.marginLeft / 100);
        const offsetTop = imageHeight * (data.marginTop / 100) - heightSVG * (data.marginTop / 100);

        const container = document.createElement("div");
        container.style.width = `${widthSVG}px`;
        container.style.height = `${heightSVG}px`;
        container.style.position = "absolute";
        container.style.top = "0"; // position inside outer
        container.style.left = "0";
        container.style.borderRadius = `${data.borderRadius}px`;
        container.style.overflow = "hidden"; // clip SVG to borderRadius
        container.style.pointerEvents = "none";
        container.style.background = "transparent";
        container.style.zIndex = "1"; // inside outer

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", widthSVG);
        svg.setAttribute("height", heightSVG);
        svg.setAttribute("xmlns", svgNS);
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${widthSVG} ${heightSVG}`);
        svg.style.borderRadius = "0"; // Not needed on SVG
        svg.style.overflow = "visible";

        svg.style.transform = ""; // clear inherited translate
        svg.style.transformOrigin = "center";

        function drawCircle() {
            const r = Math.min(widthSVG, heightSVG) / 2;
            const circle = document.createElementNS(svgNS, "circle");
            circle.setAttribute("cx", widthSVG / 2);
            circle.setAttribute("cy", heightSVG / 2);
            circle.setAttribute("r", r);
            circle.setAttribute("fill", data.backgroundColor);
            svg.appendChild(circle);
        }

        function drawRect() {
            const rect = document.createElementNS(svgNS, "rect");
            rect.setAttribute("x", 0);
            rect.setAttribute("y", 0);
            rect.setAttribute("width", widthSVG);
            rect.setAttribute("height", heightSVG);
            rect.setAttribute("fill", data.backgroundColor);
            rect.setAttribute("rx", data.borderRadius); // rounded corners
            rect.setAttribute("ry", data.borderRadius);
            svg.appendChild(rect);
        }

        function drawPolygon(points) {
            const polygon = document.createElementNS(svgNS, "polygon");
            polygon.setAttribute("points", points);
            polygon.setAttribute("fill", data.backgroundColor);
            svg.appendChild(polygon);
        }

        function loadGoogleFontIfNeeded(fontName) {
            const fontSlug = fontName.replace(/ /g, "+");
            const fontUrl = `https://fonts.googleapis.com/css2?family=${fontSlug}&display=swap`;

            if (!document.querySelector(`link[href="${fontUrl}"]`)) {
                const link = document.createElement("link");
                link.href = fontUrl;
                link.rel = "stylesheet";
                document.head.appendChild(link);
            }
        }

        function addText(x, y, rotate = 0) {
            loadGoogleFontIfNeeded(data.font);

            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", x);
            text.setAttribute("y", y);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("font-size", data.fontSize);
            text.setAttribute("fill", data.textColor);
            text.setAttribute("font-family", data.font);
            if (rotate !== 0) {
                text.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
            }
            text.textContent = data.content;
            svg.appendChild(text);
        }

        switch (data.background) {
            case "SVG_CIRCLE":
                drawCircle();
                addText(widthSVG / 2, heightSVG / 2);
                break;
            case "SVG_SQUARE":
                drawRect();
                addText(widthSVG / 2, widthSVG / 2);
                break;
            case "SVG_RECTANGLE":
                drawRect();
                addText(widthSVG / 2, heightSVG / 2);
                break;
            case "SVG_TRIANGLE_TOP_LEFT":
                drawPolygon(`0,0 ${widthSVG},0 0,${heightSVG}`);
                addText(widthSVG * 0.4, heightSVG * 0.4, 315);
                break;
            case "SVG_TRIANGLE_TOP_RIGHT":
                drawPolygon(`0,0 ${widthSVG},0 ${widthSVG},${heightSVG}`);
                addText(widthSVG * 0.6, heightSVG * 0.4, 45);
                break;
            case "SVG_TRIANGLE_BOTTOM_LEFT":
                drawPolygon(`0,0 ${widthSVG},${widthSVG} 0,${heightSVG}`);
                addText(widthSVG * 0.35, heightSVG * 0.6, 45);
                break;
            case "SVG_TRIANGLE_BOTTOM_RIGHT":
                drawPolygon(`0,${widthSVG} ${widthSVG},${widthSVG} ${widthSVG},0`);
                addText(widthSVG * 0.65, heightSVG * 0.65, 315);
                break;
            case "SVG_RIBBON_TOP_LEFT":
                drawPolygon(`${widthSVG / 2},0 ${widthSVG},0 0,${heightSVG} 0,${heightSVG / 2}`);
                addText(widthSVG * 0.38, widthSVG * 0.38, -45);
                break;
            case "SVG_RIBBON_TOP_RIGHT":
                drawPolygon(`0,0 ${widthSVG / 2},0 ${widthSVG},${widthSVG / 2} ${widthSVG},${widthSVG}`);
                addText(widthSVG * 0.65, heightSVG * 0.4, 45);
                break;
            case "SVG_RIBBON_BOTTOM_LEFT":
                drawPolygon(`0,0 0,${widthSVG / 2} ${widthSVG / 2},${widthSVG} ${widthSVG},${widthSVG}`);
                addText(widthSVG * 0.35, heightSVG * 0.6, 45);
                break;
            case "SVG_RIBBON_BOTTOM_RIGHT":
                drawPolygon(`0,${widthSVG} ${widthSVG / 2},${widthSVG} ${widthSVG},${widthSVG / 2} ${widthSVG},0`);
                addText(widthSVG * 0.6, widthSVG * 0.65, -45);
                break;
            case "SVG_GIM_LEFT":
                drawPolygon(`30,0 ${widthSVG},0 ${widthSVG},${heightSVG} 30,${heightSVG} 0,${heightSVG / 2}`);
                addText(widthSVG / 2 + 10, heightSVG / 2);
                break;
            case "SVG_GIM_RIGHT":
                drawPolygon(`0,0 ${widthSVG - 30},0 ${widthSVG},${heightSVG / 2} ${widthSVG - 30},${heightSVG} 0,${heightSVG}`);
                addText(widthSVG / 2 - 5, heightSVG / 2);
                break;
            case "SVG_INCISOR_LEFT":
                drawPolygon(`0,0 ${widthSVG},0 ${widthSVG},${heightSVG} 0,${heightSVG} 30,${heightSVG / 2}`);
                addText(widthSVG / 2 + 10, heightSVG / 2);
                break;
            case "SVG_INCISOR_RIGHT":
                drawPolygon(`0,0 ${widthSVG},0 ${widthSVG - 30},${heightSVG / 2} ${widthSVG},${heightSVG} 0,${heightSVG}`);
                addText(widthSVG / 2 - 10, heightSVG / 2);
                break;
            default:
                drawRect();
                addText(widthSVG / 2, heightSVG / 2);
                break;
        }

        container.appendChild(svg);

        const outer = document.createElement("div");
        outer.style.position = "absolute";
        outer.style.top = `${offsetTop}px`; // ✅ only apply margin offset here
        outer.style.left = `${offsetLeft}px`;
        outer.style.width = `${widthSVG}px`;
        outer.style.height = `${heightSVG}px`;
        outer.style.zIndex = "99";
        outer.style.pointerEvents = "none";
        outer.style.filter = `drop-shadow(${data.shadowX}px ${data.shadowY}px ${data.blur}px ${data.blurColor})`;
        outer.style.overflow = "visible"; // allow shadow to show outside
        outer.style.opacity = data.opacity / 100;

        // Only set animation if type is not NONE
        if (data.animationType !== "NONE") {
            const opacity = data.opacity / 100;
            const uniqueKey = `anim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            let keyframes = "";
            switch (data.animationType) {
                case "FLASH":
                    keyframes = `
        @keyframes ${uniqueKey} {
          0% { opacity: 0; }
          100% { opacity: ${opacity}; }
        }`;
                    break;
                case "ZOOM_IN":
                    keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: scale(0); opacity: ${opacity}; }
          100% { transform: scale(1); opacity: ${opacity}; }
        }`;
                    break;
                case "ZOOM_OUT":
                    keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: scale(1); opacity: ${opacity}; }
          100% { transform: scale(0); opacity: ${opacity}; }
        }`;
                    break;
                case "SWING":
                    keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: rotate(0deg); opacity: ${opacity}; }
          25% { transform: rotate(15deg); opacity: ${opacity}; }
          50% { transform: rotate(-15deg); opacity: ${opacity}; }
          100% { transform: rotate(0deg); opacity: ${opacity}; }
        }`;
                    break;
                case "ROLL_IN":
                    keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: translateX(-100%) rotate(-120deg); opacity: 0; }
          100% { transform: translateX(0) rotate(0deg); opacity: ${opacity}; }
        }`;
                    break;
                case "ROLL_OUT":
                    keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: translateX(0) rotate(0deg); opacity: ${opacity}; }
          100% { transform: translateX(100%) rotate(120deg); opacity: 0; }
        }`;
                    break;
            }

            // Add keyframes to document
            const styleSheet = document.createElement("style");
            styleSheet.innerHTML = keyframes;
            document.head.appendChild(styleSheet);

            // Apply animation to SVG
            outer.style.animation = `${uniqueKey} ${data.duration}s ${data.repeatAnimation}`;
        }

        outer.appendChild(container);
        productMedia.appendChild(outer);
    })
}

document.addEventListener("DOMContentLoaded", () => {
    fetchLabelDetailProductPage();
})