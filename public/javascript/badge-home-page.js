document.addEventListener("DOMContentLoaded", function () {
        if (currentPage !== "HOME_PAGE") {
            return; // ❌ Not home page, do nothing
        }
        if (!token || token.trim() === "") {
            return;
        }

        async function applyHomePageBadges() {
            let selectorFound = null;
            for (const sel of badgeHomeImageBelowSelectors) {
                const productMediaFound = document.querySelector(sel);
                if (productMediaFound) {
                    selectorFound = sel
                    break;
                }
            }

            let productMedias = document.querySelectorAll(selectorFound)
            if (productMedias.length === 0) {
                console.warn("⚠️ applyHomePageBadges No product media found for selector:", selectorFound);
                return;
            }

            for (const media of productMedias) {
                // find product id
                let productId = await findProductId(media)

                if (!productId) {
                    break;
                }

                //start get data and update image embed
                const badgeList = await fetchBadgeForAProductHomePage(productId);

                // Check that it's an array
                if (!Array.isArray(badgeList)) {
                    console.warn("applyHomePageBadges Expected an array of data");
                    continue;
                }

                // Filter for badge with HOME_PAGE in showOnPages
                const homePageBadges = badgeList.filter(badge =>
                    Array.isArray(badge.showOnPages) && badge.showOnPages.includes("HOME_PAGE")
                );

                if (homePageBadges.length === 0) {
                    continue;
                }

                // Apply all valid badge
                for (const badge of homePageBadges) {
                    updateBadgeOnHomePage(badge, media);
                }

            }
        }

        async function fetchBadgeForAProductHomePage(productId) {
            try {
                const res = await fetch(`${API_URL}/api/v1/badge/get-active-by-product`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({productId})
                });
                return await res.json();
            } catch (err) {
                console.warn("fetchBadgeForAProductHomePage failed for productId", productId, err);
                return null;
            }
        }

        function updateBadgeOnHomePage(badge, media) {
            if (!badge || badge.status !== "ACTIVE") return;

            const position = badge.position || "BELOW_NAME";
            const font = badge.font || "Arial";

            // Load only needed font
            if (font && !document.querySelector(`link[data-font="${font}"]`)) {
                const fontLink = document.createElement("link");
                fontLink.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}&display=swap`;
                fontLink.rel = "stylesheet";
                fontLink.setAttribute("data-font", font);
                document.head.appendChild(fontLink);
            }

            // Badge container
            const badgeContainer = document.createElement("div");
            badgeContainer.className = "asf-badge-container";
            badgeContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: ${badge.gap || 4}px;
        padding: ${badge.padding || 4}px;
        background: ${badge.backgroundColor || "transparent"};
        border-radius: ${badge.border || 0}px;
        opacity: ${(badge.opacity || 100) / 100};
        font-family: '${font}', sans-serif;
        font-size: ${badge.fontSize || 14}px;
        color: ${badge.textColor || "#000"};
        margin-top: ${badge.marginTop || 0}px;
        margin-bottom: ${badge.marginBottom || 0}px;
        width: fit-content;
        height: fit-content`;

            // Badge content
            const img = badge.imageBadge
                ? (() => {
                    const el = document.createElement("img");
                    el.src = badge.imageBadge;
                    el.alt = "badge";

                    // Remove HTML attributes, they’re too weak vs theme CSS
                    el.removeAttribute("width");
                    el.removeAttribute("height");

                    const w = badge.imageWidth || 24;
                    const h = badge.imageHeight || 24;

                    // Force fixed size with !important
                    el.style.setProperty("width", w + "px", "important");
                    el.style.setProperty("height", h + "px", "important");
                    el.style.setProperty("max-width", "none", "important");
                    el.style.setProperty("max-height", "none", "important");
                    el.style.setProperty("display", "inline-block", "important");
                    el.style.setProperty("flex", "0 0 auto", "important");
                    el.style.setProperty("object-fit", "contain", "important");
                    el.style.setProperty("background", "transparent", "important");

                    return el;
                })()
                : null;

            const text = badge.content
                ? Object.assign(document.createElement("span"), {
                    textContent: badge.content,
                    style: `line-height: 1.2;`,
                })
                : null;

            if (badge.orderBadge === "ICON-TEXT") {
                if (img) badgeContainer.appendChild(img);
                if (text) badgeContainer.appendChild(text);
            } else {
                if (text) badgeContainer.appendChild(text);
                if (img) badgeContainer.appendChild(img);
            }

// --- Inject keyframes for supported animations ---
            function injectBadgeAnimation(animationType, opacity) {
                const uniqueKey = `${animationType.toLowerCase()}_${Date.now()}`;

                let keyframes = "";

                switch (animationType) {
                    case "FLASH":
                        keyframes = `
        @keyframes ${uniqueKey} {
          0% { opacity: 0; }
          100% { opacity: ${opacity}; }
        }
      `;
                        break;
                    case "ZOOM_IN":
                        keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: scale(0); opacity: ${opacity}; }
          100% { transform: scale(1); opacity: ${opacity}; }
        }
      `;
                        break;
                    case "ZOOM_OUT":
                        keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: scale(1); opacity: ${opacity}; }
          100% { transform: scale(0); opacity: ${opacity}; }
        }
      `;
                        break;
                    case "SWING":
                        keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: rotate(0deg); opacity: ${opacity}; }
          25% { transform: rotate(15deg); opacity: ${opacity}; }
          50% { transform: rotate(-15deg); opacity: ${opacity}; }
          100% { transform: rotate(0deg); opacity: ${opacity}; }
        }
      `;
                        break;
                    case "ROLL_IN":
                        keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: translateX(-100%) rotate(-120deg); opacity: 0; }
          100% { transform: translateX(0) rotate(0deg); opacity: ${opacity}; }
        }
      `;
                        break;
                    case "ROLL_OUT":
                        keyframes = `
        @keyframes ${uniqueKey} {
          0% { transform: translateX(0) rotate(0deg); opacity: ${opacity}; }
          100% { transform: translateX(100%) rotate(120deg); opacity: 0; }
        }
      `;
                        break;
                    default:
                        return null; // no animation
                }

                const style = document.createElement("style");
                style.innerHTML = keyframes;
                document.head.appendChild(style);

                return uniqueKey;
            }

// --- Apply to badge ---
            if (badge.animationType !== "NONE") {
                const opacity = badge.opacity ? badge.opacity / 100 : 1;
                const animKey = injectBadgeAnimation(badge.animationType, opacity);

                if (animKey) {
                    const repeat = badge.repeatAnimation || "infinite";
                    const duration = badge.duration || 1;

                    badgeContainer.style.animation = `${animKey} ${duration}s ease-in-out ${repeat}`;
                }
            }

            // General insert below
            const tryInsertBelow = (selector) => {
                const productItemComponent = media.closest(homeImageClosestSelectors)
                if (productItemComponent) {
                    const componentFound = productItemComponent.querySelector(selector)
                    if (componentFound) {
                        componentFound.insertAdjacentElement("afterend", badgeContainer);
                    }
                }
            }

            // Insert inline before/after price
            const tryInsertInlineWithPrice = (selector, position) => {
                const productItemComponent = media.closest(homeImageClosestSelectors)
                if (productItemComponent) {
                    const componentFound = productItemComponent.querySelector(selector)
                    if (componentFound) {
                        const wrapper = document.createElement("span");
                        wrapper.style.display = "inline-flex";
                        wrapper.style.alignItems = "center";
                        wrapper.style.gap = "6px";

                        if (position === "BEFORE_PRICE") {
                            wrapper.appendChild(badgeContainer);
                            wrapper.appendChild(componentFound.cloneNode(true));
                        } else {
                            wrapper.appendChild(componentFound.cloneNode(true));
                            wrapper.appendChild(badgeContainer);
                        }
                        componentFound.replaceWith(wrapper);
                    } else {
                        console.warn(`tryInsertInlineWithPrice ❌ No valid price element found for ${position}`);
                    }
                }
            }

            // Insert below product image without layout shift
            function insertBadgeBelowProductImage() {
                const productItemComponent = media.closest(homeImageClosestSelectors)
                if (productItemComponent) {
                    const componentFound = productItemComponent.querySelector(badgeImageLayoutBelowHomePageSelectors);
                    if (componentFound) {
                        componentFound.insertAdjacentElement("afterend", badgeContainer);
                    }
                }
            }

            // Map positions
            switch (position) {
                case "BELOW_NAME":
                    tryInsertBelow(badgeTitleHomePageSelectors);
                    break;
                case "BEFORE_PRICE":
                    tryInsertInlineWithPrice(badgeBeforeAfterPriceHomePageSelectors, "BEFORE_PRICE");
                    break;
                case "AFTER_PRICE":
                    tryInsertInlineWithPrice(badgeBeforeAfterPriceHomePageSelectors, "AFTER_PRICE");
                    break;
                case "BELOW_PRICE":
                    tryInsertBelow(badgeBelowPriceHomePageSelectors);
                    break;
                // case "BELOW_QUANTITY_BOX":
                //   tryInsertBelow(badgeQuantityBoxSelectors);
                //   break;
                // case "BELOW_ADD_TO_CARD":
                //   tryInsertBelow(badgeAddToCardSelectors);
                //   break;
                // case "BELOW_BUY_NOW":
                //   tryInsertBelow(badgeBuyNowSelectors);
                //   break;
                case "BELOW_PRODUCT_IMAGE":
                    insertBadgeBelowProductImage();
                    break;
                default:
                    break
            }
        }

        applyHomePageBadges();
    }
)