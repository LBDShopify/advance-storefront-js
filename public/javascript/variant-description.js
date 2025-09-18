const variants = [
    {% for variant in product.variants %}
{
    id: "{{ variant.id }}"
}
{% if forloop.last == false %},
{% endif %}
{% endfor %}
];

const productDescription = {{ product.description | json }};

document.addEventListener('DOMContentLoaded', () => {
        let isHaveVariantDescription = false

        function updateVariantDescription() {
            if (currentPage !== "PRODUCT_PAGE") {
                return; // ❌ Not product page, do nothing
            }

            if (!token || token.trim() === "" || !productId) {
                return;
            }
            const urlParams = new URLSearchParams(window.location.search);
            const variantId = urlParams.get('variant');
            if (variantId) {
                getVariantDescription(variantId)
            } else {

                //test ok
                if (variants[0]) {
                    getVariantDescription(variants[0].id)
                } else {
                    if (isHaveVariantDescription) {
                        queryProductDescriptionAndReplace(productDescription);
                    }
                }
            }
        }

        async function getVariantDescription(variantId) {
            try {
                const res = await fetch(`${API_URL}/api/v1/variant/description/get-by-id`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({variantId})
                });
                if (res.status === 200) {
                    isHaveVariantDescription = true
                    const text = await res.text();
                    const data = JSON.parse(text);
                    queryProductDescriptionAndReplace(data.description);
                } else {

                    if (variants.length === 1) {

                    } else {
                        if (isHaveVariantDescription) {
                            queryProductDescriptionAndReplace(productDescription);
                        }
                    }
                }

            } catch (err) {
                console.warn("getVariantDescription error: ", err);
                return null;
            }
        }

        function queryProductDescriptionAndReplace(description) {
            for (let selector of productDescriptionSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = description;
                    return; // Stop execution once a match is found
                }
            }
        }

        // Update on page load
        updateVariantDescription();

        // Update whenever the URL changes
        window.addEventListener('popstate', updateVariantDescription);

        // For JavaScript-driven navigation
        const originalPushState = history.pushState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            updateVariantDescription();
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function () {
            originalReplaceState.apply(this, arguments);
            updateVariantDescription();
        };
    }
);