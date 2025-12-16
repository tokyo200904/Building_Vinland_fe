$(document).ready(function() {
    // ==========================================
    // 1. CẤU HÌNH API
    // ==========================================
    const API_BASE_URL = 'http://localhost:8081/api'; 
    
    const API_BDS_DEFAULT = `${API_BASE_URL}/admin/bds`; // API lấy toàn bộ
    const API_BDS_SEARCH = `${API_BASE_URL}/search`;     // API tìm kiếm
    
    const API_TIN_TUC_URL = `${API_BASE_URL}/admin/tintuc/tintucs`; 
    const API_DOANH_NGHIEP_URL = `${API_BASE_URL}/moigioi`; 
    const API_FAVORITE_URL = `${API_BASE_URL}/yeuthich`; 

    let likedPropertyIds = new Set();
    let cachedBDSList = [];

    // ==========================================
    // 2. HELPER
    // ==========================================
    function clearAuthAndReload() {
        if (localStorage.getItem('access_token')) {
            localStorage.clear();
            window.location.reload(); 
        }
    }

    function formatPrice(price) {
        if (!price) return "Thỏa thuận";
        if (typeof price === 'number') {
            return price >= 1000000000 
                ? (price / 1000000000).toFixed(1).replace('.0', '') + " tỷ"
                : (price / 1000000).toFixed(0) + " triệu";
        }
        return price;
    }

    function getBdsId(item) {
        const rawId = item.maBds || item.id || item.maBatDongSan || item.maBDS;
        return rawId ? Number(rawId) : null;
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
        const p2 = $.ajax({ url: API_BDS_DEFAULT, type: 'GET', dataType: 'json' }).catch(() => []);

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

    // ==========================================
    // 4. UI UPDATES (YÊU THÍCH)
    // ==========================================
    function updateAllFavoriteUI() {
        const count = likedPropertyIds.size;
        const badge = $('#fav-count');
        if (count > 0) badge.text(count).show(); else badge.hide();

        $('.btn-heart').each(function() {
            const btnId = Number($(this).attr('data-id'));
            const icon = $(this).find('i');
            if (likedPropertyIds.has(btnId)) {
                $(this).addClass('active');
                icon.removeClass('bi-heart').addClass('bi-heart-fill text-danger');
            } else {
                $(this).removeClass('active');
                icon.removeClass('bi-heart-fill text-danger').addClass('bi-heart');
            }
        });
        renderFavoritesDropdown();
    }

    function renderFavoritesDropdown() {
        const listContainer = $('#fav-list-items');
        listContainer.empty();

        if (likedPropertyIds.size === 0) {
            listContainer.html('<li class="p-3 text-center text-muted small">Bạn chưa lưu tin nào.</li>');
            return;
        }
        const likedItems = cachedBDSList.filter(item => likedPropertyIds.has(getBdsId(item))).reverse();
        
        if (likedItems.length === 0) {
             listContainer.html('<li class="p-3 text-center text-muted small">Đang cập nhật...</li>');
             return;
        }

        likedItems.slice(0, 5).forEach(item => {
            const id = getBdsId(item);
            const imgUrl = (item.anhChinh && item.anhChinh.trim()) ? item.anhChinh : 'https://placehold.co/60x40?text=Img';
            const price = formatPrice(item.gia || item.giaTien);
            listContainer.append(`
            <li>
                <a href="chi-tiet-bds.html?id=${id}" class="fav-item">
                    <img src="${imgUrl}" onerror="this.src='https://placehold.co/60x40'">
                    <div class="fav-info">
                        <span class="fav-title" title="${item.tieuDe}">${item.tieuDe}</span>
                        <span class="fav-price">${price}</span>
                    </div>
                </a>
            </li>`);
        });
    }

    // Header Tim Click
    $('#btn-header-favorites').click(function(e) {
        e.preventDefault();
        $('#dropdown-favorites-model').toggleClass('show-force');
    });
    $(document).click(function(e) {
        if (!$(e.target).closest('.header-action-group').length) {
            $('#dropdown-favorites-model').removeClass('show-force');
        }
    });

    // Toggle Tim
    $(document).on('click', '.btn-heart', function(e) {
        e.preventDefault();
        const btn = $(this);
        const bdsId = Number(btn.attr('data-id'));
        if (!token) { alert("Vui lòng đăng nhập!"); return; }
        if (!bdsId) return;

        if (likedPropertyIds.has(bdsId)) likedPropertyIds.delete(bdsId);
        else likedPropertyIds.add(bdsId);
        updateAllFavoriteUI();

        $.ajax({
            url: `${API_FAVORITE_URL}/toggle/${bdsId}`,
            type: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(res) {
                if(res.liked) likedPropertyIds.add(bdsId); else likedPropertyIds.delete(bdsId);
                updateAllFavoriteUI();
            }
        });
    });

    // ==========================================
    // 5. SEARCH & FILTER (QUAN TRỌNG)
    // ==========================================
    
    // 5.1. Tìm kiếm từ khóa
    $('#btnSearch').click(function(e) {
        e.preventDefault();
        const keyword = $('#searchInput').val().trim();
        const container = $('#featured-properties-container');
        container.html('<div class="col-12 text-center py-5"><div class="spinner-border text-danger"></div><p>Đang tìm kiếm...</p></div>');

        if (!keyword) { initData(); $('.section-header-bds').text('Bất động sản dành cho bạn'); return; }

        // Gọi API Search
        $.ajax({
            url: API_BDS_SEARCH,
            type: 'GET',
            dataType: 'json',
            data: { searchTerm: keyword },
            success: function(response) {
                const dataList = Array.isArray(response) ? response : (response.content || []);
                cachedBDSList = dataList;
                renderProperties(dataList, container, true);
                updateAllFavoriteUI();
                $('.section-header-bds').text(`Kết quả tìm kiếm: "${keyword}"`);
            },
            error: function() { container.html(`<div class="col-12 text-center text-danger py-5">Lỗi tìm kiếm.</div>`); }
        });
    });

    // 5.2. Lọc theo Loại (Bán/Thuê) - Click Menu
    $('.nav-filter').click(function(e) {
        e.preventDefault();
        const type = $(this).data('muc-dich'); // BAN hoặc THUE
        const container = $('#featured-properties-container');
        const title = type === 'BAN' ? 'Nhà đất bán' : 'Nhà đất cho thuê';
        
        container.html('<div class="col-12 text-center py-5"><div class="spinner-border text-danger"></div><p>Đang lọc...</p></div>');
        $('.section-header-bds').text(title);

        // Gọi API Default rồi lọc Client-side (Vì backend chưa hỗ trợ Search Params này)
        $.ajax({
            url: API_BDS_DEFAULT,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                const allData = Array.isArray(response) ? response : (response.content || []);
                
                // Lọc client-side
                const filteredData = allData.filter(item => item.mucDichTinDang === type);
                
                cachedBDSList = allData; // Vẫn cache hết để dropdown dùng
                renderProperties(filteredData, container, true);
                updateAllFavoriteUI();
            }
        });
    });

    // Hàm Render chung (Có tham số showButton)
    function renderProperties(data, container, showButton = false) {
        container.empty();
        if(!data || data.length === 0) { container.html('<div class="col-12 text-center text-muted py-5">Không tìm thấy tin đăng nào.</div>'); return; }

        // --- LOGIC: CHỈ LẤY 8 TIN ---
        const displayData = data.slice(0, 8);

        displayData.forEach(item => {
            const id = getBdsId(item);
            const price = formatPrice(item.gia || item.giaTien);
            const img = (item.anhChinh && item.anhChinh.trim()) ? item.anhChinh : 'https://placehold.co/600x400?text=No+Img';
            const loc = item.viTri || `${item.quanHuyen || ''}, ${item.thanhPho || ''}`;
            
            const isLiked = likedPropertyIds.has(id);
            const active = isLiked ? 'active' : '';
            const icon = isLiked ? 'bi-heart-fill text-danger' : 'bi-heart';

            container.append(`
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="property-card-new shadow-sm bg-white rounded-3 overflow-hidden h-100 position-relative">
                    <div class="card-img-wrap position-relative">
                        <a href="detail_bds_nd.html?id=${id}"> 
                            <img src="${img}" style="height:200px; object-fit:cover; width:100%" onerror="this.src='https://placehold.co/600x400'">
                        </a>
                        <span class="position-absolute bottom-0 end-0 m-2 badge bg-dark bg-opacity-75">${item.soAnh || 1} <i class="bi bi-image"></i></span>
                    </div>
                    <div class="card-body-content p-3">
                        <h5 class="fw-bold mb-1 prop-title-style"><a href="chi-tiet-bds.html?id=${id}" class="text-dark text-decoration-none" title="${item.tieuDe}">${item.tieuDe}</a></h5>
                        <div class="d-flex align-items-center mb-2 mt-2">
                            <span class="text-danger fw-bold me-3 fs-5">${price}</span>
                            <span class="text-muted small">${item.dienTich ? item.dienTich + ' m²' : ''}</span>
                        </div>
                        <div class="mb-3 text-secondary small text-truncate"><i class="bi bi-geo-alt-fill text-danger"></i> ${loc}</div>
                        <div class="d-flex justify-content-between border-top pt-2 align-items-center">
                            <span class="text-muted small">${item.ngayDang ? 'Đăng hôm nay' : 'Vừa đăng'}</span>
                            <button class="btn btn-sm border-0 btn-heart ${active}" data-id="${id}"><i class="bi ${icon}"></i></button>
                        </div>
                    </div>
                </div>
            </div>`);
        });

        // Nút xem thêm chuyển trang
        if (showButton && data.length > 8) {
            container.append(`
                <div class="col-12 text-center mt-4">
                    <a href="danh-sach-bds.html" class="btn btn-outline-danger px-5 py-2 rounded-pill fw-bold">
                        Xem thêm <i class="bi bi-arrow-right ms-2"></i>
                    </a>
                </div>
            `);
        }
    }

 // ==========================================
    // 6. DOANH NGHIỆP & TIN TỨC (ĐÃ SỬA LỖI)
    // ==========================================
    
    // Load Doanh Nghiệp
    $.getJSON(API_DOANH_NGHIEP_URL, function(res) {
        const list = Array.isArray(res) ? res : (res.content || []);
        const wrap = $('#featured-agents-wrapper').empty();
        
        list.slice(0, 15).forEach(a => {
            // 1. Lấy ID Doanh nghiệp (Thử cả maMoiGioi và id)
            const agentId = a.maMoiGioi || a.id;
            const img = a.hinhAnh || 'https://placehold.co/100x100?text=Logo';
            
            // 2. Sửa nút "Xem hồ sơ" thành thẻ <a> để chuyển trang được
            // Giả sử trang chi tiết là: chi-tiet-doanh-nghiep.html
            wrap.append(`
            <div class="agent-slider-item">
                <img src="${img}" class="agent-slider-avatar" onerror="this.src='https://placehold.co/100x100'">
                <h6 class="fw-bold text-truncate w-100 px-2 mb-2" title="${a.tenCongTy}">${a.tenCongTy}</h6>
                <div class="text-muted small mb-3">Đối tác chiến lược</div>
                
                <a href="Trangchu_chitietMg.html?id=${agentId}" class="btn btn-sm btn-outline-danger rounded-pill px-4 text-decoration-none">
                    Xem hồ sơ
                </a>
            </div>`);
        });
    });

    // Load Tin Tức
    $.getJSON(API_TIN_TUC_URL, function(res) {
        const list = Array.isArray(res) ? res : (res.content || []);
        const container = $('#latest-news-container').empty();
        
        console.log("Dữ liệu Tin tức:", list); // Debug xem tên biến ID là gì

        list.slice(0, 8).forEach(n => {
            // 3. Lấy ID Tin tức (Thử cả maTinTuc và id)
            const newsId = n.maTin || n.id; 
            const img = n.anhDaiDien || 'https://placehold.co/400x250';
            
            // Link chi tiết tin tức
            const linkDetail = `trangchu_chitietTt.html?id=${newsId}`;

            container.append(`
            <div class="col-md-6 col-lg-3 mb-4">
                <div class="card h-100 border-0 shadow-sm news-card">
                    <a href="${linkDetail}">
                        <img src="${img}" class="card-img-top" style="height:160px; object-fit:cover" onerror="this.src='https://placehold.co/400x250'">
                    </a>
                    <div class="card-body p-3">
                        <h6 class="fw-bold mb-2">
                            <a href="${linkDetail}" class="text-dark text-decoration-none text-truncate-2">${n.tieuDe}</a>
                        </h6>
                        <p class="small text-muted mb-0 text-truncate">${n.tomTat || ''}</p>
                    </div>
                </div>
            </div>`);
        });

        if (list.length > 8) {
            container.append(`
                <div class="col-12 text-center mt-3">
                    <a href="Trangchu_tintuc.html" class="btn btn-outline-primary px-5 py-2 rounded-pill fw-bold">Xem thêm tin tức <i class="bi bi-arrow-right ms-2"></i></a>
                </div>
            `);
        }
    });

    $('#btn-next-agent').click(() => document.getElementById('featured-agents-wrapper').scrollBy({left: 300, behavior:'smooth'}));
    $('#btn-prev-agent').click(() => document.getElementById('featured-agents-wrapper').scrollBy({left: -300, behavior:'smooth'}));
});