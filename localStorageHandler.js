// localStorageHandler.js

document.addEventListener('DOMContentLoaded', () => {
    // 加載localStorage中的數據
    loadLocalStorageData();

    // Add event listener for font upload
    const fontUploadInput = document.getElementById('font-upload-input');
    fontUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            await loadFont(file);
            await saveFileToOpfs(file);
        }
    });

    // Check if there is an uploaded font file in OPFS
    loadFontFromOpfs();

    // 監聽Vue實例的變化
    const app = document.getElementById('app');
    if (app && app.__vue__) {
        const vueInstance = app.__vue__;
        vueInstance.$watch('imageUrl1', function (newValue) {
            localStorage.setItem('imageUrl1', newValue);
            vueInstance.updateImage(1);
        });
        vueInstance.$watch('imageUrl2', function (newValue) {
            localStorage.setItem('imageUrl2', newValue);
            vueInstance.updateImage(2);
        });
        vueInstance.$watch('matchScoresJson', function (newValue) {
            localStorage.setItem('matchScoresJson', newValue);
        });
        vueInstance.$watch('regexpInput', function (newValue) {
            localStorage.setItem('regexpInput', newValue);
        });
        vueInstance.$watch('components', function (newValue) {
            localStorage.setItem('components', JSON.stringify(newValue));
        }, { deep: true });
        vueInstance.$watch('selectedFont', function (newValue) {
            localStorage.setItem('selectedFont', newValue);
        });
    }
});

function loadLocalStorageData() {
    const imageUrl1 = localStorage.getItem('imageUrl1');
    const imageUrl2 = localStorage.getItem('imageUrl2');
    const matchScoresJson = localStorage.getItem('matchScoresJson');
    const regexpInput = localStorage.getItem('regexpInput');
    const components = localStorage.getItem('components');
    const selectedFont = localStorage.getItem('selectedFont');

    const app = document.getElementById('app');
    if (app && app.__vue__) {
        const vueInstance = app.__vue__;
        if (imageUrl1) vueInstance.imageUrl1 = imageUrl1;
        if (imageUrl2) vueInstance.imageUrl2 = imageUrl2;
        if (matchScoresJson) vueInstance.matchScoresJson = matchScoresJson;
        if (regexpInput) vueInstance.regexpInput = regexpInput;
        if (components) vueInstance.components = JSON.parse(components);
        if (selectedFont) vueInstance.selectedFont = selectedFont;

        // 手動觸發圖片框架更新
        vueInstance.updateImage(1);
        vueInstance.updateImage(2);
    }
}
