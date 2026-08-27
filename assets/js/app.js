import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';

document.addEventListener('DOMContentLoaded', async () => {
    const productsGrid = document.getElementById('products-grid');
    const categoryFilters = document.getElementById('category-filters');
    
    let phoneNumber = ""; 
    let allProducts = [];

    const storeView = document.getElementById('store-view');
    const header = document.querySelector('.header');

    // Sticky header logic
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Desktop Search Logic
    const desktopSearchBtn = document.getElementById('desktop-search-btn');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');

    if (desktopSearchBtn && searchContainer) {
        desktopSearchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchContainer.classList.toggle('active');
            if (searchContainer.classList.contains('active')) {
                searchInput.focus();
            }
        });

        // Close search when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target) && searchContainer.classList.contains('active')) {
                searchContainer.classList.remove('active');
            }
        });
    }

    // Bottom Sheet Logic
    const headerControls = document.getElementById('header-controls');
    const bottomSheetOverlay = document.getElementById('bottom-sheet-overlay');
    const closeSheetBtn = document.getElementById('close-sheet-btn');
    const fabFilter = document.getElementById('fab-filter');

    // Fix iOS fixed position bug by moving headerControls out of sticky header on mobile
    function moveControls() {
        if (!headerControls || !header) return;
        
        if (window.innerWidth >= 768) {
            if (headerControls.parentElement !== header) {
                header.appendChild(headerControls);
            }
        } else {
            if (headerControls.parentElement === header) {
                document.body.appendChild(headerControls);
            }
        }
    }
    window.addEventListener('resize', moveControls);
    moveControls(); // Run on load

    function openBottomSheet() {
        if (headerControls && bottomSheetOverlay) {
            headerControls.classList.add('open');
            bottomSheetOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeBottomSheet() {
        if (headerControls && bottomSheetOverlay) {
            headerControls.classList.remove('open');
            bottomSheetOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    if (fabFilter) fabFilter.addEventListener('click', openBottomSheet);
    if (closeSheetBtn) closeSheetBtn.addEventListener('click', closeBottomSheet);
    if (bottomSheetOverlay) bottomSheetOverlay.addEventListener('click', closeBottomSheet);

    // Escuchar cambios en la configuración en tiempo real (para la vista de descanso)
    onSnapshot(doc(db, "config", "info"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.hasOwnProperty('storeActive') && data.storeActive === false) {
                // Redirigir a descanso.html
                window.location.replace('descanso.html');
            }
        }
    });

    // Promo Modal Logic
    const promoModal = document.getElementById('promo-modal');
    const promoCloseBtn = document.getElementById('promo-close-btn');
    const promoActionBtn = document.getElementById('promo-action-btn');
    const promoImg = document.getElementById('promo-img');
    const promoTitleEl = document.getElementById('promo-title');
    const promoDescEl = document.getElementById('promo-desc');

    function closePromoModal() {
        promoModal.classList.remove('show');
    }

    if (promoCloseBtn && promoActionBtn && promoModal) {
        promoCloseBtn.addEventListener('click', closePromoModal);
        
        promoActionBtn.addEventListener('click', () => {
            const customMessage = promoActionBtn.dataset.message;
            if (customMessage) {
                if (phoneNumber) {
                    const encodedMessage = encodeURIComponent(customMessage);
                    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                }
            }
            closePromoModal();
        });
        
        promoModal.addEventListener('click', (e) => {
            if (e.target === promoModal) closePromoModal();
        });

        onSnapshot(doc(db, "config", "promo"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.active) {
                    promoTitleEl.textContent = data.title || '';
                    promoDescEl.textContent = data.desc || '';
                    
                    if (data.image) {
                        promoImg.src = data.image;
                        promoImg.classList.remove('hidden');
                    } else {
                        promoImg.classList.add('hidden');
                    }
                    
                    if (data.message) {
                        promoActionBtn.textContent = 'Me interesa';
                        promoActionBtn.dataset.message = data.message;
                    } else {
                        promoActionBtn.textContent = 'Cerrar';
                        promoActionBtn.dataset.message = '';
                    }
                    
                    // Mostrar el modal inmediatamente
                    promoModal.classList.add('show');
                }
            }
        });
    }

    // 1. Cargar config info (WhatsApp, Instagram, Horarios)
    try {
        const configSnap = await getDoc(doc(db, "config", "info"));
        if (configSnap.exists()) {
            const data = configSnap.data();

            if (data.phone) {
                phoneNumber = data.phone;
            }

            if (data.instagram) {
                const user = data.instagram.replace('@', '');
                document.getElementById('footer-instagram-link').href = `https://instagram.com/${user}`;
                document.getElementById('footer-instagram-link').textContent = `@${user}`;
                document.getElementById('footer-instagram-container').style.display = 'flex';
            } else {
                document.getElementById('footer-instagram-container').style.display = 'none';
            }

            if (data.email) {
                document.getElementById('footer-email-link').href = `mailto:${data.email}`;
                document.getElementById('footer-email-link').textContent = data.email;
                document.getElementById('footer-email-container').style.display = 'flex';
            } else {
                document.getElementById('footer-email-container').style.display = 'none';
            }

            if (data.days && data.days.length > 0 && data.timeStart && data.timeEnd) {
                document.getElementById('footer-hours-text').innerHTML = `<strong>${data.days.join(', ')}</strong><br>${data.timeStart} a ${data.timeEnd}`;
                document.getElementById('footer-hours-container').style.display = 'flex';
            } else {
                document.getElementById('footer-hours-container').style.display = 'none';
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
    // Usamos event delegation en el contenedor padre
    const searchInput = document.getElementById('search-input');
    let currentFilter = 'all';

    function applyFilters() {
        const query = searchInput.value.toLowerCase().trim();
        let filtered = allProducts;
        
        if (currentFilter !== 'all') {
            filtered = filtered.filter(p => p.category === currentFilter);
        }
        
        if (query) {
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(query) || 
                p.desc.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
        }
        
        // Ordenar destacados primero
        filtered.sort((a, b) => {
            if (a.status === 'destacado' && b.status !== 'destacado') return -1;
            if (a.status !== 'destacado' && b.status === 'destacado') return 1;
            return 0;
        });
        
        renderProducts(filtered);
    }

    categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            applyFilters();
            closeBottomSheet();
        }
    });

    searchInput.addEventListener('input', () => {
        applyFilters();
    });

    // 3. Cargar Productos
    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        querySnapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        applyFilters();
    } catch (error) {
        console.error("Error al cargar productos", error);
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

            const priceWithUnit = product.unitType ? `${product.price} / ${product.unitType}` : product.price;
            let presentationHtml = '';
            if (product.presentation) {
                presentationHtml = `<p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1.5rem;">${product.presentation}</p>`;
            } else {
                presentationHtml = `<p style="margin-bottom: 1.5rem;"></p>`;
            }

            let badgeHtml = '';
            let priceHtml = `
                <p class="product-price" style="margin-bottom: 0.2rem;">${priceWithUnit}</p>
                ${presentationHtml}
            `;
            let imageClass = 'product-image';
            let btnText = 'Me interesa';
            let btnDisabled = '';

            if (product.status === 'nuevo') {
                badgeHtml = `<span class="badge">Nuevo</span>`;
            } else if (product.status === 'destacado') {
                badgeHtml = `<span class="badge badge-destacado">★ Destacado</span>`;
                article.classList.add('product-destacado');
            } else if (product.status === 'oferta') {
                const offerPriceWithUnit = product.unitType ? `${product.offerPrice} / ${product.unitType}` : product.offerPrice;
                badgeHtml = `<span class="badge badge-oferta">Oferta</span>`;
                priceHtml = `
                    <p class="product-price" style="margin-bottom: 0.2rem;">
                        <span class="old-price">${product.price}</span> 
                        <span class="new-price">${offerPriceWithUnit}</span>
                    </p>
                    ${presentationHtml}`;
            } else if (product.status === 'agotado') {
                badgeHtml = `<span class="badge badge-agotado">Agotado</span>`;
                imageClass += ' sold-out';
                btnText = 'Agotado';
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
        attachScrollObserver();
    }

    function attachScrollObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Small delay based on index for a staggered effect if multiple appear at once
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 50);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.product-card:not(.visible)').forEach(card => {
            observer.observe(card);
        });
    }

    function attachWhatsAppListeners() {
        const whatsappButtons = document.querySelectorAll('.btn-whatsapp');
        
        whatsappButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                if (!phoneNumber) {
                    await showModal("Estamos preparándonos para comenzar a vender, vuelve pronto.", 'alert', 'Próximamente');
                    return;
                }
                
                const product = e.currentTarget.dataset.product;
                const price = e.currentTarget.dataset.price;
                
                const message = `Hola Don Leonardo. Me interesa comprar "${product}" que cuesta ${price}. ¿Aún lo tienen disponible?`;
                const encodedMessage = encodeURIComponent(message);
                
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
            });
        });
    }
});
