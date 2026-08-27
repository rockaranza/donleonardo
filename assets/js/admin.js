import { db, auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showModal } from './modal.js';

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const productForm = document.getElementById('product-form');
const pId = document.getElementById('product-id');
const pTitle = document.getElementById('p-title');
const pDesc = document.getElementById('p-desc');
const pPrice = document.getElementById('p-price');
const pCategory = document.getElementById('p-category');
const pStatus = document.getElementById('p-status');
const pOfferPrice = document.getElementById('p-offer-price');
const pImageFile = document.getElementById('p-image-file');
const pImageUrl = document.getElementById('p-image-url');

const pUnitType = document.getElementById('p-unit-type');
const pPresentation = document.getElementById('p-presentation');

const formTitle = document.getElementById('form-title');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const saveProductBtn = document.getElementById('save-product-btn');
const adminProductsList = document.getElementById('admin-products-list');

const phoneInput = document.getElementById('phone-number');
const instagramInput = document.getElementById('instagram-user');
const emailInput = document.getElementById('email-address');
const disabledRadios = document.getElementsByName('store-disabled');
const disabledWarning = document.getElementById('store-disabled-warning');
const dayBtns = document.querySelectorAll('.day-btn');
const timeStart = document.getElementById('time-start');
const timeEnd = document.getElementById('time-end');
const saveInfoBtn = document.getElementById('save-info-btn');

const newCategoryInput = document.getElementById('new-category-input');
const addCategoryBtn = document.getElementById('add-category-btn');
const adminCategoriesList = document.getElementById('admin-categories-list');

// Promo Elements
const promoForm = document.getElementById('promo-form');
const promoTitle = document.getElementById('promo-title');
const promoDesc = document.getElementById('promo-desc');
const promoMessage = document.getElementById('promo-message');
const promoImageFile = document.getElementById('promo-image-file');
const promoImageUrl = document.getElementById('promo-image-url');
const promoCurrentImageContainer = document.getElementById('promo-current-image-container');
const promoCurrentImage = document.getElementById('promo-current-image');
const savePromoBtn = document.getElementById('save-promo-btn');
const promoRadios = document.getElementsByName('promo-active');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const adminSections = document.querySelectorAll('.admin-section');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        adminSections.forEach(sec => sec.classList.add('hidden'));
        
        const targetId = btn.dataset.target;
        document.getElementById(targetId).classList.remove('hidden');
    });
});

let currentCategories = [];

pStatus.addEventListener('change', () => {
    if (pStatus.value === 'oferta') {
        pOfferPrice.classList.remove('hidden');
        pOfferPrice.required = true;
    } else {
        pOfferPrice.classList.add('hidden');
        pOfferPrice.required = false;
        pOfferPrice.value = '';
    }
});

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        loadConfig();
        loadPromo();
        loadCategories();
        loadProducts();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        if (loginError) loginError.classList.add('hidden');
    } catch (error) {
        if (loginError) loginError.classList.remove('hidden');
        else await showModal("Error al iniciar sesión.", "alert", "Error");
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Day selection logic
dayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

// Radio listeners for instant feedback
disabledRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (document.querySelector('input[name="store-disabled"]:checked').value === 'yes') {
            disabledWarning.classList.remove('hidden');
        } else {
            disabledWarning.classList.add('hidden');
        }
    });
});

// Config (General)
async function loadConfig() {
    const configSnap = await getDoc(doc(db, "config", "info"));
    if (configSnap.exists()) {
        const data = configSnap.data();
        if (data.phone) phoneInput.value = data.phone;
        if (data.instagram) instagramInput.value = data.instagram;
        if (data.email) emailInput.value = data.email;
        if (data.timeStart) timeStart.value = data.timeStart;
        if (data.timeEnd) timeEnd.value = data.timeEnd;
        
        let isStoreActive = true;
        if (data.hasOwnProperty('storeActive')) {
            isStoreActive = data.storeActive;
        }
        
        if (!isStoreActive) {
            document.querySelector('input[name="store-disabled"][value="yes"]').checked = true;
            disabledWarning.classList.remove('hidden');
        } else {
            document.querySelector('input[name="store-disabled"][value="no"]').checked = true;
            disabledWarning.classList.add('hidden');
        }
        
        if (data.days && Array.isArray(data.days)) {
            dayBtns.forEach(btn => {
                if (data.days.includes(btn.dataset.day)) {
                    btn.classList.add('active');
                }
            });
        }
    } else {
        const oldSnap = await getDoc(doc(db, "config", "whatsapp"));
        if (oldSnap.exists()) {
            phoneInput.value = oldSnap.data().number;
        }
    }
}

saveInfoBtn.addEventListener('click', async () => {
    const selectedDays = [];
    dayBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            selectedDays.push(btn.dataset.day);
        }
    });

    const isDeactivated = document.querySelector('input[name="store-disabled"]:checked').value === 'yes';

    const infoData = {
        storeActive: !isDeactivated,
        phone: phoneInput.value.trim(),
        instagram: instagramInput.value.trim(),
        email: emailInput.value.trim(),
        days: selectedDays,
        timeStart: timeStart.value,
        timeEnd: timeEnd.value
    };

    try {
        saveInfoBtn.disabled = true;
        saveInfoBtn.textContent = 'Guardando...';
        await setDoc(doc(db, "config", "info"), infoData);
        await showModal("Configuración guardada exitosamente.", "alert", "Éxito");
    } catch (e) {
        await showModal("Error al guardar: " + e.message, "alert", "Error");
    } finally {
        saveInfoBtn.disabled = false;
        saveInfoBtn.textContent = 'Guardar Configuración General';
    }
});

// Promo Logic
async function loadPromo() {
    const promoSnap = await getDoc(doc(db, "config", "promo"));
    if (promoSnap.exists()) {
        const data = promoSnap.data();
        if (data.active) {
            document.querySelector('input[name="promo-active"][value="yes"]').checked = true;
        } else {
            document.querySelector('input[name="promo-active"][value="no"]').checked = true;
        }
        
        promoTitle.value = data.title || '';
        promoDesc.value = data.desc || '';
        promoMessage.value = data.message || '';
        
        if (data.image) {
            promoImageUrl.value = data.image;
            promoCurrentImage.src = data.image;
            promoCurrentImageContainer.classList.remove('hidden');
        }
    }
}

promoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    savePromoBtn.disabled = true;
    savePromoBtn.textContent = 'Guardando...';

    const isActive = document.querySelector('input[name="promo-active"]:checked').value === 'yes';
    let finalImageUrl = promoImageUrl.value; 

    const file = promoImageFile.files[0];
    if (file) {
        try {
            finalImageUrl = await compressImage(file);
        } catch (error) {
            await showModal("Error al procesar la imagen de promo: " + error.message, 'alert', 'Error');
            savePromoBtn.disabled = false;
            savePromoBtn.textContent = 'Guardar Promoción';
            return;
        }
    }

    const promoData = {
        active: isActive,
        title: promoTitle.value,
        desc: promoDesc.value,
        message: promoMessage.value.trim(),
        image: finalImageUrl
    };

    try {
        await setDoc(doc(db, "config", "promo"), promoData);
        if (finalImageUrl) {
            promoCurrentImage.src = finalImageUrl;
            promoCurrentImageContainer.classList.remove('hidden');
            promoImageUrl.value = finalImageUrl;
        }
        promoImageFile.value = '';
        await showModal("Promoción guardada exitosamente.", "alert", "Éxito");
    } catch (e) {
        await showModal("Error al guardar promoción: " + e.message, "alert", "Error");
    } finally {
        savePromoBtn.disabled = false;
        savePromoBtn.textContent = 'Guardar Promoción';
    }
});

// Categorías
async function loadCategories() {
    try {
        const docRef = doc(db, "config", "categorias");
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            currentCategories = snap.data().lista || [];
        } else {
            currentCategories = ['vacuno', 'cerdo', 'pollo', 'embutidos', 'otros'];
            await setDoc(docRef, { lista: currentCategories });
        }
    } catch (error) {
        console.error("Error cargando categorías:", error);
        currentCategories = ['vacuno', 'cerdo', 'pollo', 'embutidos', 'otros'];
        await showModal("No se pudieron cargar las categorías desde la base de datos. Usando las por defecto.", 'alert', 'Error de Conexión');
    }
    
    renderCategoriesAdmin();
}

function renderCategoriesAdmin() {
    adminCategoriesList.innerHTML = '';
    currentCategories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'admin-item';
        div.style.padding = '0.5rem 1rem';
        div.innerHTML = `
            <span>${cat}</span>
            <button class="btn-danger btn-sm" onclick="deleteCategory('${cat}')">Borrar</button>
        `;
        adminCategoriesList.appendChild(div);
    });

    pCategory.innerHTML = '<option value="" disabled selected>Selecciona una categoría</option>';
    currentCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        pCategory.appendChild(opt);
    });
}

window.deleteCategory = async function(categoryToDelete) {
    const q = query(collection(db, "productos"), where("category", "==", categoryToDelete));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        await showModal("Antes debe eliminar los productos de esta categoría.", 'alert', 'Atención');
        return;
    }
    
    const confirmDelete = await showModal(`¿Seguro que quieres borrar la categoría "${categoryToDelete}"?`, 'confirm', '¿Borrar Categoría?');
    if (confirmDelete) {
        currentCategories = currentCategories.filter(c => c !== categoryToDelete);
        await setDoc(doc(db, "config", "categorias"), { lista: currentCategories });
        renderCategoriesAdmin();
    }
};

addCategoryBtn.addEventListener('click', async () => {
    let newCat = newCategoryInput.value.trim().toLowerCase();
    if (!newCat) return;
    
    if (currentCategories.includes(newCat)) {
        await showModal("La categoría ya existe", 'alert', 'Atención');
        return;
    }
    
    currentCategories.push(newCat);
    await setDoc(doc(db, "config", "categorias"), { lista: currentCategories });
    newCategoryInput.value = '';
    renderCategoriesAdmin();
    await showModal("Categoría '" + newCat + "' creada exitosamente.", 'alert', 'Éxito');
});


// CRUD Products
async function loadProducts() {
    adminProductsList.innerHTML = 'Cargando...';
    const querySnapshot = await getDocs(collection(db, "productos"));
    adminProductsList.innerHTML = '';
    
    querySnapshot.forEach((doc) => {
        const p = doc.data();
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-info">
                <img src="${p.image}" alt="Img">
                <div>
                    <h4>${p.title}</h4>
                    <p>${p.price} | ${p.category} | Estado: ${p.status || 'Normal'}</p>
                </div>
            </div>
            <div class="admin-actions">
                <button class="btn-outline edit-btn" data-id="${doc.id}">Editar</button>
                <button class="btn-danger delete-btn" data-id="${doc.id}">Borrar</button>
            </div>
        `;
        adminProductsList.appendChild(item);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editProduct(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
    });
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveProductBtn.disabled = true;
    saveProductBtn.textContent = 'Guardando...';

    let finalImageUrl = pImageUrl.value; 

    const file = pImageFile.files[0];
    if (file) {
        try {
            finalImageUrl = await compressImage(file);
        } catch (error) {
            await showModal("Error al procesar la imagen: " + error.message, 'alert', 'Error');
            saveProductBtn.disabled = false;
            saveProductBtn.textContent = 'Guardar Producto';
            return;
        }
    } else if (!finalImageUrl) {
        await showModal("Debes seleccionar una imagen para el producto.", 'alert', 'Atención');
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = 'Guardar Producto';
        return;
    }

    const productData = {
        title: pTitle.value,
        desc: pDesc.value,
        unitType: pUnitType.value,
        presentation: pPresentation.value,
        price: pPrice.value,
        category: pCategory.value,
        status: pStatus.value,
        offerPrice: pOfferPrice.value,
        image: finalImageUrl
    };

    try {
        if (pId.value) {
            await updateDoc(doc(db, "productos", pId.value), productData);
        } else {
            await addDoc(collection(db, "productos"), productData);
        }
        resetForm();
        loadProducts();
    } catch (error) {
        await showModal("Error al guardar producto: " + error.message, 'alert', 'Error');
    }
    
    saveProductBtn.disabled = false;
    saveProductBtn.textContent = 'Guardar Producto';
});

async function editProduct(id) {
    const docSnap = await getDoc(doc(db, "productos", id));
    if (docSnap.exists()) {
        const p = docSnap.data();
        pId.value = id;
        pTitle.value = p.title;
        pDesc.value = p.desc;
        pUnitType.value = p.unitType || '';
        pPresentation.value = p.presentation || '';
        pPrice.value = p.price;
        pCategory.value = p.category;
        
        pStatus.value = p.status || 'normal';
        pStatus.dispatchEvent(new Event('change')); 
        pOfferPrice.value = p.offerPrice || '';
        
        pImageUrl.value = p.image;
        
        formTitle.textContent = "Editar Producto (Deja la imagen vacía si no quieres cambiarla)";
        cancelEditBtn.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function deleteProduct(id) {
    const confirmDelete = await showModal("¿Seguro que quieres borrar este producto?", 'confirm', '¿Borrar Producto?');
    if (confirmDelete) {
        await deleteDoc(doc(db, "productos", id));
        loadProducts();
    }
}

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    pId.value = '';
    pUnitType.value = '';
    pPresentation.value = '';
    pImageUrl.value = '';
    formTitle.textContent = "Agregar Nuevo Producto";
    cancelEditBtn.classList.add('hidden');
    pStatus.dispatchEvent(new Event('change'));
}
