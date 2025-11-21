$(document).ready(function() {

    // 1. XỬ LÝ HEADER (AUTH STATE - Giống ảnh 2)
    const token = localStorage.getItem('access_token');
    const userName = localStorage.getItem('user_name');
    const userRole = localStorage.getItem('user_role');
    
    // Avatar: Lấy từ localStorage hoặc tạo chữ cái đầu
    const avatarUrl = localStorage.getItem('user_avatar') && localStorage.getItem('user_avatar') !== "null" 
                      ? localStorage.getItem('user_avatar') 
                      : null;

    const authSection = $('#auth-section');

    if (token) {
        // === ĐÃ ĐĂNG NHẬP ===
        let dashboardLink = (userRole === 'CUSTOMER') ? 'admin-profile.html' : 'Building_list.html';
        
        // Tạo Avatar hiển thị (Ảnh hoặc Chữ cái đầu)
        let avatarDisplay = '';
        if (avatarUrl) {
            avatarDisplay = `<img src="${avatarUrl}" class="user-avatar-circle" style="border:none;">`;
        } else {
            const firstLetter = userName ? userName.charAt(0).toUpperCase() : 'U';
            avatarDisplay = `<div class="user-avatar-circle">${firstLetter}</div>`;
        }

        const loggedInHtml = `
            <!-- Icon Tiện ích -->
            <a href="#" class="header-icon-btn" title="Tin đã lưu">
                <i class="bi bi-heart"></i>
                <!-- <span class="badge-notification">2</span> -->
            </a>
            <a href="#" class="header-icon-btn" title="Thông báo">
                <i class="bi bi-bell"></i>
                <span class="badge-notification">1</span>
            </a>

            <!-- User Dropdown (Avatar + Tên) -->
            <div class="dropdown user-dropdown">
                <a class="d-flex align-items-center text-decoration-none dropdown-toggle gap-2" href="#" role="button" data-bs-toggle="dropdown">
                    ${avatarDisplay}
                    <span class="d-none d-lg-block fw-medium" style="color:#222; font-size:0.9rem;">${userName}</span>
                    <i class="bi bi-chevron-down text-muted" style="font-size: 0.8rem;"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2" style="min-width: 200px;">
                    <li><a class="dropdown-item py-2" href="${dashboardLink}"><i class="bi bi-grid me-2"></i>Quản lý tin</a></li>
                    <li><a class="dropdown-item py-2" href="admin-profile.html"><i class="bi bi-person me-2"></i>Thông tin cá nhân</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-danger" href="#" id="public-logout"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
                </ul>
            </div>
            
            <!-- Nút Đăng Tin -->
            <a href="Building_them.html" class="btn-post-news">Đăng tin</a>
        `;
        authSection.html(loggedInHtml);

        $('#public-logout').click(function(e) {
            e.preventDefault();
            if(confirm('Bạn muốn đăng xuất?')) {
                localStorage.clear();
                window.location.reload();
            }
        });

    } else {
        // === CHƯA ĐĂNG NHẬP ===
        const guestHtml = `
            <a href="#" class="header-icon-btn me-2" title="Tin đã lưu"><i class="bi bi-heart"></i></a>
            
            <div class="d-flex align-items-center gap-2">
                <a href="login.html" class="text-decoration-none fw-bold" style="color:#222; font-size:0.9rem;">Đăng nhập</a>
                <span class="text-muted">|</span>
                <a href="register.html" class="text-decoration-none fw-bold" style="color:#222; font-size:0.9rem;">Đăng ký</a>
            </div>

            <a href="login.html" class="btn-post-news ms-2">Đăng tin</a>
        `;
        authSection.html(guestHtml);
    }

    // 2. LOAD BẤT ĐỘNG SẢN (Mockup API)
    const API_BDS_URL = 'http://localhost:8081/api/search'; 

    function loadProperties() {
        const container = $('#featured-properties-container');
        
        // Mockup Data
        setTimeout(() => {
             const mockData = [
                {
                    tieuDe: "Căn hộ cao cấp Masteri Thảo Điền view sông Sài Gòn",
                    gia: 5500000000,
                    dienTich: 75,
                    viTri: "Thảo Điền, Quận 2",
                    anhChinh: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
                    quanHuyen: "Quận 2", thanhPho: "TP.HCM"
                },
                {
                    tieuDe: "Nhà phố thương mại Lakeview City - Giá tốt nhất thị trường",
                    gia: 12000000000,
                    dienTich: 100,
                    viTri: "An Phú, Quận 2",
                    anhChinh: "https://images.unsplash.com/photo-1600596542815-2495db9a9cfc?q=80&w=2075&auto=format&fit=crop",
                    quanHuyen: "Quận 2", thanhPho: "TP.HCM"
                },
                {
                    tieuDe: "Biệt thự đơn lập Vinhomes Central Park - Full nội thất",
                    gia: 45000000000,
                    dienTich: 300,
                    viTri: "Bình Thạnh",
                    anhChinh: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
                    quanHuyen: "Bình Thạnh", thanhPho: "TP.HCM"
                },
                {
                    tieuDe: "Đất nền dự án khu dân cư Tên Lửa mở rộng",
                    gia: 3200000000,
                    dienTich: 90,
                    viTri: "Bình Tân",
                    anhChinh: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2232&auto=format&fit=crop",
                    quanHuyen: "Bình Tân", thanhPho: "TP.HCM"
                }
            ];
            renderProperties(mockData, container);
        }, 500);
    }

    function renderProperties(data, container) {
        container.empty();
        if(!data || data.length === 0) return;

        data.forEach(item => {
            let priceDisplay = "Thỏa thuận";
            if(item.gia) {
                if(item.gia >= 1000000000) priceDisplay = (item.gia / 1000000000).toFixed(1) + " tỷ";
                else priceDisplay = (item.gia / 1000000).toFixed(0) + " triệu";
            }
            const imgUrl = item.anhChinh || 'https://placehold.co/600x400?text=No+Image';

            const cardHtml = `
            <div class="col-lg-3 col-md-6">
                <div class="property-card h-100">
                    <div class="card-img-wrap">
                        <a href="#">
                            <img src="${imgUrl}" alt="${item.tieuDe}">
                        </a>
                    </div>
                    <div class="prop-info">
                        <div class="prop-title" title="${item.tieuDe}">${item.tieuDe}</div>
                        <div class="prop-price-area">
                            <span class="prop-price">${priceDisplay}</span>
                            <span class="prop-area">${item.dienTich} m²</span>
                        </div>
                        <div class="prop-address" title="${item.viTri}">
                            <i class="bi bi-geo-alt"></i> ${item.viTri || ''}, ${item.quanHuyen}
                        </div>
                    </div>
                    <div class="prop-meta">
                        <span>Hôm nay</span>
                        <i class="bi bi-heart saved-homes-icon" title="Lưu tin" style="margin:0"></i>
                    </div>
                </div>
            </div>
            `;
            container.append(cardHtml);
        });
    }
    
    // Load dữ liệu
    loadProperties();
    
    // Xử lý tìm kiếm
    $('#btnSearch').click(function() {
        const keyword = $('#searchInput').val();
        if(keyword) alert('Đang tìm kiếm: ' + keyword);
    });
});