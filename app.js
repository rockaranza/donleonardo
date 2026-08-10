import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('products-grid');
    const categoryFilters = document.getElementById('category-filters');
    
    let phoneNumber = ""; 
    let allProducts = [];

    const storeView = document.getElementById('store-view');
    const restingView = document.getElementById('resting-view');
    const storeInfoFooter = document.getElementById('store-info-footer');
    const storeInstagramText = document.getElementById('store-instagram-text');
    const storeHoursText = document.getElementById('store-hours-text');

    // 1. Cargar config info (WhatsApp, Instagram, Horarios)
    try {
        const configSnap = await getDoc(doc(db, "config", "info"));
        if (configSnap.exists()) {
            const data = configSnap.data();

            // Modo Descanso
            if (data.hasOwnProperty('storeActive') && data.storeActive === false) {
                if(storeView) storeView.remove(); // Elimina todo el HTML de la tienda de la memoria
                if(restingView) restingView.classList.remove('hidden');
                return; // Detiene la ejecución del código, no se cargan productos
            }

            if (data.phone) {
                phoneNumber = data.phone;
            }
            
            let hasInfo = false;
            
            if (data.instagram) {
                // Limpiar el @ si lo pusieron
                const user = data.instagram.replace('@', '');
                storeInstagramText.innerHTML = `📷 Síguenos en Instagram: <a href="https://instagram.com/${user}" target="_blank">@${user}</a>`;
                hasInfo = true;
            } else {
                storeInstagramText.style.display = 'none';
            }
            
            if (data.days && data.days.length > 0 && data.timeStart && data.timeEnd) {
                storeHoursText.innerHTML = `⏰ Horario de atención: <strong>${data.days.join(', ')}</strong> de ${data.timeStart} a ${data.timeEnd}`;
                hasInfo = true;
            } else {
                storeHoursText.style.display = 'none';
            }
            
            if (hasInfo) {
                storeInfoFooter.classList.remove('hidden');
            }
            
        } else {
            // Fallback para mantener retrocompatibilidad temporal si ya había un numero viejo
            const oldSnap = await getDoc(doc(db, "config", "whatsapp"));
            if (oldSnap.exists() && oldSnap.data().number) {
                phoneNumber = oldSnap.data().number;
            }
        }
    } catch (error) {
        console.error("Error config:", error);
    }

    // 2. Cargar Categorías Dinámicas
    try {
        const catSnap = await getDoc(doc(db, "config", "categorias"));
        if (catSnap.exists()) {
            const categories = catSnap.data().lista || [];
            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn';
                btn.dataset.filter = cat;
                // Capitalizar primera letra
                btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
                categoryFilters.appendChild(btn);
            });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
    }

    // Attach listeners a los botones de categoría (incluyendo el "Todos" por defecto)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            if (filter === 'all') {
                renderProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p => p.category === filter);
                renderProducts(filtered);
            }
        });
    });

    // 3. Cargar Productos
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        querySnapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        renderProducts(allProducts);
    } catch (error) {
        productsGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1; color: red;">Error al cargar los productos.</p>';
    }

    function renderProducts(productsToRender) {
        productsGrid.innerHTML = ''; 

        if (productsToRender.length === 0) {
            productsGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">No hay productos en esta categoría.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const article = document.createElement('article');
            article.className = 'product-card';
            article.dataset.category = product.category;

            let badgeHtml = '';
            let priceHtml = `<p class="product-price">${product.price}</p>`;
            let imageClass = 'product-image';
            let btnText = 'Lo Quiero 💖';
            let btnDisabled = '';

            if (product.status === 'nuevo') {
                badgeHtml = `<span class="badge">Nuevo</span>`;
            } else if (product.status === 'oferta') {
                badgeHtml = `<span class="badge badge-oferta">Oferta</span>`;
                priceHtml = `
                    <p class="product-price">
                        <span class="old-price">${product.price}</span> 
                        <span class="new-price">${product.offerPrice}</span>
                    </p>`;
            } else if (product.status === 'agotado') {
                badgeHtml = `<span class="badge badge-agotado">Agotado</span>`;
                imageClass += ' sold-out';
                btnText = 'Agotado 🚫';
                btnDisabled = 'disabled';
            }

            article.innerHTML = `
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${product.title}" class="${imageClass}">
                    ${badgeHtml}
                </div>
                <div class="product-info">
                    <h2 class="product-title">${product.title}</h2>
                    <p class="product-desc">${product.desc}</p>
                    ${priceHtml}
                    <button class="btn-whatsapp" data-product="${product.title}" data-price="${product.status === 'oferta' ? product.offerPrice : product.price}" ${btnDisabled}>
                        ${btnText}
                    </button>
                </div>
            `;
            productsGrid.appendChild(article);
        });

        attachWhatsAppListeners();
    }

    function attachWhatsAppListeners() {
        const whatsappButtons = document.querySelectorAll('.btn-whatsapp');
        
        whatsappButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                if (!phoneNumber) {
                    await showModal("Estamos preparandos para comenzar a vender, vuelve pronto.", 'alert', '¡Próximamente! 🎀');
                    return;
                }
                
                const product = e.currentTarget.dataset.product;
                const price = e.currentTarget.dataset.price;
                
                const message = `¡Hola Amanda's Store! 💖 Me encantaría comprar el "${product}" que cuesta ${price}. ¿Aún lo tienes disponible? ✨`;
                const encodedMessage = encodeURIComponent(message);
                
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
            });
        });
    }
});
