// https://raw.githubusercontent.com/LBDShopify/advance-storefront-js/refs/heads/master/testjs.js

<script>
    function bssLoadScripts(src, callback, isDefer = false) {
    const scriptTag = document.createElement('script');
    document.head.appendChild(scriptTag);
    scriptTag.src = src;
    if (isDefer) {
    scriptTag.defer = true;
} else {
    scriptTag.async = true;
}
    if (callback) {
    scriptTag.addEventListener('load', function () {
    callback();
});
}
}
    const scriptUrls = [
    "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-helper.js",
    "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-config-run-scripts.js",
    ];
    Promise.all(scriptUrls.map((script) => new Promise((resolve) => bssLoadScripts(script, resolve)))).then((res) => {
    console.log('BSS scripts loaded');
    window.bssScriptsLoaded = true;
});

    function bssInitScripts() {
    if (BSS_PL.configData.length) {
    const enabledFeature = [
{type: 1, script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-label.js"},
{type: 2, badge: [0, 7, 8], script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-product-name.js"},
{type: 2, badge: 1, script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-product-image.js"},
{type: 2, badge: 2, script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-custom-selector.js"},
{type: 2, badge: [3, 9, 10], script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-price.js"},
{type: 2, badge: 4, script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-add-to-cart-btn.js"},
{type: 2, badge: 5, script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-quantity-box.js"},
{type: 2, badge: 6, script: "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-pl-init-for-badge-buy-it-now-btn.js"}
    ]
    .filter(({type, badge}) => BSS_PL.configData.some(item => item.label_type === type && (badge === undefined || (Array.isArray(badge) ? badge.includes(item.badge_type) : item.badge_type === badge))) || (type === 1 && BSS_PL.configDataLabelGroup && BSS_PL.configDataLabelGroup.length))
    .map(({script}) => script);

    enabledFeature.forEach((src) => bssLoadScripts(src));

    if (enabledFeature.length) {
    const src = "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-product-label-js.js";
    bssLoadScripts(src);
}
}

    if (BSS_PL.configDataBanner && BSS_PL.configDataBanner.length) {
    const src = "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-product-label-banner.js";
    bssLoadScripts(src);
}

    if (BSS_PL.configDataPopup && BSS_PL.configDataPopup.length) {
    const src = "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-product-label-popup.js";
    bssLoadScripts(src);
}

    if (window.location.search.includes('bss-pl-custom-selector')) {
    const src = "https://cdn.shopify.com/extensions/59e607cf-29c2-4905-9302-edc9cfa42913/ta-labels-badges-477/assets/bss-product-label-custom-position.js";
    bssLoadScripts(src, null, true);
}
}
    bssInitScripts();
</script>