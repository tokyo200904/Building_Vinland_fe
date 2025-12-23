document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Lấy thông tin từ LocalStorage
    const userName = localStorage.getItem('user_name');
    const userRole = localStorage.getItem('user_role');
    const userAvatar = localStorage.getItem('user_avatar'); // Backend bạn trả về full link rồi

    // 2. Hiển thị Tên & Role
    const nameShort = document.getElementById('profile-name-short');
    const nameFull = document.getElementById('profile-name-full');
    const roleSpan = document.getElementById('profile-role');
    
    if (userName) {
        if(nameShort) nameShort.innerText = userName;
        if(nameFull) nameFull.innerText = userName;
    }
    
    if (roleSpan && userRole) {
         // Map role tiếng Anh sang tiếng Việt cho đẹp
         const roleMap = {
            'ADMIN': 'Quản trị viên',
            'AGENT': 'Môi giới',
            'CUSTOMER': 'Khách hàng'
         };
         roleSpan.innerText = roleMap[userRole] || 'Người dùng';
    }

    // 3. XỬ LÝ HIỂN THỊ ẢNH (QUAN TRỌNG)
    const profileImg = document.getElementById('profile-image');
    
    if (profileImg) {
        // Kiểm tra xem có link ảnh không và không phải chữ "null"
        if (userAvatar && userAvatar !== 'null' && userAvatar.trim() !== '') {
            
            // Vì Backend bạn trả về Full URL (http://...) nên cứ thế mà gán vào
            profileImg.src = userAvatar;

            // Nếu ảnh bị lỗi (404) thì dùng ảnh chữ cái
            profileImg.onerror = function() {
                console.log("Không tải được ảnh từ: " + this.src); // Xem log lỗi
                this.src = 'https://placehold.co/40x40/0d6efd/white?text=' + (userName ? userName.charAt(0) : 'U');
            };
        } else {
            // Không có ảnh trong DB
            profileImg.src = 'https://placehold.co/40x40/0d6efd/white?text=' + (userName ? userName.charAt(0) : 'U');
        }
    }

    // 4. Đăng xuất
    const logoutBtn = document.getElementById('logout-button');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if(confirm('Đăng xuất?')) {
                localStorage.clear();
                window.location.href = 'Building_trangchu.html';
            }
        })
    }
});

// Chạy ngay khi DOM (Nội dung HTML) được tải
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Lấy thông tin đã lưu
    const userName = localStorage.getItem('user_name');
    const userRole = localStorage.getItem('user_role');
    const userAvatar = localStorage.getItem('user_avatar');

    // (Code hiển thị Header cũ giữ nguyên...)
    if (userName && userRole) {
        const nameShort = document.getElementById('profile-name-short');
        const nameFull = document.getElementById('profile-name-full');
        const roleSpan = document.getElementById('profile-role');
        const profileImage = document.getElementById('profile-image');

        if (nameShort) nameShort.innerText = userName;
        if (nameFull) nameFull.innerText = userName;
        
        if (profileImage && userAvatar && userAvatar !== "null") {
            profileImage.src = userAvatar;
        } else if (profileImage) {
            const firstLetter = userName.charAt(0).toUpperCase() || '?';
            profileImage.src = `https://placehold.co/40x40/0d6efd/white?text=${firstLetter}`;
        }
        
        let roleText = userRole;
        if(userRole === 'ADMIN') roleText = 'Quản trị viên';
        if(userRole === 'AGENT') roleText = 'Môi giới';
        if(userRole === 'CUSTOMER') roleText = 'Khách hàng';
        if (roleSpan) roleSpan.innerText = roleText;


        // ============================================================
        // === 2. LOGIC PHÂN QUYỀN SIDEBAR (ẨN/HIỆN MENU) ===
        // ============================================================

        // A. Danh sách các trang CHỈ ADMIN thấy
        const adminOnlyPages = [
            'Building_list.html',              // Quản lý BĐS
            'Building_admin_QlTt.html',        // Quản lý tin tức
            'Building_admin_qlUser.html',      // Quản lý tài khoản
            'quan-ly-tai-khoan.html',          
            'Building_admin_moigioi.html',     // Quản lý môi giới
            'quan-ly-moi-gioi.html',
            'quan-ly-tin-tuc.html',
            'Building_admin_duyetTinBDS.html', // Duyệt tin BĐS
            'Building_admin_duyetTinTuc.html', // Duyệt tin tức
            'Building_admin_duyenTT.html',   
            'index.html'   
        ];

        // B. Danh sách các trang CHỈ AGENT thấy
        const agentOnlyPages = [
            'QlBdsAgent.html',
            'QlTtAgent.html' // Trang "Tin đăng của tôi"
        ];

        // C. Lấy tất cả thẻ <a> trong sidebar
        const sidebarLinks = document.querySelectorAll('#sidebar-nav .nav-item a');
        
        // 1. Ẩn các LINK con trước
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            const parentLi = link.closest('.nav-item'); // Thẻ <li> chứa link (nav-item)
            if (!parentLi) return;

            // --- KIỂM TRA QUYỀN ---
            let shouldHide = false;

            // Nếu đây là trang Admin Only -> Nếu user KHÔNG PHẢI Admin thì ẩn
            if (adminOnlyPages.includes(href)) {
                if (userRole !== 'ADMIN') {
                    shouldHide = true;
                }
            }

            // Nếu đây là trang Agent Only -> Nếu user KHÔNG PHẢI Agent thì ẩn
            if (agentOnlyPages.includes(href)) {
                if (userRole !== 'AGENT') {
                    shouldHide = true;
                }
            }
            
            if (shouldHide) {
                parentLi.classList.add('d-none'); // Dùng class d-none để ẩn thay vì style.display
                // Đánh dấu là đã ẩn để tý nữa kiểm tra heading
                parentLi.setAttribute('data-hidden', 'true');
            }
        });
        
        // 2. Ẩn các HEADING nếu không còn mục con nào hiển thị
        // Lấy tất cả các phần tử trong sidebar (cả heading và nav-item)
        const sidebarItems = Array.from(document.querySelectorAll('#sidebar-nav > li'));
        
        let currentHeading = null;
        let visibleItemsCount = 0;
        
        // Duyệt ngược từ dưới lên hoặc xuôi đều được, ở đây duyệt xuôi và gom nhóm
        // Logic: Khi gặp 1 Heading mới, kiểm tra nhóm cũ. Nếu nhóm cũ ko có item nào hiện -> Ẩn Heading cũ.
        
        // Cách đơn giản hơn: Duyệt qua từng Heading
        const headings = document.querySelectorAll('.nav-heading');
        
        headings.forEach(heading => {
            let nextSibling = heading.nextElementSibling;
            let hasVisibleItem = false;

            // Duyệt qua các anh em ngay sau heading cho đến khi gặp heading tiếp theo hoặc hết list
            while (nextSibling) {
                if (nextSibling.classList.contains('nav-heading')) {
                    break; // Gặp heading tiếp theo -> dừng
                }
                
                // Nếu là nav-item và KHÔNG bị ẩn (không có class d-none)
                if (nextSibling.classList.contains('nav-item') && !nextSibling.classList.contains('d-none')) {
                    hasVisibleItem = true;
                    break; // Chỉ cần tìm thấy 1 cái hiện là đủ
                }
                
                nextSibling = nextSibling.nextElementSibling;
            }
            
            // Nếu không có item nào hiện bên dưới -> Ẩn heading này đi
            if (!hasVisibleItem) {
                heading.style.display = 'none';
            }
        });
    }

    // 3. Gắn logic cho nút "Đăng xuất" (Giữ nguyên)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault(); 
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                localStorage.clear(); 
                alert('Bạn đã đăng xuất thành công.');
                window.location.href = '/Building_web_fe/login.html';
            }
        });
    }
});