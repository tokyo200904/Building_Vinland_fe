// BƯỚC 1: Cấu hình API (Khớp với Controller của bạn)
const API_BASE_URL = 'http://localhost:8081/api/admin/duyettin';

// BƯỚC 2: Khởi tạo các Modal (Cửa sổ)
let currentListingId = null; // Biến lưu ID của tin đang được chọn
let detailModalInstance = null;
let rejectModalInstance = null;
let detailCarouselInstance = null; // Biến lưu trữ carousel

// Phải chờ document sẵn sàng
$(document).ready(function() {
    // Khởi tạo modal instance sau khi trang đã tải
    detailModalInstance = new bootstrap.Modal(document.getElementById('detailModal'));
    rejectModalInstance = new bootstrap.Modal(document.getElementById('rejectModal'));

    // Khởi tạo carousel (chỉ 1 lần)
    const detailCarouselElement = document.getElementById('detailGalleryCarousel');
    if (detailCarouselElement) {
        detailCarouselInstance = new bootstrap.Carousel(detailCarouselElement, {
            interval: false // Tắt tự động chạy
        });
    }

    // Tải danh sách khi trang sẵn sàng
    loadPendingListings();

    // Gắn các sự kiện
    setupEventListeners();
});

// BƯỚC 3: Hàm xử lý lỗi API (QUAN TRỌNG)
function handleApiError(jqXHR) {
    if (jqXHR.status === 401 || jqXHR.status === 403) {
        alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        localStorage.clear(); // Xóa tất cả localStorage
        window.location.href = '/Building_web_fe/login.html';
    } else {
        let errorMsg = 'Có lỗi xảy ra, vui lòng thử lại.';
        if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
            errorMsg = jqXHR.responseJSON.message;
        } else if (jqXHR.responseText) {
            try {
                errorMsg = JSON.parse(jqXHR.responseText).message || errorMsg;
            } catch (e) {
                errorMsg = jqXHR.responseText; // Trả về text nếu parse lỗi
            }
        }
        alert('Lỗi: ' + errorMsg);
        console.error("Lỗi API:", jqXHR);
    }
}

// BƯỚC 4: Hàm gọi API chung (Đã bao gồm Token)
function callApi(endpoint, method, data = null) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        handleApiError({ status: 401 }); // Lỗi 401 (Chưa đăng nhập)
        return $.Deferred().reject().promise(); // Trả về 1 promise rỗng
    }
    
    const ajaxOptions = {
        url: `${API_BASE_URL}${endpoint}`,
        method: method,
        headers: {
            'Authorization': 'Bearer ' + token
        },
        contentType: 'application/json',
    };

    if (data) {
        ajaxOptions.data = JSON.stringify(data);
    }
    return $.ajax(ajaxOptions).fail(handleApiError);
}


// BƯỚC 5: Hàm Tải Danh Sách Tin Chờ Duyệt
function loadPendingListings() {
    const container = $('#pendingListingsContainer');
    const loadingMessage = $('#loadingMessage');
    
    loadingMessage.show();
    container.empty(); // Xóa nội dung cũ

    callApi('/all', 'GET').done(function(listings) {
        loadingMessage.hide();

        if (!listings || listings.length === 0) {
            container.html('<p class="text-center text-muted col-12">Không có tin đăng nào chờ duyệt.</p>');
            return;
        }

        listings.forEach(listing => {
            const formattedPrice = listing.gia 
                ? `${new Intl.NumberFormat('vi-VN').format(listing.gia)} VNĐ` 
                : 'Thỏa thuận';
            
            const imageUrl = listing.anhChinh || 'https://placehold.co/600x400?text=Chua+Co+Anh';

            const card = `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card property-card h-100">
                        <div class="property-card-image-wrapper">
                            <img src="${imageUrl}" class="property-card-image" alt="${listing.tieuDe}">
                            <span class="property-status-badge">Chờ duyệt</span>
                        </div>
                        
                        <div class="property-card-body d-flex flex-column">
                            <h5 class="property-card-title">${listing.tieuDe || 'Chưa có tiêu đề'}</h5>
                            
                            <ul class="property-info-list">
                                <li>
                                    <i class="bi bi-arrows-fullscreen icon"></i>
                                    <span class="info-label">Diện tích:</span>&nbsp;
                                    <span class="info-value fw-bold">${listing.dienTich ? listing.dienTich + ' m²' : 'N/A'}</span>
                                </li>
                                <li>
                                    <i class="bi bi-geo-alt-fill icon"></i>
                                    <span class="info-label">Vị trí:</span>&nbsp;
                                    <span class="info-value">${listing.diaChi || 'N/A'}</span>
                                </li>
                                <li>
                                    <i class="bi bi-person-circle icon"></i>
                                    <span class="info-label">Người gửi:</span>&nbsp;
                                    <span class="info-value">${listing.tenNguoiGui || 'N/A'}</span>
                                </li>
                                <li>
                                    <i class="bi bi-cash-coin icon"></i>
                                    <span class="info-label">Giá:</span>&nbsp;
                                    <span class="info-value price">${formattedPrice}</span>
                                </li>
                            </ul>

                            <div class="property-card-actions mt-auto">
                                <button type="button" class="btn btn-primary btn-sm view-detail-btn" data-id="${listing.maYeuCauBds}">
                                    <i class="bi bi-eye-fill"></i> Xem
                                </button>
                                <button type="button" class="btn btn-success btn-sm approve-btn" data-id="${listing.maYeuCauBds}">
                                    <i class="bi bi-check-circle"></i> Duyệt
                                </button>
                                <button type="button" class="btn btn-danger btn-sm reject-btn" data-id="${listing.maYeuCauBds}">
                                    <i class="bi bi-x-circle"></i> Chối
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            container.append(card);
        });
    });
}

// BƯỚC 6: Hàm Hiển Thị Chi Tiết (Đã CẬP NHẬT HOÀN CHỈNH)
function showListingDetail(id) {
    currentListingId = id; // Lưu ID hiện tại
    
    callApi(`/${id}`, 'GET').done(function(detail) {
        
        // --- 1. Đổ dữ liệu cơ bản ---
        $('#detailTitle').text(detail.tieuDe || 'Chưa có tiêu đề');
        
        const locationParts = [detail.viTri, detail.quanHuyen, detail.thanhPho].filter(Boolean);
        $('#detailLocation').text(locationParts.join(', ') || 'Đang cập nhật');

        const formattedPrice = detail.gia 
            ? `${new Intl.NumberFormat('vi-VN').format(detail.gia)} ${detail.donViTien || 'VNĐ'}` 
            : 'Thỏa thuận';
        $('#detailPrice').text(formattedPrice);

        // --- 2. Đổ dữ liệu vào Gallery ---
        const $carouselMain = $('#carouselMainImages');
        const $thumbnailNav = $('#detailThumbnailNav');
        $carouselMain.empty();
        $thumbnailNav.empty();

        const allImages = [];
        if (detail.anhChinh) {
            allImages.push(detail.anhChinh);
        }
        
        if (detail.anhPhu && Array.isArray(detail.anhPhu) && detail.anhPhu.length > 0) { 
            detail.anhPhu.forEach(imgUrl => {
                if (imgUrl !== detail.anhChinh) { 
                    allImages.push(imgUrl);
                }
            });
        }
        
        if (allImages.length === 0) {
            allImages.push('https://placehold.co/1200x550?text=Khong+Co+Anh');
        }

        allImages.forEach((imgUrl, index) => {
            const activeClass = index === 0 ? 'active' : '';
            $carouselMain.append(`
                <div class="carousel-item ${activeClass}">
                    <img src="${imgUrl}" class="d-block w-100" alt="Property image ${index + 1}">
                </div>
            `);
            $thumbnailNav.append(`
                <img src="${imgUrl}" 
                     class="thumbnail-item ${activeClass ? 'active-thumb' : ''}" 
                     data-bs-target="#detailGalleryCarousel" 
                     data-bs-slide-to="${index}" 
                     alt="Thumbnail ${index + 1}">
            `);
        });

        if (detailCarouselInstance) {
            detailCarouselInstance.to(0);
        }
        
        // --- 3. Đổ dữ liệu vào Stats ---
        $('#statArea').text(detail.dienTich ? `${detail.dienTich} m²` : 'N/A');
        $('#statBedrooms').text(detail.soPhongNgu || 'N/A');
        $('#statBathrooms').text(detail.soPhongTam || 'N/A');
        $('#statYearBuilt').text(detail.namXayDung || 'N/A');

        // --- 4. Đổ dữ liệu Mô tả ---
        $('#detailDescription').html(detail.moTa ? detail.moTa.replace(/\n/g, '<br>') : 'Không có mô tả chi tiết.');

        // --- 5. Đổ dữ liệu Người gửi ---
        $('#detailAgentName').text(detail.tenNguoiGui || 'N/A');
        $('#detailAgentRole').text('Người gửi'); 
        
        $('#detailAgentPhone').text('HIỆN SỐ'); 
        $('#btnShowPhone').off('click').on('click', function(e) {
            e.preventDefault();
            $(this).find('span').text(detail.sdtNguoiGui || 'N/A'); 
            $(this).attr('href', `tel:${detail.sdtNguoiGui}`);
        });

        $('#detailAgentEmail').text(detail.emailNguoiGui || 'N/A'); 
        $('#btnChatEmail').attr('href', `mailto:${detail.emailNguoiGui}`);
        
        $('#detailId').text(detail.maYeuCauBds || 'N/A'); 
        $('#detailDate').text(detail.ngayTaoYeuCau ? new Date(detail.ngayTaoYeuCau).toLocaleString('vi-VN') : 'N/A');

        // --- 6. Đổ dữ liệu chi tiết & Tiện ích (Các trường mới) ---
        $('#detailLoaiBDS').text(formatLoaiBDS(detail.loaiBds));
        $('#detailMucDich').text(formatMucDich(detail.mucDichTinDang));
        $('#detailNoiThat').text(formatNoiThat(detail.noiThat));
        $('#detailTang').text(detail.tang || 'N/A');
        $('#detailTongTang').text(detail.tongTang || 'N/A');

        $('#detailBaiDoXe').text(formatBoolean(detail.baiDoXe));
        $('#detailBanCong').text(formatBoolean(detail.banCong));
        $('#detailThangMay').text(formatBoolean(detail.thangMay));
        
        // Mở Modal
        detailModalInstance.show();
    });
}

// BƯỚC 7: Hàm Phê Duyệt
function approveListing(id) {
    if (!confirm('Bạn có chắc muốn PHÊ DUYỆT tin đăng này?')) return;
    
    callApi(`/${id}`, 'PUT').done(function() {
        alert('Tin đăng đã được phê duyệt thành công!');
        loadPendingListings(); // Tải lại danh sách
    });
}

// BƯỚC 8: Hàm Từ Chối
function rejectListing(id, reason) {
    if (!reason) {
        if (!confirm('Bạn chưa nhập lý do. Vẫn tiếp tục từ chối?')) {
            return;
        }
    }
    const requestData = { lyDoTuChoi: reason }; 
    
    callApi(`/tuchoi/${id}`, 'PUT', requestData).done(function() {
        alert('Tin đăng đã bị từ chối.');
        rejectModalInstance.hide();
        loadPendingListings(); // Tải lại danh sách
    });
}


// BƯỚC 9: Gắn Sự Kiện (Event Listeners)
function setupEventListeners() {
    // Dùng event delegation cho các nút được tạo động
    $('#pendingListingsContainer').on('click', '.view-detail-btn', function() {
        const id = $(this).data('id');
        showListingDetail(id);
    });

    $('#pendingListingsContainer').on('click', '.approve-btn', function() {
        const id = $(this).data('id');
        approveListing(id);
    });

    $('#pendingListingsContainer').on('click', '.reject-btn', function() {
        currentListingId = $(this).data('id'); // Lưu ID để modal dùng
        $('#rejectReason').val(''); // Xóa lý do cũ
        rejectModalInstance.show();
    });
    
    // Nút "Phê duyệt" TỪ BÊN TRONG MODAL CHI TIẾT
    $('#approveFromModalBtn').on('click', function() {
        if (currentListingId) {
            approveListing(currentListingId);
            detailModalInstance.hide();
        }
    });

    // Nút "Từ chối" TỪ BÊN TRONG MODAL CHI TIẾT
    $('#rejectFromModalBtn').on('click', function() {
        if (currentListingId) {
            detailModalInstance.hide();
            $('#rejectReason').val(''); // Xóa lý do cũ
            rejectModalInstance.show();
        }
    });

    // Nút "Xác nhận Từ chối" TỪ BÊN TRONG MODAL TỪ CHỐI
    $('#confirmRejectBtn').on('click', function() {
        const reason = $('#rejectReason').val();
        if (currentListingId) {
            rejectListing(currentListingId, reason);
        }
    });

    // Sự kiện click cho thumbnail trong modal chi tiết
    $(document).on('click', '#detailThumbnailNav .thumbnail-item', function() {
        const slideTo = $(this).data('bs-slide-to');
        if (detailCarouselInstance) {
            detailCarouselInstance.to(slideTo);
        }
        $('#detailThumbnailNav .thumbnail-item').removeClass('active-thumb');
        $(this).addClass('active-thumb');
    });

    // Cập nhật thumbnail active khi carousel chính thay đổi
    $('#detailGalleryCarousel').on('slid.bs.carousel', function (e) {
        const currentIndex = e.to;
        $('#detailThumbnailNav .thumbnail-item').removeClass('active-thumb');
        $(`#detailThumbnailNav .thumbnail-item[data-bs-slide-to="${currentIndex}"]`).addClass('active-thumb');
    });
}


// ======== CÁC HÀM HELPER (ĐỊNH DẠNG) ========

// Dùng để chuyển đổi boolean (true/false) thành "Có" / "Không"
function formatBoolean(value) {
    if (value === null || value === undefined) return 'N/A';
    return value ? 'Có' : 'Không';
}

// Dùng để định dạng `loaiBds`
function formatLoaiBDS(value) {
    if (!value) return 'N/A';
    switch(value.toLowerCase()) {
        case 'can_ho': return 'Căn hộ';
        case 'nha_o': return 'Nhà ở';
        case 'dat': return 'Đất nền';
        case 'thuong_mai': return 'Thương mại';
        default: return value;
    }
}

// Dùng để định dạng `mucDichTinDang`
function formatMucDich(value) {
    if (!value) return 'N/A';
    switch(value.toLowerCase()) {
        case 'ban': return 'Đang bán';
        case 'cho_thue': return 'Đang cho thuê';
        case 'da_ban': return 'Đã bán';
        case 'dang_xu_ly': return 'Đang xử lý';
        default: return value;
    }
}

// Dùng để định dạng `noiThat`
function formatNoiThat(value) {
    if (!value) return 'N/A';
    switch(value.toLowerCase()) {
        case 'day_du': return 'Đầy đủ nội thất';
        case 'khong_noi_that': return 'Không nội thất';
        case 'mot_phan': return 'Nội thất một phần';
        default: return value;
    }
}