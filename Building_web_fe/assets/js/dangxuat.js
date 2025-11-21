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
                window.location.href = 'login.html';
            }
        })
    }
});