// app.js
Vue.component('component-selector', {
    props: ['component'],
    template: `
        <div>
            <label>{{ component.name }}: </label>
            <span>矩形色塊:</span>
            <input type="color" v-model="component.color" class="color-picker">
        
            <span>字體大小:</span>
            <input type="number" v-model="component.fontSize" min="1" style="width: 60px;">
            
            <span>偏移X:</span>
            <input type="number" v-model="component.offsetX" style="width: 60px;">
            
            <span>偏移Y:</span>
            <input type="number" v-model="component.offsetY" style="width: 60px;">
            
            <button @click="toggleAlign">{{ component.align === 'center' ? '置左' : '置中' }}</button>
        </div>
    `,
    methods: {
        toggleAlign() {
            this.component.align = this.component.align === 'center' ? 'left' : 'center';
        }
    }
});

var vm = new Vue({
    el: '#app',
    data: {
        imageUrl1: '',
        imageUrl2: '',
        imageStatus1: 'empty',
        imageStatus2: 'empty',
        matchScoresJson: '',
        regexpInput: '^\d+\.(.*)$',
        finalImage: '',
        selectedFont: '',
        drawContours: false,
        components: [
            {
                name: 'Rank',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
                align: 'center'
            },
            {
                name: 'Team',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
                align: 'center'
            },
            {
                name: 'Score',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
                align: 'center'
            },
            {
                name: 'Kills',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
                align: 'center'
            },
        ],
        buttonText: '複製圖片'
    },    
    methods: {
        updateImage(imageNumber) {
            const url = imageNumber === 1 ? this.imageUrl1 : this.imageUrl2;
            const imageStatusKey = imageNumber === 1 ? 'imageStatus1' : 'imageStatus2';

            if (!url) {
                this[imageStatusKey] = 'empty';
                return;
            }

            const img = new Image();
            img.onload = () => {
                this[imageStatusKey] = 'loaded';
            };
            img.onerror = () => {
                this[imageStatusKey] = '404';
            };
            img.src = url;
        },
        async generateImage() {
            const hasColor = this.components.some(component => component.color !== '#000000');
            if (!hasColor) {
                alert('至少需要一個顏色選擇器有顏色');
                return;
            }
        
            try {
                const matchScores = JSON.parse(this.matchScoresJson);
                const regexp = new RegExp(this.regexpInput);
        
                // 遍歷每個數據行（跳過標題行）
                for (let i = 1; i < matchScores.length; i++) {
                    // 獲取當前行的 "Team" 字段
                    const teamField = matchScores[i][1];

                    // 應用正則表達式並更新 "Team" 字段
                    const matches = teamField.match(regexp);
                    if (matches && matches[0]) {
                        // 使用匹配的結果更新
                        matchScores[i][1] = matches[1];
                    }
                }

                // 將處理後的數據轉換回 JSON 字符串（如果需要）
                this.matchScoresJson = JSON.stringify(matchScores);
        
                this.finalImage = await processImages(
                    this.imageUrl1, 
                    this.imageUrl2, 
                    this.components, 
                    matchScores, 
                    this.selectedFont, 
                    this.drawContours
                );
            } catch (error) {
                alert('生成圖片失敗：' + error.message);
            }
        },
        copyImage() {
            if (!this.finalImage) {
                this.buttonText = '無圖可複製';
                setTimeout(() => {
                    this.buttonText = '複製圖片';
                }, 800);
                return;
            }

            fetch(this.finalImage)
                .then(res => res.blob())
                .then(blob => {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item])
                        .then(() => {
                            this.buttonText = '圖片已複製';
                            setTimeout(() => {
                                this.buttonText = '複製圖片';
                            }, 800);
                        })
                        .catch(err => {
                            alert('複製圖片失敗：' + err.message);
                        });
                });
        }
    }
});

async function loadFont(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const font = new FontFace('uploadedFont', e.target.result);
        font.load().then(function (loadedFont) {
            document.fonts.add(loadedFont);
            const app = document.getElementById('app');
            if (app && app.__vue__) {
                app.__vue__.selectedFont = 'uploadedFont';
            }
        }).catch(function (error) {
            console.error('Font loading error:', error);
        });
    };
    reader.readAsArrayBuffer(file);
}

async function saveFileToOpfs(file) {
    try {
        const storageRoot = await navigator.storage.getDirectory();
        const uploadsDir = await storageRoot.getDirectoryHandle('uploads', { create: true });

        // 刪除舊檔案
        const previousFileName = localStorage.getItem('uploadedFontFileName');
        if (previousFileName) {
            try {
                await uploadsDir.removeEntry(previousFileName, { recursive: false });
            } catch (err) {
                console.warn(`Error removing old file ${previousFileName}:`, err);
                // 確保舊檔案名稱被移除
                localStorage.removeItem('uploadedFontFileName');
            }
        }

        const newFile = await uploadsDir.getFileHandle(file.name, { create: true });
        const writable = await newFile.createWritable();
        await writable.write(file);
        await writable.close();

        // 儲存最新上傳的檔案名稱
        localStorage.setItem('uploadedFontFileName', file.name);
    } catch (err) {
        console.error('Error saving file to OPFS:', err);
    }
}


async function loadFontFromOpfs() {
    try {
        const storageRoot = await navigator.storage.getDirectory();
        const uploadsDir = await storageRoot.getDirectoryHandle('uploads');
        const fileName = localStorage.getItem('uploadedFontFileName');
        
        if (fileName) {
            try {
                const fileHandle = await uploadsDir.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                const fileInput = document.getElementById('font-upload-input');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([file], file.name));
                fileInput.files = dataTransfer.files;
                await loadFont(file);
            } catch (err) {
                console.error('Error loading file from OPFS:', err);
                // 確保舊檔案名稱被移除
                localStorage.removeItem('uploadedFontFileName');
            }
        }
    } catch (err) {
        console.error('Error loading file from OPFS:', err);
    }
}


