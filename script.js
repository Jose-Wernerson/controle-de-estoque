document.getElementById("add-product-button").addEventListener("click", addProduct);
document.getElementById("start-scan-button").addEventListener("click", startBarcodeScanner);
document.getElementById("toggle-visibility-button").addEventListener("click", toggleProductVisibility);
document.getElementById("search-button").addEventListener("click", searchProducts);

let productList = JSON.parse(localStorage.getItem('productList')) || [];
let isProductListVisible = true;

function addProduct() {
    const productName = document.getElementById("product-name").value;
    const productQuantity = document.getElementById("product-quantity").value;
    const expiryDate = document.getElementById("expiry-date").value;

    if (productName && productQuantity && expiryDate) {
        const product = {
            name: productName,
            quantity: parseInt(productQuantity),
            expiryDates: [{ date: expiryDate, quantity: parseInt(productQuantity) }]
        };

        const existingProduct = productList.find(p => p.name === productName);

        if (existingProduct) {
            existingProduct.quantity += product.quantity;
            const existingExpiryDate = existingProduct.expiryDates.find(ed => ed.date === expiryDate);
            if (existingExpiryDate) {
                existingExpiryDate.quantity += product.quantity;
            } else {
                existingProduct.expiryDates.push({ date: expiryDate, quantity: parseInt(productQuantity) });
            }
        } else {
            productList.push(product);
        }

        saveProductList();
        renderProductList();
        checkExpiryDate(productName, expiryDate);
        checkStock(productName, product.quantity);
    }
}

function saveProductList() {
    localStorage.setItem('productList', JSON.stringify(productList));
}

function renderProductList() {
    const productListElement = document.getElementById("product-list");
    productListElement.innerHTML = "";

    productList.forEach(product => {
        const expiringInfo = product.expiryDates.map(ed => {
            const currentDate = new Date();
            const expiry = new Date(ed.date);
            const timeDifference = expiry - currentDate;
            const daysDifference = timeDifference / (1000 * 3600 * 24);

            const color = daysDifference <= 90 ? 'red' : 'black';
            return `<span style="color: ${color};">${ed.date} (Estoque: ${ed.quantity})</span>`;
        }).join(', ');

        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${product.name}</strong> - Quantidade: ${product.quantity} - Validades: ${expiringInfo}
            <button onclick="removeProduct('${product.name}')">Remover</button>
            ${product.expiryDates.map(ed => `
                <button onclick="removeExpiredProduct('${product.name}', '${ed.date}')">Remover Produto com Validade ${ed.date}</button>
            `).join('')}
        `;
        productListElement.appendChild(li);
    });

    countExpiringProducts(); // Chama a função para contar produtos próximos da validade
}

function removeProduct(productName) {
    productList = productList.filter(product => product.name !== productName);
    saveProductList();
    renderProductList();
}

function removeExpiredProduct(productName, expiryDate) {
    const product = productList.find(p => p.name === productName);
    if (product) {
        const expiryDateEntry = product.expiryDates.find(ed => ed.date === expiryDate);
        if (expiryDateEntry) {
            product.quantity -= expiryDateEntry.quantity;
            product.expiryDates = product.expiryDates.filter(ed => ed.date !== expiryDate);
            if (product.quantity <= 0) {
                productList = productList.filter(p => p.name !== productName);
            }
            saveProductList();
            renderProductList();
        }
    }
}

function checkExpiryDate(productName, expiryDate) {
    const currentDate = new Date();
    const expiry = new Date(expiryDate);
    const timeDifference = expiry - currentDate;
    const daysDifference = timeDifference / (1000 * 3600 * 24);

    if (daysDifference <= 90) {
        alert(`O produto ${productName} está próximo da validade!`);
    }
}

function checkStock(productName, productQuantity) {
    const product = productList.find(p => p.name === productName);

    if (product && product.quantity <= 5) {
        alert(`O produto ${productName} está com o estoque baixo!`);
    }
}

function countExpiringProducts() {
    const currentDate = new Date();
    let expiringCount = 0;

    productList.forEach(product => {
        product.expiryDates.forEach(expiryDate => {
            const expiry = new Date(expiryDate.date);
            const timeDifference = expiry - currentDate;
            const daysDifference = timeDifference / (1000 * 3600 * 24);

            if (daysDifference <= 90) {
                expiringCount += expiryDate.quantity;
            }
        });
    });

    alert(`Total de produtos próximos da validade: ${expiringCount}`);
}

function startBarcodeScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#barcode-video'),
            constraints: {
                width: 300,
                height: 200,
                facingMode: "environment"
            }
        },
        decoder: {
            readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader", "i2of5_reader"]
        }
    }, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Initialization finished. Ready to start");
        Quagga.start();
    });

    Quagga.onDetected(function (data) {
        console.log(data);
        const barcode = data.codeResult.code;
        alert(`Código de barras lido: ${barcode}`);

        // Aqui você pode buscar as informações do produto (nome, quantidade, validade) com base no código de barras lido
        // Por simplicidade, vamos apenas adicionar um produto genérico
        document.getElementById("product-name").value = "Produto Exemplo";
        document.getElementById("product-quantity").value = 10;
        document.getElementById("expiry-date").value = "2025-12-31";
    });
}

function toggleProductVisibility() {
    const productListElement = document.getElementById("product-list");
    if (isProductListVisible) {
        productListElement.style.display = 'none';
    } else {
        productListElement.style.display = 'block';
    }
    isProductListVisible = !isProductListVisible;
}

function searchProducts() {
    const searchTerm = document.getElementById("search-term").value.toLowerCase();
    const productListElement = document.getElementById("product-list");
    productListElement.innerHTML = "";

    productList.filter(product => product.name.toLowerCase().includes(searchTerm))
        .forEach(product => {
            const expiringInfo = product.expiryDates.map(ed => {
                const currentDate = new Date();
                const expiry = new Date(ed.date);
                const timeDifference = expiry - currentDate;
                const daysDifference = timeDifference / (1000 * 3600 * 24);

                const color = daysDifference <= 90 ? 'red' : 'black';
                return `<span style="color: ${color};">${ed.date} (Estoque: ${ed.quantity})</span>`;
            }).join(', ');
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${product.name}</strong> - Quantidade: ${product.quantity} - Validades: ${expiringInfo}
                <button onclick="removeProduct('${product.name}')">Remover</button>
                ${product.expiryDates.map(ed => `
                    <button onclick="removeExpiredProduct('${product.name}', '${ed.date}')">Remover Produto com Validade ${ed.date}</button>
                `).join('')}
            `;
            productListElement.appendChild(li);
        });
}
