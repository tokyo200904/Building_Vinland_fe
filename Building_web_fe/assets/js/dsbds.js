let bdsToDeleteId = null;
let bdsToDeleteName = null;
let bdsList = []; // Lưu toàn bộ danh sách từ API (sau khi filter)
const pageSize = 12; // Số card mỗi trang
let currentPage = 1;

// Thêm biến để lưu trữ các bộ lọc hiện tại
let currentFilters = {};

// Load danh sách từ API với các bộ lọc
// ===================================================
// CẬP NHẬT LẠI HÀM loadBds ĐỂ NHẬN FILTERS VÀ GỌI API
// ===================================================
async function loadBds(filters = {}) { // Đặt filters mặc định là {}
    // Hiển thị spinner và ẩn container
    $('#loading-spinner-ds').removeClass('d-none'); 
    $('#bds-container').addClass('d-none'); 

    currentFilters = { ...filters }; // Lưu lại bộ lọc hiện tại

    // Xây dựng query string từ đối tượng filters
    const queryParams = new URLSearchParams();
    for (const key in currentFilters) {
        // Chỉ thêm vào queryParams nếu giá trị không rỗng, null, hoặc undefined
        if (currentFilters[key] !== null && currentFilters[key] !== undefined && currentFilters[key] !== "") {
            // Chuyển đổi một số giá trị đặc biệt nếu cần (ví dụ: 'all' thành rỗng cho API)
            if (key === 'loaiBds' && currentFilters[key] === 'all') {
                // Không thêm 'loaiBds' vào query nếu là 'all'
                continue; 
            }
            if (key === 'trangThai' && currentFilters[key] === 'all') {
                // Không thêm 'trangThai' vào query nếu là 'all'
                continue; 
            }
            queryParams.append(key, currentFilters[key]);
        }
    }

    // Xây dựng URL API
    // Ví dụ: http://localhost:8081/api/v1/bds?searchTerm=villa&minPrice=100&loaiBds=CAN_HO
    const API_URL = `http://localhost:8081/api/search?${queryParams.toString()}`;
    console.log("Đang gọi API với URL:", API_URL); // Debug: Kiểm tra URL API

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Không thể đọc thông báo lỗi từ server.' }));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }
        bdsList = await response.json(); // Cập nhật bdsList với dữ liệu đã lọc
        
        // Luôn hiển thị trang đầu tiên sau khi có dữ liệu mới
        currentPage = 1; 
        renderPage(currentPage); 
        renderPagination();

    } catch (error) {
        console.error('Lỗi khi tải danh sách BĐS:', error);
        const container = document.getElementById('bds-container');
        container.innerHTML = `<div class="col-12 text-center alert alert-danger" role="alert">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i> ${error.message || 'Không thể tải dữ liệu bất động sản.'}
                                </div>`;
        document.getElementById('pagination').innerHTML = '';
        bdsList = []; // Xóa danh sách nếu có lỗi
    } finally {
        $('#loading-spinner-ds').addClass('d-none'); // Ẩn spinner
        $('#bds-container').removeClass('d-none'); // Hiển thị nội dung
    }
}

// Render danh sách theo trang (PHIÊN BẢN LƯỚI 2 CỘT)
function renderPage(page) {
    currentPage = page;
    const container = document.getElementById('bds-container');
    container.innerHTML = ''; // Xóa nội dung cũ

    if (!Array.isArray(bdsList) || bdsList.length === 0) {
        container.innerHTML = '<p class="text-center text-muted col-12">Không tìm thấy bất động sản nào phù hợp.</p>';
        document.getElementById('pagination').innerHTML = ''; // Xóa cả phân trang
        return;
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = bdsList.slice(start, end);

    pageItems.forEach(bds => {
        const imgSrc = bds.anhChinh ? bds.anhChinh : 'https://via.placeholder.com/1200x900.png?text=Building+Image+Large';

        // Badge trạng thái (Giữ nguyên)
        let badgeClass = 'bg-secondary';
        let badgeText = '';
        switch (bds.trangThai) {
            case 'CHO_THUE': // Đảm bảo khớp với giá trị ENUM từ Backend
                badgeClass = 'bg-success';
                badgeText = 'Cho thuê';
                break;
            case 'BAN': // Đảm bảo khớp với giá trị ENUM từ Backend
                badgeClass = 'bg-danger';
                badgeText = 'Bán';
                break;
            case 'DANG_XU_LY': // Đảm bảo khớp với giá trị ENUM từ Backend
                badgeClass = 'bg-warning text-dark';
                badgeText = 'Đang chờ xử lý';
                break;
            case 'DA_BAN': // Đảm bảo khớp với giá trị ENUM từ Backend
                badgeClass = 'bg-primary';
                badgeText = 'Đã bán';
                break;
            default:
                badgeText = 'Không xác định';
        }

        const colWrapper = document.createElement('div');
        colWrapper.className = 'col-12 col-md-6 col-lg-3';


        const cardHTML = `
            <div class="card shadow-sm h-100 position-relative">
                <span class="position-absolute top-0 end-0 m-3 badge ${badgeClass}" style="z-index: 2;">${badgeText}</span>
                
                <div style="height: 180px; overflow: hidden;">
                    <img src="${imgSrc}" class="card-img-top" alt="${bds.tieuDe || 'Hình ảnh'}" style="object-fit: cover; height: 100%; width: 100%;">
                </div>

                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${bds.tieuDe || 'Chưa có tiêu đề'}</h5>
                    <ul class="list-unstyled mt-3 mb-4 card-info-list"> 
                        <li class="mb-2 text-truncate">
                            <i class="bi bi-arrows-fullscreen me-2 text-primary"></i>
                            <strong>Diện tích:</strong> ${bds.dienTich !== null ? bds.dienTich + ' m²' : 'N/A'}
                        </li>
                        <li class="mb-2 text-truncate">
                            <i class="bi bi-geo-alt-fill me-2 text-danger"></i>
                            <strong>Vị trí:</strong> ${bds.viTri || 'Chưa cập nhật'}
                        </li>
                        <li class="mb-2 text-truncate">
                            <i class="bi bi-cash-coin me-2 text-success"></i>
                            <strong>Giá:</strong> ${bds.gia ? bds.gia.toLocaleString('vi-VN') + ' VND' : 'Đang cập nhật'}
                        </li>
                    </ul>

                    <div class="mt-auto pt-3 border-top d-flex flex-column flex-md-row gap-2"> 
                        <button class="btn btn-primary btn-lg flex-fill" onclick="viewBds(${bds.maBds})"> 
                            <i class="bi bi-eye"></i> Xem 
                        </button>
                        <button class="btn btn-outline-warning btn-lg flex-fill" onclick="editBds(${bds.maBds})"> 
                            <i class="bi bi-pencil-square"></i> Sửa
                        </button>
                        <button class="btn btn-outline-danger btn-lg flex-fill" onclick="showDeleteModal(${bds.maBds}, '${bds.tieuDe || 'BĐS này'}')"> 
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            </div>
        `;

        colWrapper.innerHTML = cardHTML;
        container.appendChild(colWrapper);
    });
}

// Render pagination
function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(bdsList.length / pageSize);

    if (totalPages <= 1) { // Ẩn phân trang nếu chỉ có 1 trang hoặc không có dữ liệu
        return;
    }

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            renderPage(i);
            renderPagination();
        });
        paginationContainer.appendChild(li);
    }
}

// Các hàm điều hướng
function viewBds(id) {
    window.location.href = `Buldinh_admin_ctsp.html?id=${id}`;
}

function editBds(id) {
    window.location.href = `Building_admin_editbds.html?id=${id}`;
}

// Xóa
function showDeleteModal(id, tieuDe) {
    bdsToDeleteId = id; 
    bdsToDeleteName = tieuDe; 
    document.getElementById('deleteBdsName').textContent = tieuDe;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (bdsToDeleteId) {
try {
            // --- THÊM TOKEN ---
            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('Lỗi: Không tìm thấy token, vui lòng đăng nhập lại.');
                return;
            }

            // --- SỬA ĐƯỜNG DẪN API (thêm /admin) ---
            const API_DELETE_URL = `http://localhost:8081/api/admin/bds/${bdsToDeleteId}`;

            const response = await fetch(API_DELETE_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    // --- SỬA HEADER (thêm Authorization) ---
                    'Authorization': 'Bearer ' + token 
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Không thể đọc thông báo lỗi từ server.' }));
                throw new Error(errorData.message || `Lỗi khi xóa BĐS ID ${bdsToDeleteId}: ${response.statusText} (Status: ${response.status})`);
            }

            bdsToDeleteId = null;
            bdsToDeleteName = null;

            const modalEl = document.getElementById('deleteModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) { 
                modalInstance.hide();
            }

            // Sau khi xóa, tải lại danh sách với các bộ lọc HIỆN TẠI
            loadBds(currentFilters); 

        } catch (error) {
            console.error('Lỗi khi xóa BĐS:', error);
            alert('Có lỗi xảy ra khi xóa bất động sản: ' + error.message);
        }
    } else {
        alert('Không có bất động sản nào được chọn để xóa.');
    }
});

// ===================================================
// KHI TẢI TRANG, KIỂM TRA FILTERS TỪ URL TRƯỚC KHI GỌI loadBds()
// ===================================================
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const initialFilters = {};
    for (const [key, value] of params.entries()) {
        initialFilters[key] = value;
    }
    
    // Nếu có filters từ URL, tkbds.js sẽ gọi filterAndDisplayResults -> loadBds()
    // Nếu không, loadBds() sẽ được gọi với filters rỗng để hiển thị tất cả
    if (Object.keys(initialFilters).length > 0 && typeof filterAndDisplayResults === 'function') {
        // Nếu có filters trong URL, tkbds.js sẽ tự xử lý qua filterAndDisplayResults
        // và hàm này sẽ gọi loadBds
        filterAndDisplayResults(initialFilters);
    } else if (typeof loadBds === 'function') {
        // Nếu không có filters trong URL, hoặc tkbds.js chưa load
        // Đảm bảo loadBds được gọi để hiển thị dữ liệu ban đầu
        loadBds(); 
    }
};