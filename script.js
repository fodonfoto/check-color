document.getElementById('generateButton').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please choose a file first.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const content = event.target.result;
        let parsedData;

        try {
            if (file.name.endsWith('.json')) {
                parsedData = JSON.parse(content);
            } else if (file.name.endsWith('.css') || file.name.endsWith('.ts') || file.name.endsWith('.swift') || file.name.endsWith('.xml') || file.name.endsWith('.dart')) {
                parsedData = parseCSS(content);
            } else {
                throw new Error('Unsupported file format.');
            }

            console.log('Parsed Data:', parsedData);
            generateGuideline(parsedData);
        } catch (error) {
            console.error('Error:', error);
            alert('Error parsing the file. Please upload a valid file.');
        }
    };

    reader.readAsText(file);
});

document.getElementById('checkContrastButton').addEventListener('click', () => {
    const textColor = document.getElementById('textColor').value;
    const bgColor = document.getElementById('bgColor').value;
    const contrastRatio = calculateContrast(textColor, bgColor);

    const contrastResult = document.getElementById('contrastResult');
    contrastResult.innerHTML = `
        <h3>Contrast</h3>
        <div class="contrast-ratio">${contrastRatio.ratio.toFixed(2)}</div>
        <div class="contrast-rating">${contrastRatio.rating}</div>
        <div class="contrast-description">${contrastRatio.description}</div>
    `;
});

function generateGuideline(data) {
    const output = document.getElementById('guidelineOutput');
    output.innerHTML = ''; // Clear previous content

    const properties = parseData(data);

    console.log('Properties:', properties); // Debug: Show properties in console

    for (const category in properties) {
        const section = document.createElement('div');
        section.className = 'guideline-section';

        const title = document.createElement('h2');
        title.textContent = category;
        section.appendChild(title);

        properties[category].forEach(prop => {
            const propertyElement = document.createElement('div');
            propertyElement.className = 'property';

            const nameElement = document.createElement('div');
            nameElement.className = 'property-name';
            nameElement.textContent = prop.name;

            const valueElement = document.createElement('div');
            valueElement.className = 'property-value';
            valueElement.textContent = `${prop.value} (RGB: ${hexToRGB(prop.value)}, HSL: ${hexToHSL(prop.value)})`;

            if (category === 'Colors') {
                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = prop.value;

                const contrastRatio = calculateContrast(prop.value, '#ffffff'); // Assume white background for contrast ratio
                const ratioElement = document.createElement('div');
                ratioElement.className = 'contrast-ratio';
                ratioElement.textContent = `Contrast Ratio: ${contrastRatio.ratio.toFixed(2)} (${contrastRatio.rating})`;

                propertyElement.appendChild(colorBox);
                propertyElement.appendChild(ratioElement);
            }

            propertyElement.appendChild(nameElement);
            propertyElement.appendChild(valueElement);
            section.appendChild(propertyElement);
        });

        output.appendChild(section);
    }
}

function parseData(data) {
    const properties = {
        Colors: [],
        Typography: [],
        Spacing: [],
        Radius: [],
        Other: []
    };

    if (Array.isArray(data)) {
        data.forEach(item => {
            const { name, value } = item;
            categorizeProperty(properties, name, value);
        });
    } else if (typeof data === 'object') {
        for (const key in data) {
            const value = data[key];
            categorizeProperty(properties, key, value);
        }
    }

    return properties;
}

function categorizeProperty(properties, name, value) {
    if (name.includes('color')) {
        properties.Colors.push({ name, value });
    } else if (name.includes('font') || name.includes('line-height') || name.includes('letter-spacing')) {
        properties.Typography.push({ name, value });
    } else if (name.includes('spacing')) {
        properties.Spacing.push({ name, value });
    } else if (name.includes('radius')) {
        properties.Radius.push({ name, value });
    } else {
        properties.Other.push({ name, value });
    }
}

function parseCSS(content) {
    const properties = [];
    const regex = /--(bbt-[\w-]+):\s*([^;]+);/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        properties.push({ name: match[1], value: match[2] });
    }

    return properties;
}

function hexToRGB(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToHSL(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16) / 255;
        g = parseInt(hex.slice(3, 5), 16) / 255;
        b = parseInt(hex.slice(5, 7), 16) / 255;
    }
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return `hsl(${(h * 360).toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
}

function calculateContrast(hex1, hex2) {
    function luminance(r, g, b) {
        const a = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    const rgb1 = hexToRGB(hex1).match(/\d+/g).map(Number);
    const rgb2 = hexToRGB(hex2).match(/\d+/g).map(Number);

    const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);

    const ratio = lum1 > lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);

    const rating = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail';
    const description = ratio >= 7 ? 'Excellent contrast' : ratio >= 4.5 ? 'Good contrast' : ratio >= 3 ? 'Adequate contrast for large text' : 'Poor contrast';

    return {
        ratio,
        rating,
        description
    };
}

document.getElementById('textColor').addEventListener('input', handleColorInput);
document.getElementById('bgColor').addEventListener('input', handleColorInput);

function handleColorInput(event) {
    const colorValue = event.target.value;

    if (isValidHex(colorValue)) {
        event.target.value = colorValue;
    }
}

function isValidHex(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
}

function getWcagRating(contrastRatio) {
    if (contrastRatio >= 7) {
        return 'AAA';
    } else if (contrastRatio >= 4.5) {
        return 'AA';
    } else if (contrastRatio >= 3) {
        return 'AA (Large Text)';
    } else {
        return 'Fail';
    }
}

const contrastExplanation = document.createElement('div');
contrastExplanation.innerHTML = `
    <h3>How does it work?</h3>
    <p>This tool follows the Web Content Accessibility Guidelines (WCAG), which are a series of recommendations for making the web more accessible.</p>
    <p>Regarding colors, the standard defines two levels of contrast ratio: AA (minimum contrast) and AAA (enhanced contrast).</p>
    <p>The level AA requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (at least 18pt) or bold text.</p>
    <p>The level AAA requires a contrast ratio of at least 7:1 for normal text and 4.5:1 for large text or bold text.</p>
`;

document.querySelector('.contrast-checker').appendChild(contrastExplanation);