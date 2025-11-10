// File 1: "Người gác cổng" (auth-guard.js)
(function() {
    // 1. Lấy thông tin
    const token = localStorage.getItem('access_token');
    const userRole = localStorage.getItem('user_role');
    
    // Đảm bảo currentPagePath luôn có dấu / ở đầu (giống /login.html)
    // Ví dụ: /Building_web_fe/Building_list.html
    const currentPagePath = window.location.pathname; 

    // === PHẦN SỬA ĐỔI ===
    // Thêm /Building_web_fe vào trước tất cả các đường dẫn

    // 2. Định nghĩa các trang
    const adminPages = [
        '/Building_web_fe/Building_admin_duyetTinBDS.html',
        '/Building_web_fe/Building_admin_editbds.html',
        '/Building_web_fe/Building_list.html',
        '/Building_web_fe/Building_them.html',
        '/Building_web_fe/Bulding_admin_ctsp.html',
        '/Building_web_fe/Building_admin_qlUser.html'

    ];

    // Định nghĩa các trang công khai
    const loginPage = '/Building_web_fe/login.html';
    const registerPage = '/Building_web_fe/register.html';
    const homePage = '/Building_web_fe/Bulding_trangchu.html'; // Trang chủ của bạn
    const forbiddenPage = '/Building_web_fe/403.html'; // Trang cấm
    // === KẾT THÚC SỬA ĐỔI ===

    // 3. Kiểm tra xem trang hiện tại có phải là trang admin không
    const isAccessingAdminPage = adminPages.some(page => currentPagePath.endsWith(page));

    // 4. LOGIC BẢO VỆ

    // Kịch bản 1: CHƯA ĐĂNG NHẬP
    if (!token) {
        // Nếu chưa đăng nhập, VÀ trang hiện tại KHÔNG PHẢI là trang login/register
        if (!currentPagePath.endsWith(loginPage) && !currentPagePath.endsWith(registerPage)) {
            
            console.warn("Chưa đăng nhập. Chuyển về login.");
            window.location.replace(loginPage); // Sẽ chuyển đến /Building_web_fe/login.html
            return; 
        }
    }
    
    // Kịch bản 2: ĐÃ ĐĂNG NHẬP
    if (token) {
        // A. Đang cố vào trang Admin
// Trong auth-guard.js
const allowedRoles = ['ADMIN', 'AGENT', 'NHANVIEN'];
if (isAccessingAdminPage) {
    if (!allowedRoles.includes(userRole)) { // Nếu role không nằm trong danh sách
        window.location.replace(forbiddenPage);
    }
}
        
        // B. Đã đăng nhập nhưng lại vào trang Login/Register
        if (currentPagePath.endsWith(loginPage) || currentPagePath.endsWith(registerPage)) {
            console.log("Đã đăng nhập. Chuyển về trang chủ.");
            window.location.replace(homePage); // Đuổi về trang chủ
        }
    }
})();

