// app.js
Vue.component('component-selector', {
    props: ['component'],
    template: `
        <div>
            <label>{{ component.name }}: 
                <input type="color" v-model="component.color" class="color-picker">
            </label>
        </div>
    `
});

var vm = new Vue({
    el: '#app',
    data: {
        imageUrl1: '',
        imageUrl2: '',
        imageStatus1: 'empty',
        imageStatus2: 'empty',
        matchScoresJson: '',
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
            },
            {
                name: 'Team',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
            },
            {
                name: 'Score',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
            },
            {
                name: 'Kills',
                color: '#000000',
                fontSize: 20,
                offsetX: 0,
                offsetY: 0,
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
