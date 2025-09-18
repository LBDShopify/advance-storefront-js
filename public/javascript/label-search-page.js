document.addEventListener("DOMContentLoaded", function () {
    if (currentPage !== "SEARCH_PAGE") {
        return; // ❌ Not search page, do nothing
    }
    if (!token || token.trim() === "") {
        return;
    }

    async function fetchLabelImageForAProductSearchPage(productId) {
        try {
            const res = await fetch(`${API_URL}/api/v1/label/get-active-by-product`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({productId})
            });
            if (!res.ok) throw new Error("Fetch error");
            return await res.json();
        } catch (err) {
            console.warn("Label fetch failed for productId", productId, err);
            return null;
        }
    }

    async function applySearchPageLabels() {
        let selectorFound = null;
        for (const sel of homeImageSelectors) {
            const productMediaFound = document.querySelector(sel);
            if (productMediaFound) {
                selectorFound = sel
                break;
            }
        }

        let productMedias = document.querySelectorAll(selectorFound)
        if (productMedias.length === 0) {
            console.warn("⚠️ applySearchPageLabels No product media found for selector:", selectorFound);
            return;
        }

        for (const media of productMedias) {
            // find product id
            let productId = await findProductId(media)

            if (!productId) {
                break;
            }

            const labelList = await fetchLabelImageForAProductSearchPage(productId);

            // Check that it's an array
            if (!Array.isArray(labelList)) {
                console.warn("applySearchPageLabels Expected an array of label data");
                continue;
            }

            // Filter for labels with SEARCH_PAGE in showOnPages
            const searchPageLabels = labelList.filter(label =>
                Array.isArray(label.showOnPages) && label.showOnPages.includes("SEARCH_PAGE")
            );

            if (searchPageLabels.length === 0) {
                continue;
            }

            // Apply all valid labels
            for (const label of searchPageLabels) {
                if (label && label.type === "IMAGE" && label.iconUrl) {
                    updateLabelImageOnSearchPage(label, media);
                }
                if (label && label.type === "TEXT" && label.content) {
                    updateLabelTextOnSearchPage(label, media);
                }
            }
        }

    }

    function updateLabelImageOnSearchPage(data, cardMedia) {
        if (!data || !data.id || !data.iconUrl || !cardMedia) {
            console.warn("updateLabelImageOnSearchPage Invalid data or cardMedia, return now");
            return;
        }

        if (!data?.iconUrl) {
            return
        }

        // ✅ Early return if SEARCH_PAGE is not included
        if (!Array.isArray(data.showOnPages) || !data.showOnPages.includes("SEARCH_PAGE")) {
            console.warn("updateLabelImageOnSearchPage Label not configured to show on SEARCH_PAGE, return now")
            return
        }

        const img = cardMedia.querySelector('img');
        const imageContainer = img ? img.parentElement : cardMedia;

        const labelImg = document.createElement("img")
        labelImg.src = data.iconUrl
        labelImg.alt = data.name || "Label"
        labelImg.setAttribute("data-label-image", "true")
        const opacity = data.opacity / 100

        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent)
        const labelWidth = isMobile ? data.widthMobile : data.width
        const labelHeight = isMobile ? data.heightMobile : data.height

        Object.assign(labelImg.style, {
            position: "absolute",
            width: `${labelWidth}px`,
            height: `${labelHeight}px`,
            opacity,
            margin: `${data.margin || 0}px`,
            zIndex: 999,
            pointerEvents: "none",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            transform: "",
        })

        // === Positioning ===
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

        // === Animation ===
        const animation = data.animationType;
        const duration = data.duration || 1;
        const repeat = data.repeatAnimation || "infinite";
        const transformPrefix = labelImg.style.transform || "";

        if (animation && animation !== "NONE") {
            let animationName = "";
            let keyframeCSS = "";

            switch (animation) {
                case "FLASH":
                    animationName = "asfFlashRepeat";
                    keyframeCSS = `@keyframes ${animationName} {
                0% { opacity: 0; }
                100% { opacity: ${opacity}; }
              }`;
                    break;
                case "ZOOM_IN":
                    animationName = "asfZoomInRepeat";
                    keyframeCSS = `@keyframes ${animationName} {
                0% { transform: ${transformPrefix} scale(0); opacity: ${opacity}; }
                100% { transform: ${transformPrefix} scale(1); opacity: ${opacity}; }
              }`
                    break
                case "ZOOM_OUT":
                    animationName = "asfZoomOutRepeat";
                    keyframeCSS = `@keyframes ${animationName} {
                0% { transform: ${transformPrefix} scale(1); opacity: ${opacity}; }
                100% { transform: ${transformPrefix} scale(0); opacity: ${opacity}; }
              }`
                    break
                case "SWING":
                    animationName = "asfSwingRepeat";
                    keyframeCSS = `@keyframes ${animationName} {
                0% { transform: ${transformPrefix} rotate(0deg); opacity: ${opacity}; }
                25% { transform: ${transformPrefix} rotate(15deg); opacity: ${opacity}; }
                50% { transform: ${transformPrefix} rotate(-15deg); opacity: ${opacity}; }
                100% { transform: ${transformPrefix} rotate(0deg); opacity: ${opacity}; }
              }`
                    break
                case "ROLL_IN":
                    animationName = "asfRollInRepeat";
                    keyframeCSS = `@keyframes ${animationName} {
                0% { transform: ${transformPrefix} translateX(-100%) rotate(-120deg); opacity: 0; }
                100% { transform: ${transformPrefix} translateX(0) rotate(0deg); opacity: ${opacity}; }
              }`
                    break
                case "ROLL_OUT":
                    animationName = "asfRollOutRepeat";
                    keyframeCSS = `@keyframes ${animationName} {
                0% { transform: ${transformPrefix} translateX(0) rotate(0deg); opacity: ${opacity}; }
                100% { transform: ${transformPrefix} translateX(100%) rotate(120deg); opacity: 0; }
              }`
                    break
            }

            if (animationName && keyframeCSS) {
                const styleTag = document.createElement("style")
                styleTag.textContent = keyframeCSS
                document.head.appendChild(styleTag)

                labelImg.style.animation = `${animationName} ${duration}s ${repeat}`
            }
        }
        imageContainer.appendChild(labelImg)
    }

    function updateLabelTextOnSearchPage(data, cardMedia) {
        if (!data || !data.id || !data.content) {
            console.warn("Invalid label data");
            return;
        }

        if (!Array.isArray(data.showOnPages) || !data.showOnPages.includes("SEARCH_PAGE")) {
            return;
        }

        const img = cardMedia.querySelector('img');
        const imageContainer = img ? img.parentElement : cardMedia;

        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const widthSVG = isMobile ? data.widthMobile : data.width;
        const heightSVG = isMobile ? data.heightMobile : data.height;

        const productRect = imageContainer.getBoundingClientRect();
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

        // Do not center using translate if not desired
        // Adjust based on iconPosition if needed
        // container.style.transform = "translate(-50%, -50%)";

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

        imageContainer.appendChild(outer);
    }

    applySearchPageLabels();
})