// Chạy ngay khi DOM (Nội dung HTML) được tải, không cần chờ ảnh
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Lấy thông tin đã lưu
    const userName = localStorage.getItem('user_name');
    const userRole = localStorage.getItem('user_role');

    // (baomat.js đã kiểm tra token, nhưng chúng ta kiểm tra lại tên cho chắc)
    if (userName && userRole) {
        
        // 2. "Nhét" thông tin vào Header
        const nameShort = document.getElementById('profile-name-short');
        const nameFull = document.getElementById('profile-name-full');
        const roleSpan = document.getElementById('profile-role');

        if (nameShort) nameShort.innerText = userName;
        if (nameFull) nameFull.innerText = userName;
        
        // Chuyển vai trò (VD: 'ADMIN') thành chữ ('Quản trị viên')
        if (roleSpan) {
            switch (userRole) {
                case 'ADMIN':
                    roleSpan.innerText = 'Quản trị viên';
                    break;
                case 'EDITOR':
                    roleSpan.innerText = 'Biên tập viên';
                    break;
                case 'AGENT':
                    roleSpan.innerText = 'Môi giới';
                    break;
                case 'CUSTOMER':
                    roleSpan.innerText = 'Khách hàng';
                    break;
                default:
                    roleSpan.innerText = 'Người dùng';
            }
        }
    }

    // 3. Gắn logic cho nút "Đăng xuất"
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault(); // Ngăn thẻ <a> nhảy trang

            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                // Xóa thông tin đăng nhập
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_name');
                localStorage.removeItem('user_avatar');
                // (Đảm bảo đường dẫn này chính xác)
                alert('Bạn đã đăng xuất thành công.');
                window.location.href = '/Building_web_fe/login.html';
            }
        });
    }
});