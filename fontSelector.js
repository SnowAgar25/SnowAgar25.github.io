document.addEventListener('DOMContentLoaded', async () => {
    const fontList = document.getElementById('font-list');
    const searchInput = document.getElementById('font-search');
    const requestButton = document.getElementById('request-font-access');

    // 查詢字體權限狀態
    checkFontPermission();

    // 檢查本地存儲中是否有選擇的字體並設置
    loadLocalStorageData();

    // 添加按鈕點擊事件
    requestButton.addEventListener('click', async () => {
        try {
            await queryLocalFonts();
            localStorage.setItem('fontAccessGranted', 'true');
            requestButton.style.display = 'none';
            loadFonts();
        } catch (err) {
            console.error('Error querying fonts:', err);
        }
    });

    // 監聽字體選擇事件
    fontList.addEventListener('change', (event) => {
        const selectedFont = event.target.value;
        localStorage.setItem('selectedFont', selectedFont);
        // 更新 Vue 實例中的 selectedFont
        const app = document.getElementById('app');
        if (app && app.__vue__) {
            app.__vue__.selectedFont = selectedFont;
        }
    });

    // 監聽搜尋欄輸入事件
    searchInput.addEventListener('input', () => {
        const searchQuery = searchInput.value.toLowerCase();
        const options = fontList.options;

        for (let i = 0; i < options.length; i++) {
            const fontName = options[i].textContent.toLowerCase();
            options[i].style.display = fontName.includes(searchQuery) ? 'block' : 'none';
        }
    });
});

async function checkFontPermission() {
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'local-fonts' });
        updateButtonVisibility(permissionStatus.state);
        permissionStatus.onchange = () => {
            updateButtonVisibility(permissionStatus.state);
        };
    } catch (error) {
        console.error('Error querying permission:', error);
    }
}

function updateButtonVisibility(state) {
    const requestButton = document.getElementById('request-font-access');
    if (state === 'granted') {
        requestButton.style.display = 'none';
        loadFonts();
    } else if (state === 'prompt') {
        requestButton.style.display = 'block';
        requestButton.textContent = '點擊此處同意讀取本地字體列表';
        requestButton.disabled = false;
    } else if (state === 'denied') {
        requestButton.style.display = 'block';
        requestButton.textContent = '您封鎖了字形的權限，請至網站權限重新設定';
        requestButton.disabled = true; // 按鈕無法按下
    }
}

async function loadFonts() {
    const fontList = document.getElementById('font-list');
    const fonts = await queryLocalFonts();
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font.postscriptName;
        option.textContent = font.fullName;
        fontList.appendChild(option);
    });

    const selectedFont = localStorage.getItem('selectedFont');
    if (selectedFont) {
        selectFont(selectedFont);
    }
}

function loadLocalStorageData() {
    const selectedFont = localStorage.getItem('selectedFont');
    if (selectedFont) {
        selectFont(selectedFont);
    }
}

function selectFont(fontName) {
    const fontList = document.getElementById('font-list');
    for (let i = 0; i < fontList.options.length; i++) {
        if (fontList.options[i].value === fontName) {
            fontList.selectedIndex = i;
            fontList.options[i].selected = true;
            fontList.scrollTop = fontList.options[i].offsetTop;
            break;
        }
    }
}
