// --- LOGIC CHO TRANG QUAN-LY-TIN-TUC.HTML ---

$(document).ready(function() {
    
    // API Lần này trỏ đến root /tin-tuc (không phải /duyet-tin)
    const API_BASE_URL = 'http://localhost:8081/api/admin/tintuc';
    
    let currentNewsId = null; // Lưu ID của tin tức đang được thao tác
    
    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const container = $('#publishedNewsContainer');
    const loadingMessage = $('#loadingMessage');

    // (Hàm handleApiError và callApi giữ nguyên)
    function handleApiError(jqXHR, callbackMessage = null) {
        if (jqXHR.status === 401 || jqXHR.status === 403) {
            alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
            localStorage.clear();
            window.location.href = '/Building_web_fe/login.html';
        } else {
            let msg = callbackMessage || 'Có lỗi xảy ra, vui lòng thử lại.';
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                msg = jqXHR.responseJSON.message;
            } else if (jqXHR.responseText) {
                 try { msg = JSON.parse(jqXHR.responseText).message || msg; } catch(e) {}
            }
            alert('Lỗi: ' + msg);
        }
    }

    function callApi(endpoint, method, data = null) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            handleApiError({ status: 401 }); 
            return $.Deferred().reject().promise();
        }
        
        const ajaxOptions = {
            url: `${API_BASE_URL}${endpoint}`,
            method: method,
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
        };

        if (data) {
            ajaxOptions.data = JSON.stringify(data);
        }

        return $.ajax(ajaxOptions).fail(handleApiError);
    }

    // --- TẢI DANH SÁCH (Đã VIẾT LẠI ĐỂ TẠO CARD) ---
    function loadPublishedNews() {
        loadingMessage.show();
        container.empty();

        // Gọi API mới: GET /all-published
        callApi('/tintucs', 'GET').done(function(list) {
            loadingMessage.hide();

            if (!list || list.length === 0) {
                container.html('<p class="text-center text-muted p-5">Chưa có tin tức nào được đăng.</p>');
                return;
            }

            list.forEach(item => {
                // (Dùng TinTucDTO)
                
                // Đổi class và text cho tag trạng thái
                let tagClass = 'xuat_ban';
                let tagText = 'ĐÃ XUẤT BẢN';
                if(item.trangThai === 'NHAP') {
                    tagClass = 'nhap';
                    tagText = 'BẢN NHÁP';
                } else if (item.trangThai === 'LUU_TRU') {
                    tagClass = 'luu_tru';
                    tagText = 'ĐÃ GỠ';
                }

                const card = `
                <div class="col-md-6">
                    <div class="card news-card-item h-100">
                        <div class="row g-0">
                            <!-- Cột Ảnh -->
                            <div class="col-md-4">
                                <div class="card-img-container">
                                    <img src="${item.anhDaiDien || 'https://placehold.co/400x300?text=No+Image'}" class="card-img" alt="${item.tieuDe}">
                                    <span class="news-tag ${tagClass}">${tagText}</span>
                                </div>
                            </div>
                            <!-- Cột Nội Dung -->
                            <div class="col-md-8">
                                <div class="card-body d-flex flex-column h-100">
                                    <div>
                                        <p class="card-meta">
                                            ${new Date(item.ngayTao).toLocaleString('vi-VN')} • <span>${item.tenNguoiDang || 'N/A'}</span>
                                        </p>
                                        <h5 class="card-title">${item.tieuDe}</h5>
                                        <p class="card-text text-muted">Mã Tin: ${item.maTin}</p>
                                    </div>
                                    
                                    <!-- Nút bấm ở cuối card -->
                                    <div class="action-buttons mt-auto pt-3">
                                        <button class="btn btn-info view-btn" data-id="${item.maTin}" title="Xem chi tiết">
                                            <i class="bi bi-eye me-1"></i> Xem chi tiết
                                        </button>
                                        <button class="btn btn-danger delete-btn" data-id="${item.maTin}" data-title="${item.tieuDe}" title="Xóa (Chỉ Admin)">
                                            <i class="bi bi-trash me-1"></i> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                container.append(card);
            });
        }).fail(function(jqXHR) {
            loadingMessage.hide();
            container.html('<p class="text-center text-danger p-5">Không thể tải danh sách. Vui lòng F5 (tải lại) trang.</p>');
        });
    }

    // --- XEM CHI TIẾT (ĐÃ VIẾT LẠI CHO MODAL MỚI) ---
    function showDetails(id) {
        currentNewsId = id; // Lưu ID
        
        // Gọi API mới: GET /details/{id}
        callApi(`/${id}`, 'GET').done(function(detail) {
            // (Dùng TinTucDetailDTO)
            $('#detailTieuDe').text(detail.tieuDe);
            $('#detailMetaInfo').html(`
                Đăng bởi: <strong>${detail.tenNguoiDang || 'N/A'}</strong> 
                <br>
                Ngày tạo: <strong>${new Date(detail.ngayTao).toLocaleString('vi-VN')}</strong>
                ${detail.ngayXuatBan ? `<br>Ngày xuất bản: <strong>${new Date(detail.ngayXuatBan).toLocaleString('vi-VN')}</strong>` : ''}
                <br>
                Trạng thái: <strong>${detail.trangThai}</strong> | Lượt xem: <strong>${detail.luotXem || 0}</strong>
            `);
            $('#detailAnhDaiDien').attr('src', detail.anhDaiDien || 'https://placehold.co/800x400?text=No+Image');
            $('#detailNoiDung').html(detail.noiDung); // Chèn HTML
            
            detailModal.show();
        });
    }
    
    // --- MỞ MODAL XÓA ---
    function openDeleteModal(id, title) {
        currentNewsId = id;
        $('#deleteTitle').text(title);
        deleteModal.show();
    }

    // --- XÁC NHẬN XÓA ---
    function confirmDelete() {
        if (!currentNewsId) return;

        // Gọi API mới: DELETE /{id}
        callApi(`/${currentNewsId}`, 'DELETE').done(function() {
            alert('Đã xóa tin tức thành công.');
            deleteModal.hide();
            loadPublishedNews(); // Tải lại danh sách
        }).fail(function(jqXHR) {
            // Hiển thị lỗi (ví dụ: "Chỉ ADMIN mới có quyền xóa")
            handleApiError(jqXHR, "Xóa thất bại."); 
        });
    }

    // --- GẮN SỰ KIỆN ---
    // (Dùng event delegation)
    container.on('click', '.view-btn', function() {
        showDetails($(this).data('id'));
    });
    
    container.on('click', '.edit-btn', function() {
        // Chuyển đến trang đăng tin (giống trang 'Building_them.html')
        // nhưng với ID để load dữ liệu cũ (chức năng này chưa làm)
        alert('Chuyển đến trang chỉnh sửa tin tức (ID: ' + $(this).data('id') + ')');
        // window.location.href = `Building_admin_dangTinTuc.html?id=${$(this).data('id')}`;
    });

    container.on('click', '.delete-btn', function() {
        openDeleteModal($(this).data('id'), $(this).data('title'));
    });
    
    // Nút trong modal xóa
    $('#confirmDeleteBtn').on('click', function() {
        confirmDelete();
    });

    // Tải danh sách lần đầu
    loadPublishedNews();
});