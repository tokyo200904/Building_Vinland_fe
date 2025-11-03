// property-detail.js (Đã cập nhật đầy đủ các hàm định dạng)

$(document).ready(function() {

    const urlParams = new URLSearchParams(window.location.search);
    const bdsId = urlParams.get('id');

    if (!bdsId) {
        showError("Không tìm thấy ID bất động sản. Vui lòng kiểm tra lại đường dẫn.");
        return;
    }

    const API_ENDPOINT = `http://localhost:8081/api/admin/bds/chitiet/${bdsId}`; // API của bạn

    let propertyCarousel; // Biến toàn cục để giữ instance của Carousel

    function loadPropertyDetail() {
        $.ajax({
            url: API_ENDPOINT,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                // Dữ liệu JSON mới của bạn:
                // {
                //   "maBds": 1,
                //   "tieuDe": "Căn hộ cao cấp Sunshine",
                //   "moTa": "Căn hộ 3PN, view đẹp, đầy đủ tiện nghi",
                //   "gia": 5000000000.00,
                //   "donViTien": "VND",
                //   "loaiBds": "can_ho",
                //   "trangThai": "cho_thue",
                //   "viTri": "Quận 1, TP.HCM",
                //   "dienTich": 120.50,
                //   "soPhongNgu": 3,
                //   "soPhongTam": 2,
                //   "tongTang": 20,
                //   "noiThat": "day_du",
                //   "namXayDung": 2020,
                //   "baiDoXe": true,
                //   "banCong": true,
                //   "thangMay": true,
                //   "anhChinh": "http://localhost:8081/upload/Reze.jpg", // Ảnh chính
                //   "anhDaiDien": "'http://localhost:8081/upload/Reze.jpg'", // Ảnh đại diện (Agent?)
                //   "hoTen": "Tran Thi B", // Tên Agent
                //   "vaiTro": "Agent",
                //   "soDienThoai": "0912345678",
                //   "duongDan": [ // Danh sách đường dẫn ảnh khác
                //      "/assets/img/bds1_main.jpg", 
                //      "/assets/img/bds1_2.jpg", 
                //      "/assets/img/bds1_3.jpg"
                //   ]
                // }

                // Tạo danh sách ảnh từ `anhChinh` và `duongDan`
                const allImages = [];
                // Thêm ảnh chính vào đầu tiên nếu có
                if (data.anhChinh) {
                    allImages.push(data.anhChinh);
                }
                // Thêm các ảnh khác từ mảng duongDan
                if (data.duongDan && Array.isArray(data.duongDan)) {
                    data.duongDan.forEach(url => {
                        // Tránh thêm ảnh chính một lần nữa nếu nó đã nằm trong duongDan
                        if (url !== data.anhChinh) {
                            allImages.push(url);
                        }
                    });
                }

                populateGallery(allImages); // Gọi hàm gallery mới
                populateMainInfo(data);
                populateDetails(data);
                populateAgentInfo(data);

                // Cập nhật Google Maps iframe (nếu có địa chỉ đầy đủ)
                const mapIframe = $('#property-content iframe');
                if (mapIframe.length) {
                    // Cần encodeURIComponent để địa chỉ không bị lỗi khi đưa vào URL
                    // Dựa vào JSON của bạn, 'viTri' có thể đã đủ chi tiết
                    const encodedAddress = encodeURIComponent(data.viTri || ''); 
                    mapIframe.attr('src', `http://maps.google.com/maps?q=${encodedAddress}&z=15&output=embed`);
                }

                $('#loading-spinner').addClass('d-none');
                $('#property-content').removeClass('d-none');
            },
            error: function(xhr, status, error) {
                let errorMessage = "Không thể tải dữ liệu chi tiết bất động sản.";
                if (xhr.status === 404) {
                    errorMessage = "Bất động sản này không tồn tại hoặc đã bị xóa.";
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    errorMessage = xhr.responseText;
                }
                showError(errorMessage);
            }
        });
    }

    function populateGallery(images) {
        const $carouselMainImages = $('#carouselMainImages');
        const $thumbnailNav = $('#thumbnailNav');
        const $imageCounter = $('#imageCounter');
        
        $carouselMainImages.empty();
        $thumbnailNav.empty();

        if (!images || images.length === 0) {
            $carouselMainImages.append(`
                <div class="carousel-item active">
                    <img src="https://via.placeholder.com/1200x550.png?text=No+Image+Available" class="d-block w-100" alt="No Image">
                </div>
            `);
            $imageCounter.text('0/0');
            return;
        }

        $.each(images, function(index, url) {
            const isActive = index === 0 ? 'active' : '';
            $carouselMainImages.append(`
                <div class="carousel-item ${isActive}">
                    <img src="${url}" class="d-block w-100" alt="Property image ${index + 1}">
                </div>
            `);

            $thumbnailNav.append(`
                <img src="${url}" class="thumbnail-item rounded ${isActive}" data-bs-slide-to="${index}" alt="Thumbnail ${index + 1}">
            `);
        });

        propertyCarousel = new bootstrap.Carousel(document.getElementById('propertyGalleryCarousel'), {
            interval: false 
        });

        $imageCounter.text(`1/${images.length}`);

        $('#propertyGalleryCarousel').on('slid.bs.carousel', function() {
            const currentIndex = $('div.carousel-item.active').index();
            $imageCounter.text(`${currentIndex + 1}/${images.length}`);

            $thumbnailNav.find('.thumbnail-item').removeClass('active-thumb');
            const $activeThumbnail = $thumbnailNav.find(`[data-bs-slide-to="${currentIndex}"]`);
            $activeThumbnail.addClass('active-thumb');

            if ($activeThumbnail.length) {
                const navScroll = $thumbnailNav[0];
                const thumbLeft = $activeThumbnail[0].offsetLeft;
                const thumbWidth = $activeThumbnail[0].offsetWidth;
                const navWidth = navScroll.offsetWidth;
                
                navScroll.scrollLeft = thumbLeft - (navWidth / 2) + (thumbWidth / 2);
            }
        });

        $thumbnailNav.on('click', '.thumbnail-item', function() {
            const slideTo = $(this).data('bs-slide-to');
            propertyCarousel.to(slideTo); 
        });

        $thumbnailNav.find('.thumbnail-item:first').addClass('active-thumb');
    }

    function populateMainInfo(data) {
        $('#propertyTitle').text(data.tieuDe || 'Chưa có tiêu đề');
        
        const address = `${data.viTri || 'Đang cập nhật'}`; 
        $('#propertyAddress').text(address);

        $('#propertyPrice').text(formatCurrency(data.gia, data.donViTien));

        $('#statArea').text(formatArea(data.dienTich));
        $('#statBedrooms').text(data.soPhongNgu || 'N/A');
        $('#statBathrooms').text(data.soPhongTam || 'N/A');
        $('#detailNamXayDung').text(data.namXayDung || 'N/A');

        $('#propertyDescription').html(data.moTa ? data.moTa.replace(/\n/g, '<br>') : 'Chưa có mô tả chi tiết.');
    }

    function populateDetails(data) {
        $('#detailLoaiBDS').text(formatLoaiBDS(data.loaiBds));
        $('#detailTrangThai').text(formatTrangThai(data.trangThai));
        $('#detailNoiThat').text(formatNoiThat(data.noiThat));
        $('#detailTongTang').text(data.tongTang || 'N/A');
        
        // Tiện ích: Chuyển đổi boolean thành "Có" / "Không"
        $('#detailBaiDoXe').text(data.baiDoXe ? 'Có' : 'Không');
        $('#detailBanCong').text(data.banCong ? 'Có' : 'Không');
        $('#detailThangMay').text(data.thangMay ? 'Có' : 'Không');

        // Giả định có trường 'ngayTao' trong JSON của bạn để hiển thị
        $('#detailNgayTao').text(data.ngayTao ? new Date(data.ngayTao).toLocaleDateString('vi-VN') : 'N/A');
    }

    function populateAgentInfo(data) {
        $('#agentName').text(data.hoTen || 'Ẩn danh');
        $('#agentRole').text(data.vaiTro === 'Agent' ? 'Môi giới' : (data.vaiTro === 'customer' ? 'Chủ nhà' : 'N/A'));
        
        const avatar = data.anhDaiDien || 'https://via.placeholder.com/120x120.png?text=User';
        $('#agentAvatar').attr('src', avatar);

        $('#btnShowPhone').on('click', function(e) {
            e.preventDefault();
            const $this = $(this);
            $this.find('span').text(data.soDienThoai || 'N/A');
            $this.removeClass('btn-success').addClass('btn-secondary');
            $this.attr('href', 'tel:' + data.soDienThoai);
        });

        $('#btnChatZalo').attr('href', `https://zalo.me/${data.soDienThoai}`);
    }

    function showError(message) {
        $('#loading-spinner').addClass('d-none');
        $('#property-content').empty().html(`
            <div class="alert alert-danger text-center container my-5">
                <strong>Lỗi!</strong> ${message}
            </div>
        `).removeClass('d-none');
    }

    // --- CÁC HÀM ĐỊNH DẠNG (Formatters) ĐÃ ĐƯỢC PHỤC HỒI ---

    function formatCurrency(number, unit) {
        if (number === null || number === undefined || isNaN(number)) return 'Thỏa thuận';
        const formatter = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: unit || 'VND', // Sử dụng đơn vị tiền tệ từ dữ liệu, mặc định là VND
            minimumFractionDigits: 0, // Không hiển thị số lẻ nếu không có
            maximumFractionDigits: 2
        });
        // Loại bỏ ký hiệu tiền tệ mặc định nếu đơn vị là VND và chỉ muốn hiển thị số
        let formatted = formatter.format(number);
        if (unit === 'VND' || !unit) { // Nếu là VND, hãy loại bỏ ký hiệu '₫' nếu không cần
            formatted = formatted.replace('₫', '').trim() + ' VNĐ';
        }
        return formatted;
    }

    function formatArea(number) {
        if (number === null || number === undefined || isNaN(number)) return 'N/A';
        return `${number} m²`;
    }
    
    function formatLoaiBDS(value) {
        if (!value) return 'N/A';
        switch(value.toLowerCase()) { // Chuyển về chữ thường để so sánh
            case 'can_ho': return 'Căn hộ';
            case 'nha_o': return 'Nhà ở';
            case 'dat': return 'Đất nền';
            case 'thuong_mai': return 'Thương mại';
            default: return value; // Trả về giá trị gốc nếu không khớp
        }
    }
    function formatTrangThai(value) {
        if (!value) return 'N/A';
        switch(value.toLowerCase()) {
            case 'ban': return 'Đang bán';
            case 'cho_thue': return 'Đang cho thuê';
            case 'da_ban': return 'Đã bán';
            case 'dang_xu_ly': return 'Đang xử lý';
            default: return value;
        }
    }
    function formatNoiThat(value) {
        if (!value) return 'N/A';
        switch(value.toLowerCase()) {
            case 'day_du': return 'Đầy đủ nội thất';
            case 'khong_noi_that': return 'Không nội thất';
            case 'mot_phan': return 'Nội thất một phần';
            default: return value;
        }
    }

    loadPropertyDetail();
});