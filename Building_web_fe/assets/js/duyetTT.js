// --- LOGIC CHO TRANG DUYET-TIN-TUC.HTML (Giao diện Card mới) ---

$(document).ready(function() {
    
    const API_BASE_URL = 'http://localhost:8081/api/admin/tintuc/duyettin';
    
    let currentNewsId = null; // Lưu ID của tin tức đang được thao tác
    
    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
    const rejectModal = new bootstrap.Modal(document.getElementById('rejectModal'));
    const container = $('#pendingNewsContainer');
    const loadingMessage = $('#loadingMessage');

    // --- HÀM XỬ LÝ LỖI (CHUNG) ---
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

    // --- HÀM GỌI API (CHUNG) ---
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

    // --- TẢI DANH SÁCH (ĐÃ VIẾT LẠI ĐỂ TẠO CARD) ---
    function loadPendingNews() {
        loadingMessage.show();
        container.empty();

        callApi('/tintucs', 'GET').done(function(list) {
            loadingMessage.hide();

            if (!list || list.length === 0) {
                container.html('<p class="text-center text-muted p-5">Không có tin tức nào chờ duyệt.</p>');
                return;
            }

            list.forEach(item => {
                // (Dùng YeuCauTinTucDTO)
                const card = `
                <div class="col-12">
                    <div class="card news-card-item mb-4">
                        <div class="row g-0">
                            <!-- Cột Ảnh -->
                            <div class="col-md-4">
                                <div class="card-img-container">
                                    <img src="${item.anhDaiDien || 'https://placehold.co/400x300?text=No+Image'}" class="card-img" alt="${item.tieuDe}">
                                    <span class="news-tag">CHỜ DUYỆT</span>
                                </div>
                            </div>
                            <!-- Cột Nội Dung -->
                            <div class="col-md-8">
                                <div class="card-body d-flex flex-column h-100">
                                    <div>
                                        <p class="card-meta">
                                            ${new Date(item.ngayTaoYeuCauTt).toLocaleString('vi-VN')} • <span>${item.tenNguoiGui || 'N/A'}</span>
                                        </p>
                                        <h5 class="card-title">${item.tieuDe}</h5>
                                        <p class="card-text text-muted">Mã YC: ${item.maYeuCauTt} | (Nội dung sẽ hiển thị đầy đủ khi xem chi tiết)</p>
                                    </div>
                                    
                                    <!-- Nút bấm ở cuối card -->
                                    <div class="action-buttons mt-auto pt-3">
                                        <button class="btn btn-info view-btn" data-id="${item.maYeuCauTt}" title="Xem chi tiết">
                                            <i class="bi bi-eye me-1"></i> Xem chi tiết
                                        </button>
                                        <button class="btn btn-success approve-btn" data-id="${item.maYeuCauTt}" title="Phê duyệt">
                                            <i class="bi bi-check-lg me-1"></i> Phê duyệt
                                        </button>
                                        <button class="btn btn-danger reject-btn" data-id="${item.maYeuCauTt}" data-title="${item.tieuDe}" title="Từ chối">
                                            <i class="bi bi-x-lg me-1"></i> Từ chối
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
        callApi(`/${id}`, 'GET').done(function(detail) {
            // (Dùng YeuCauTinTucDetailDTO)
            $('#detailTieuDe').text(detail.tieuDe);
            $('#detailMetaInfo').html(`
                Gửi bởi: <strong>${detail.tenNguoiGui || 'N/A'}</strong> 
                (Email: ${detail.emailNguoiGui || 'N/A'} | SĐT: ${detail.sdtNguoiGui || 'N/A'})
                <br>
                Ngày gửi: <strong>${new Date(detail.ngayTaoYeuCauTt).toLocaleString('vi-VN')}</strong>
                ${detail.ngayXuatBan ? `<br>Dự kiến xuất bản: <strong>${new Date(detail.ngayXuatBan).toLocaleString('vi-VN')}</strong>` : ''}
            `);
            $('#detailAnhDaiDien').attr('src', detail.anhDaiDien || 'https://placehold.co/800x400?text=No+Image');
            $('#detailNoiDung').html(detail.noiDung); // Chèn HTML
            
            detailModal.show();
        });
    }

    // --- PHÊ DUYỆT ---
    function approveNews(id) {
        if (!confirm('Bạn có chắc muốn PHÊ DUYỆT bài viết này?')) return;

        callApi(`/approve/${id}`, 'PUT').done(function() {
            alert('Phê duyệt thành công!');
            loadPendingNews(); // Tải lại danh sách
        });
    }
    
    // --- TỪ CHỐI (MỞ MODAL) ---
    function openRejectModal(id, title) {
        currentNewsId = id;
        $('#rejectTitle').text(title);
        $('#rejectReason').val(''); // Xóa lý do cũ
        rejectModal.show();
    }

    // --- XÁC NHẬN TỪ CHỐI ---
    function confirmReject() {
        const reason = $('#rejectReason').val();
        if (!reason || reason.trim() === '') {
            alert('Vui lòng nhập lý do từ chối.');
            return;
        }

        callApi(`/reject/${currentNewsId}`, 'PUT', { lyDoTuChoi: reason }).done(function() {
            alert('Đã từ chối bài viết.');
            rejectModal.hide();
            loadPendingNews(); // Tải lại danh sách
        });
    }

    // --- GẮN SỰ KIỆN ---
    // (Dùng event delegation cho các nút được tạo động)
    container.on('click', '.view-btn', function() {
        showDetails($(this).data('id'));
    });
    
    container.on('click', '.approve-btn', function() {
        approveNews($(this).data('id'));
    });

    container.on('click', '.reject-btn', function() {
        openRejectModal($(this).data('id'), $(this).data('title'));
    });
    
    // Nút trong modal chi tiết
    $('#approveFromModalBtn').on('click', function() {
        detailModal.hide();
        approveNews(currentNewsId);
    });

    $('#rejectFromModalBtn').on('click', function() {
        detailModal.hide();
        openRejectModal(currentNewsId, $('#detailTieuDe').text());
    });

    // Nút trong modal từ chối
    $('#confirmRejectBtn').on('click', function() {
        confirmReject();
    });

    // Tải danh sách lần đầu
    loadPendingNews();
});