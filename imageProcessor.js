async function processImages(imageUrl1, imageUrl2, components, matchScores, uploadedFont, drawContours) {
    // Load images
    const [image1, image2] = await Promise.all([loadImage(imageUrl1), loadImage(imageUrl2)]);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image2.width;
    canvas.height = image2.height;
    ctx.drawImage(image2, 0, 0);

    // Draw text on contours
    components.forEach((component, componentIndex) => {
        if (component.color !== '#000000') {
            const valueIndex = componentIndex;
            const values = matchScores.slice(1).map(score => score[valueIndex]);

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = image1.width;
            tempCanvas.height = image1.height;
            tempCtx.drawImage(image1, 0, 0);

            const { r, g, b } = hexToRgb(component.color);
            const mask = createMask(tempCtx, r, g, b, image1.width, image1.height);
            const contours = findContours(mask, image1.width, image1.height);
            const filteredContours = contours.filter(contour => contour.area > 10);

            filteredContours.sort((a, b) => a.points[0].x - b.points[0].x || a.points[0].y - b.points[0].y);

            filteredContours.forEach((contour, index) => {
                if (index < values.length) {
                    const rect = getBoundingRect(contour);
                    const text = values[index];
                    if (text) {
                        drawText(
                            ctx, 
                            text, 
                            rect, 
                            uploadedFont ? 'uploadedFont' : 'Arial', 
                            component.fontSize, 
                            component.offsetX, 
                            component.offsetY,
                            component.align
                        );
                    }

                    if (drawContours) {
                        drawContour(ctx, contour);
                    }
                }
            });
        }
    });

    const finalImageUrl = canvas.toDataURL();
    return finalImageUrl;
}

function drawText(ctx, text, rect, font, fontSize, offsetX, offsetY, align) {
    ctx.font = `${fontSize || 20}px ${font}`;
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'middle';
    if (align === 'center') {
        ctx.textAlign = 'center';
        ctx.fillText(
            text, 
            rect.x + rect.width / 2 + Number(offsetX), 
            rect.y + rect.height / 2 + Number(offsetY)
        );
    } else {
        ctx.textAlign = 'left';
        ctx.fillText(
            text, 
            rect.x + Number(offsetX), 
            rect.y + rect.height / 2 + Number(offsetY)
        );
    }
}

function drawContour(ctx, contour) {
    ctx.beginPath();
    ctx.moveTo(contour.points[0].x, contour.points[0].y);
    contour.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'red';
    ctx.stroke();
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function createMask(ctx, r, g, b, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const mask = new Uint8Array(data.length / 4);

    for (let i = 0; i < data.length; i += 4) {
        const matches = data[i] === r && data[i + 1] === g && data[i + 2] === b;
        mask[i / 4] = matches ? 255 : 0;
    }

    return mask;
}

function findContours(mask, width, height) {
    let src = cv.matFromArray(height, width, cv.CV_8UC1, mask);
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(src, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let contourArray = [];
    for (let i = 0; i < contours.size(); ++i) {
        let contour = contours.get(i);
        let points = [];
        for (let j = 0; j < contour.rows; ++j) {
            points.push({
                x: contour.data32S[j * 2],
                y: contour.data32S[j * 2 + 1]
            });
        }
        contourArray.push({ points, area: cv.contourArea(contour) });
    }

    src.delete();
    contours.delete();
    hierarchy.delete();
    return contourArray;
}

function getBoundingRect(contour) {
    const xs = contour.points.map(point => point.x);
    const ys = contour.points.map(point => point.y);
    return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
    };
}
