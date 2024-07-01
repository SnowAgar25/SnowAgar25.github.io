// fontSelector.js

document.addEventListener('DOMContentLoaded', () => {
    loadLocalStorageData();

    const fontList = document.getElementById('font-list');
    const searchInput = document.getElementById('font-search');

    // 檢查用戶是否已經同意獲取字體
    const hasPermission = localStorage.getItem('fontPermission') === 'granted';

    // 如果用戶尚未同意，詢問獲取字體的權限
    if (!hasPermission) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                localStorage.setItem('fontPermission', 'granted');
                loadFonts();
            }
        });
    } else {
        // 用戶已經同意獲取字體，直接加載字體列表
        loadFonts();
    }

    function loadFonts() {
        // 加載字體列表
        queryLocalFonts().then(fonts => {
            fonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font.postscriptName; // 使用 postscriptName 作為值
                option.textContent = font.fullName; // 使用 fullName 作為顯示文本
                fontList.appendChild(option);
            });

            // 設置選中的字體
            const selectedFont = localStorage.getItem('selectedFont');
            if (selectedFont) {
                selectFont(selectedFont);
            }
        });
    }

    // 監聽字體選擇事件
    fontList.addEventListener('change', (event) => {
        const selectedFont = event.target.value;
        localStorage.setItem('selectedFont', selectedFont);
    });

    // 監聽搜索欄輸入事件
    searchInput.addEventListener('input', () => {
        const searchQuery = searchInput.value.toLowerCase();
        const options = fontList.options;

        for (let i = 0; i < options.length; i++) {
            const fontName = options[i].textContent.toLowerCase();
            if (fontName.includes(searchQuery)) {
                options[i].style.display = 'block';
            } else {
                options[i].style.display = 'none';
            }
        }
    });
});

function loadLocalStorageData() {
    const selectedFont = localStorage.getItem('selectedFont');
    if (selectedFont) {
        // 選擇存儲的字體
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
