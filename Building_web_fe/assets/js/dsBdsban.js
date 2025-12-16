// ===================================================
// CẤU HÌNH & BIẾN TOÀN CỤC
// ===================================================
const API_BASE_URL = 'http://localhost:8081/api';
const API_FAVORITE_URL = `${API_BASE_URL}/yeuthich`; 

let fullFavoriteList = [];

let bdsList = []; 
const pageSize = 12; 
let currentPage = 1;
let currentFilters = {};
let listYeuThichFull = [];
// Set lưu trữ các ID bất động sản đã thả tim
let likedPropertyIds = new Set(); 
let globalFavoriteList = [];
// ===================================================
// HELPER FUNCTIONS (ĐỊNH DẠNG & UI)
// ===================================================
function formatPrice(price) {
    if (!price) return "Thỏa thuận";
    if (typeof price === 'number') {
        return price >= 1000000000 
            ? (price / 1000000000).toFixed(1).replace('.0', '') + " tỷ"
            : (price / 1000000).toFixed(0) + " triệu";
    }
    return price;
}

// Hàm render danh sách bên trong dropdown header
function renderFavoritesDropdown() {
    const listContainer = document.getElementById('fav-list-items');
    // Nếu chưa có authSection hoặc html chưa render xong thì bỏ qua
    if (!listContainer) return; 

    listContainer.innerHTML = ''; // Xóa danh sách cũ

    if (likedPropertyIds.size === 0) {
        listContainer.innerHTML = '<li class="p-3 text-center text-muted small">Bạn chưa lưu tin nào.</li>';
        return;
    }

    // LƯU Ý: Ở File 1, bdsList chỉ chứa 12 tin của trang hiện tại.
    // Để hiển thị đúng tất cả tin đã thích, bạn cần logic phức tạp hơn (tải cache tất cả tin).
    // Tạm thời code này chỉ hiển thị những tin ĐANG CÓ trong bdsList mà được tim.
    const likedItems = bdsList.filter(item => {
        const id = item.id || item.maBds;
        return likedPropertyIds.has(Number(id));
    });

    if (likedItems.length === 0) {
        // Trường hợp đã tim nhưng tin đó nằm ở trang khác (không có trong bdsList hiện tại)
        listContainer.innerHTML = '<li class="p-3 text-center text-muted small">Xem tất cả trong trang quản lý.</li>';
        return;
    }

    likedItems.forEach(item => {
        const id = item.id || item.maBds;
        const imgUrl = item.anhChinh ? item.anhChinh : 'https://via.placeholder.com/60x40';
        const price = formatPrice(item.gia || item.giaTien);
        
        // Tạo HTML cho từng item
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="javascript:void(0)" onclick="viewBds(${id})" class="d-flex align-items-center p-2 text-decoration-none border-bottom">
                <img src="${imgUrl}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;" class="rounded">
                <div class="fav-info" style="overflow: hidden;">
                    <div class="fw-bold text-dark text-truncate" style="font-size: 14px;">${item.tieuDe}</div>
                    <div class="text-danger small fw-bold">${price}</div>
                </div>
            </a>
        `;
        listContainer.appendChild(li);
    });
}
// Cập nhật số lượng tim trên Header
function updateHeaderCount() {
    const count = likedPropertyIds.size;
    const badge = document.getElementById('fav-count'); 
    
    if (badge) {
        badge.textContent = count;
        // Nếu có tim thì hiện badge, không thì ẩn
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    renderFavoritesDropdown();
}

// ===================================================
// 1. LOAD DANH SÁCH BẤT ĐỘNG SẢN & DANH SÁCH YÊU THÍCH
// ===================================================
async function loadBds(filters = {}) {
    // Hiển thị loading
    const spinner = document.getElementById('loading-spinner-ds');
    const container = document.getElementById('bds-container');
    if(spinner) spinner.classList.remove('d-none');
    if(container) container.classList.add('d-none');

    currentFilters = { ...filters }; 
    const queryParams = new URLSearchParams();

    // Xây dựng filters
    for (const key in currentFilters) {
        if (currentFilters[key] !== null && currentFilters[key] !== undefined && currentFilters[key] !== "") {
            if (key === 'loaiBds' && currentFilters[key] === 'all') continue; 
            if (key === 'trangThai' && currentFilters[key] === 'all') continue; 
            queryParams.append(key, currentFilters[key]);
        }
    }

    const API_URL = `${API_BASE_URL}/search?${queryParams.toString()}`;
    const token = localStorage.getItem('access_token');

    try {
        // --- Gọi song song API BĐS và API Yêu thích ---
        const fetchBdsPromise = fetch(API_URL);
        const fetchFavPromise = token 
            ? fetch(API_FAVORITE_URL, { headers: { 'Authorization': 'Bearer ' + token } }) 
            : Promise.resolve(null);

        const [responseBds, responseFav] = await Promise.all([fetchBdsPromise, fetchFavPromise]);

        // 1. Xử lý dữ liệu BĐS
        if (!responseBds.ok) throw new Error(`Lỗi tải dữ liệu: ${responseBds.status}`);
        bdsList = await responseBds.json();

        // 2. Xử lý dữ liệu Yêu thích (Fix lỗi mất tim khi reload)
        likedPropertyIds.clear();
        if (responseFav && responseFav.ok) {
            const favData = await responseFav.json();
            
            if (Array.isArray(favData)) {
                favData.forEach(item => {
                    // Logic thông minh: Kiểm tra item là số (ID) hay Object
                    // Nếu backend trả về [1, 2, 3] -> lấy item
                    // Nếu backend trả về [{id: 1, ...}, {id: 2, ...}] -> lấy item.id hoặc item.maBds
                    let idToAdd = null;
                    if (typeof item === 'object' && item !== null) {
                        idToAdd = item.id || item.maBds || item.maBatDongSan;
                    } else {
                        idToAdd = item;
                    }
                    
                    if(idToAdd) likedPropertyIds.add(Number(idToAdd));
                });
            }
        }

        // Cập nhật số lượng trên header ngay khi load xong
        updateHeaderCount();

        // Render trang
        currentPage = 1; 
        renderPage(currentPage); 
        renderPagination();

    } catch (error) {
        console.error('Lỗi:', error);
        if(container) {
            container.innerHTML = `
                <div class="col-12 text-center alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i> ${error.message || 'Lỗi tải dữ liệu.'}
                </div>`;
        }
        bdsList = []; 
    } finally {
        if(spinner) spinner.classList.add('d-none');
        if(container) container.classList.remove('d-none');
    }
}

// ===================================================
// 2. RENDER GIAO DIỆN (ĐÃ XÓA SỬA/XÓA)
// ===================================================
function renderPage(page) {
    currentPage = page;
    const container = document.getElementById('bds-container');
    container.innerHTML = ''; 

    if (!Array.isArray(bdsList) || bdsList.length === 0) {
        container.innerHTML = '<p class="text-center text-muted col-12 py-5">Không tìm thấy bất động sản nào phù hợp.</p>';
        document.getElementById('pagination').innerHTML = ''; 
        return;
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = bdsList.slice(start, end);

    pageItems.forEach(bds => {
        const id = bds.id || bds.maBds; 
        const imgSrc = bds.anhChinh ? bds.anhChinh : 'https://via.placeholder.com/600x400.png?text=No+Image';
        const priceFormatted = formatPrice(bds.gia || bds.giaTien);
        
        // Kiểm tra trạng thái tim
        const isLiked = likedPropertyIds.has(Number(id));
        const heartClass = isLiked ? 'bi-heart-fill text-danger' : 'bi-heart';
        const activeClass = isLiked ? 'active' : '';

        // Badge trạng thái
        let badgeHtml = '';
        if(bds.trangThai === 'cho_thue') badgeHtml = '<span class="badge bg-success position-absolute top-0 start-0 m-3">Cho thuê</span>';
        else if(bds.trangThai === 'ban') badgeHtml = '<span class="badge bg-danger position-absolute top-0 start-0 m-3">Đang bán</span>';
        else badgeHtml = `<span class="badge bg-secondary position-absolute top-0 start-0 m-3">${bds.trangThai}</span>`;

        // HTML Card mới (ĐÃ BỎ NÚT SỬA/XÓA)
        const cardHTML = `
        <div class="col-12 col-md-6 col-lg-3 mb-4">
            <div class="property-card-new shadow-sm rounded-3 overflow-hidden position-relative h-100 border">
                
                <div class="card-img-wrap position-relative">
                    <a href="javascript:void(0)" onclick="viewBds(${id})">
                        <img src="${imgSrc}" class="w-100" style="height: 200px; object-fit: cover;" alt="${bds.tieuDe}">
                    </a>
                    ${badgeHtml}
                    <span class="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75">
                        <i class="bi bi-camera-fill me-1"></i> ${bds.soAnh || 1}
                    </span>
                </div>

                <div class="card-body p-3 d-flex flex-column">
                    <h5 class="fw-bold mb-1 prop-title-style text-truncate">
                        <a href="javascript:void(0)" onclick="viewBds(${id})" title="${bds.tieuDe}" class="text-decoration-none text-dark hover-danger">
                            ${bds.tieuDe || 'BĐS Mới'}
                        </a>
                    </h5>
                    
                    <div class="d-flex align-items-center mb-2 mt-2 justify-content-between">
                        <span class="text-danger fw-bold fs-5">${priceFormatted}</span>
                        <span class="text-muted small fw-bold">${bds.dienTich ? bds.dienTich + ' m²' : ''}</span>
                    </div>

                    <div class="mb-3 text-secondary small text-truncate">
                        <i class="bi bi-geo-alt-fill text-danger me-1"></i> 
                        ${bds.viTri || bds.diaChi || 'Chưa cập nhật vị trí'}
                    </div>

                    <div class="mt-auto border-top pt-3 d-flex justify-content-between align-items-center">
                        <span class="text-muted small">
                            <i class="bi bi-clock"></i> ${bds.ngayDang ? 'Vừa đăng' : 'Mới'}
                        </span>

                        <button class="btn btn-heart border ${activeClass}" onclick="toggleFavorite(this, ${id})" title="Lưu tin">
                            <i class="bi ${heartClass}"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

// ===================================================
// 3. XỬ LÝ CHỨC NĂNG TIM (YÊU THÍCH)
// ===================================================
async function toggleFavorite(btnElement, bdsId) {
    const token = localStorage.getItem('access_token');
    
    // Kiểm tra đăng nhập
    if (!token) {
        alert("Vui lòng đăng nhập để lưu tin!");
        // Chuyển hướng trang đăng nhập nếu cần
        // window.location.href = 'login.html'; 
        return;
    }

    try {
        // Gọi API Toggle
        const response = await fetch(`${API_FAVORITE_URL}/toggle/${bdsId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Phiên đăng nhập hết hạn.");
                return;
            }
            throw new Error('Lỗi kết nối server');
        }

        const data = await response.json();
        // Backend nên trả về JSON: { liked: true } hoặc { liked: false }
        
        const icon = btnElement.querySelector('i');
        
        // Cập nhật UI dựa trên phản hồi server
        if (data.liked) {
            likedPropertyIds.add(Number(bdsId));
            btnElement.classList.add('active');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill', 'text-danger');
        } else {
            likedPropertyIds.delete(Number(bdsId));
            btnElement.classList.remove('active');
            icon.classList.remove('bi-heart-fill', 'text-danger');
            icon.classList.add('bi-heart');
        }

        // --- QUAN TRỌNG: CẬP NHẬT HEADER SAU KHI THẢ TIM ---
        updateHeaderCount();

    } catch (error) {
        console.error('Lỗi toggle favorite:', error);
        alert('Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.');
    }
}

// ===================================================
// 4. PHÂN TRANG & ĐIỀU HƯỚNG
// ===================================================
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(bdsList.length / pageSize);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            renderPage(i);
            const currentActive = paginationContainer.querySelector('.active');
            if(currentActive) currentActive.classList.remove('active');
            li.classList.add('active');
        });
        paginationContainer.appendChild(li);
    }
}

function viewBds(id) {
    window.location.href = `Buldinh_admin_ctsp.html?id=${id}`;
}





    // ==========================================
    // 3. LOGIC HEADER & AUTH
    // ==========================================
    const token = localStorage.getItem('access_token');
    const userName = localStorage.getItem('user_name');
    const avatarUrl = localStorage.getItem('user_avatar');
    const authSection = $('#auth-section');

    function initData() {
        const p1 = $.ajax({ url: API_FAVORITE_URL, type: 'GET', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => []);

        $.when(p1, p2).done(function(respFav, respBds) {
            const favData = Array.isArray(respFav) ? respFav[0] : respFav;
            const bdsRaw = Array.isArray(respBds) ? respBds[0] : respBds;
            const bdsData = Array.isArray(bdsRaw) ? bdsRaw : (bdsRaw.content || []);

            if (Array.isArray(favData)) likedPropertyIds = new Set(favData.map(id => Number(id)));
            cachedBDSList = bdsData;

            // Render giới hạn 8 tin
            renderProperties(cachedBDSList, $('#featured-properties-container'), true);
            updateAllFavoriteUI();
        });
    }

    function loadPropertiesOnly() {
        $.get(API_BDS_DEFAULT, function(response) {
            const data = Array.isArray(response) ? response : (response.content || []);
            cachedBDSList = data;
            renderProperties(data, $('#featured-properties-container'), true);
        });
    }

    if (token) {
        let avatarHtml = `<div class="user-avatar-circle">${userName ? userName.charAt(0).toUpperCase() : 'U'}</div>`;
        if (avatarUrl && avatarUrl !== "null") {
            avatarHtml = `<img src="${avatarUrl}" class="user-avatar-circle" onerror="this.replaceWith(document.createElement('div')); this.innerHTML='${userName.charAt(0)}'">`;
        }

        authSection.html(`
            <div class="header-action-group">
                <a href="javascript:void(0)" class="header-action-btn" id="btn-header-favorites">
                    <i class="bi bi-heart"></i>
                    <span class="header-badge" id="fav-count" style="display:none">0</span>
                </a>
                <div class="dropdown-favorites" id="dropdown-favorites-model">
                    <div class="fav-header">Tin đăng đã lưu</div>
                    <ul class="fav-list" id="fav-list-items"><li class="p-3 small text-center">Đang tải...</li></ul>
                    <div class="fav-footer"><a href="danh-sach-yeu-thich.html" class="text-decoration-none">Xem tất cả</a></div>
                </div>
            </div>
            <div class="dropdown user-dropdown ms-3">
                <a class="d-flex align-items-center text-decoration-none dropdown-toggle gap-2" href="#" role="button" data-bs-toggle="dropdown">
                    ${avatarHtml} <span class="d-none d-lg-block fw-medium text-dark">${userName}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                    <li><a class="dropdown-item py-2" href="admin-dashboard.html">Quản lý</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-danger" href="#" id="public-logout">Đăng xuất</a></li>
                </ul>
            </div>
            <a href="Building_them.html" class="btn-post-news">Đăng tin</a>
        `);

        $('#public-logout').click(function(e) {
            e.preventDefault();
            if(confirm('Đăng xuất?')) { localStorage.clear(); window.location.href = 'Building_trangchu.html'; }
        });

        initData();
    } else {
        authSection.html(`
            <a href="#" class="header-icon-btn me-2"><i class="bi bi-heart"></i></a>
            <div class="d-flex align-items-center gap-2">
                <a href="Building_trangchu.html" class="fw-bold text-dark text-decoration-none">Đăng nhập</a>
                <span class="text-muted">|</span>
                <a href="register.html" class="fw-bold text-dark text-decoration-none">Đăng ký</a>
            </div>
            <a href="Building_trangchu.html" class="btn-post-news ms-2">Đăng tin</a>
        `);
        loadPropertiesOnly();
    }


// ===================================================
// 5. KHỞI CHẠY KHI LOAD TRANG
// ===================================================
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const initialFilters = {};
    for (const [key, value] of params.entries()) {
        initialFilters[key] = value;
    }
    
    if (Object.keys(initialFilters).length > 0 && typeof filterAndDisplayResults === 'function') {
        filterAndDisplayResults(initialFilters);
    } else {
        loadBds(); 
    }
};
// Thêm vào cuối file hoặc sau khi header đã được render
document.addEventListener('click', function(e) {
    const btnFav = e.target.closest('#btn-header-favorites'); // Tìm nút tim trên header
    const dropdown = document.getElementById('dropdown-favorites-model');
    
    if (btnFav && dropdown) {
        // Toggle class hiển thị (bạn cần chắc chắn trong CSS có class .show { display: block; })
        if (dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        } else {
            dropdown.style.display = 'block';
        }
        e.preventDefault();
    } else if (dropdown && dropdown.style.display === 'block') {
        // Bấm ra ngoài thì đóng dropdown
        if (!e.target.closest('.dropdown-favorites') && !e.target.closest('#btn-header-favorites')) {
            dropdown.style.display = 'none';
        }
    }
});