$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bdsId = urlParams.get('id'); // Lấy ID từ URL

    const API_DETAIL_ENDPOINT = `http://localhost:8081/api/admin/bds/chitiet/${bdsId}`; // API chi tiết
    const API_UPDATE_ENDPOINT = `http://localhost:8081/api/admin/bds/${bdsId}`; // API update (PUT/PATCH)

    let currentMainImageUrl = null; // Để lưu trữ URL ảnh chính hiện tại từ backend
    let newMainImageFile = null;    // Để lưu trữ file ảnh chính mới được chọn

    // Cờ hiệu để biết ảnh chính cũ có bị xóa không (áp dụng cho ảnh chính thôi)
    let isCurrentMainImageRemoved = false; 

    // Các biến và logic liên quan đến ảnh phụ (duongDan) sẽ được bỏ qua trong quá trình gửi dữ liệu
    // nhưng vẫn giữ để hiển thị nếu dữ liệu trả về có (như bạn yêu cầu lúc đầu)
    // Dù input đã disabled, biến này vẫn không dùng để gửi đi nữa
    // let newImageFiles_duongDan = []; // Không dùng để gửi đi, chỉ cho hiển thị nếu muốn

    if (!bdsId) {
        showError("Không tìm thấy ID bất động sản để sửa. Vui lòng kiểm tra lại đường dẫn.");
        return;
    }

    // Tải thông tin bất động sản khi trang load
    async function loadBdsDetail() {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) { throw new Error("Không tìm thấy token đăng nhập."); }
             const response = await fetch(API_DETAIL_ENDPOINT, {
                // --- THÊM KHỐI NÀY ---
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Không tìm thấy bất động sản này hoặc đã bị xóa.");
                }
                throw new Error('HTTP error! Status: ' + response.status);
            }
            const data = await response.json();
            fillForm(data); // Điền dữ liệu vào form
            $('#loading-spinner').addClass('d-none');
            $('#edit-bds-form-container').removeClass('d-none');
        } catch (error) {
            console.error('Lỗi khi tải chi tiết BĐS:', error);
            showError("Lỗi khi tải thông tin bất động sản: " + error.message);
        }
    }

    // Điền dữ liệu vào form
    function fillForm(data) {
        $('#bdsId').val(data.maBds);
        $('#tieuDe').val(data.tieuDe);
        $('#moTa').val(data.moTa);
        $('#gia').val(data.gia);
        $('#donViTien').val(data.donViTien || 'VND');
        $('#loaiBds').val(data.loaiBds);
        $('#trangThai').val(data.trangThai);
        $('#viTri').val(data.viTri);
        $('#dienTich').val(data.dienTich); // Sửa lỗi chính tả: dienTich
        $('#soPhongNgu').val(data.soPhongNgu);
        $('#soPhongTam').val(data.soPhongTam);
        $('#tongTang').val(data.tongTang);
        $('#namXayDung').val(data.namXayDung); // Sửa lỗi chính tả: namXayDung
        $('#noiThat').val(data.noiThat);

        // Checkboxes
        $('#baiDoXe').prop('checked', data.baiDoXe);
        $('#banCong').prop('checked', data.banCong);
        $('#thangMay').prop('checked', data.thangMay);

        // Xử lý ảnh chính
        currentMainImageUrl = data.anhChinh || null;
        renderMainImagePreview();

        // Xử lý các ảnh bổ sung (duongDan) - CHỈ HIỂN THỊ, KHÔNG CHO CHỈNH SỬA
        // Frontend sẽ hiển thị ảnh phụ nếu có, nhưng sẽ không gửi bất kỳ thay đổi nào liên quan đến chúng lên backend.
        $('#currentDuongDan').empty();
        if (data.duongDan && Array.isArray(data.duongDan) && data.duongDan.length > 0) {
            data.duongDan.forEach(url => {
                $('#currentDuongDan').append(`
                    <div class="image-preview">
                        <img src="${url}" alt="Ảnh bổ sung">
                        </div>
                `);
            });
        } else {
             $('#currentDuongDan').text('Chưa có ảnh bổ sung.');
        }
    }

    // Hàm render ảnh chính preview
    function renderMainImagePreview() {
        $('#currentAnhChinh').empty();
        if (newMainImageFile) { // Nếu có ảnh chính mới được chọn (dạng file)
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#currentAnhChinh').html(`
                    <div class="image-preview">
                        <img src="${e.target.result}" alt="Ảnh chính mới">
                        <button type="button" class="remove-image" data-type="main-new">&times;</button>
                    </div>
                `);
            };
            reader.readAsDataURL(newMainImageFile);
        } else if (currentMainImageUrl && !isCurrentMainImageRemoved) { // Nếu có ảnh chính cũ và chưa bị xóa
            $('#currentAnhChinh').html(`
                <div class="image-preview">
                    <img src="${currentMainImageUrl}" alt="Ảnh chính hiện tại">
                    <button type="button" class="remove-image" data-type="main-old">&times;</button>
                </div>
            `);
        } else {
            $('#currentAnhChinh').text('Chưa có ảnh chính.');
        }
    }


    // Xử lý thay đổi ảnh chính từ input file
    $('#anhChinhFile').on('change', function() { // Đảm bảo ID này khớp với HTML: anhChinhFile
        newMainImageFile = this.files[0]; // Lấy file mới
        isCurrentMainImageRemoved = false; // Reset cờ xóa ảnh cũ khi có ảnh mới
        renderMainImagePreview();
    });

    // Xử lý click nút xóa ảnh (chỉ ảnh chính)
    $(document).on('click', '.remove-image', function() {
        const $this = $(this);
        const imageType = $this.data('type');

        if (imageType === 'main-old') { // Xóa ảnh chính cũ
            isCurrentMainImageRemoved = true;
            newMainImageFile = null; // Đảm bảo không có file mới được gửi nếu ảnh cũ bị xóa
            // Không cần thêm vào removedImageUrls vì logic backend chỉ cần cờ `removeCurrentMainImage`
        } else if (imageType === 'main-new') { // Xóa ảnh chính mới
            newMainImageFile = null;
        }
        renderMainImagePreview(); // Cập nhật giao diện preview
    });


    // Xử lý submit form
    $('#editBdsForm').on('submit', async function(e) {
        e.preventDefault(); // Ngăn chặn form submit mặc định

        $('#loading-spinner').removeClass('d-none'); // Hiển thị spinner
const token = localStorage.getItem('access_token');
        if (!token) {
            alert("Token không hợp lệ. Vui lòng đăng nhập lại.");
            localStorage.clear();
            window.location.href = '/Building_web_fe/login.html';
            return;
        }
        const formData = new FormData();
        // Không cần gửi 'maBds' trong FormData nếu bạn lấy từ PathVariable ở backend
        // Nếu backend yêu cầu, hãy thêm: formData.append('maBds', bdsId);
        formData.append('tieuDe', $('#tieuDe').val());
        formData.append('moTa', $('#moTa').val());
        formData.append('gia', parseFloat($('#gia').val()));
        formData.append('donViTien', $('#donViTien').val());
        formData.append('loaiBds', $('#loaiBds').val());
        formData.append('trangThai', $('#trangThai').val());
        formData.append('viTri', $('#viTri').val());
        formData.append('dienTich', parseFloat($('#dienTich').val())); // Đã sửa #dienTien thành #dienTich
        formData.append('soPhongNgu', parseInt($('#soPhongNgu').val()));
        formData.append('soPhongTam', parseInt($('#soPhongTam').val()));
        formData.append('tongTang', parseInt($('#tongTang').val()));
        formData.append('namXayDung', parseInt($('#namXayDung').val())); // Đã sửa #namXayDajung thành #namXayDung
        formData.append('noiThat', $('#noiThat').val());

        // Checkboxes
        formData.append('baiDoXe', $('#baiDoXe').prop('checked'));
        formData.append('banCong', $('#banCong').prop('checked'));
        formData.append('thangMay', $('#thangMay').prop('checked'));

        // Xử lý ảnh chính: ưu tiên file mới, sau đó đến cờ xóa ảnh cũ
        if (newMainImageFile) {
            formData.append('anhChinhFile', newMainImageFile);
        } else if (isCurrentMainImageRemoved) {
            formData.append('removeCurrentMainImage', true);
        }
        // Nếu không có newMainImageFile và isCurrentMainImageRemoved là false,
        // thì backend sẽ hiểu là giữ nguyên ảnh chính hiện tại (currentMainImageUrl)
        // và không cần gửi thêm gì cho ảnh chính.

        // KHÔNG GỬI BẤT KỲ DỮ LIỆU nào liên quan đến ảnh phụ (duongDanFiles, removedImageUrls, remainingImageUrls)
        // để backend không cần xử lý chúng.

        try {
            const response = await fetch(API_UPDATE_ENDPOINT, {
                method: 'PUT', // Đảm bảo khớp với method API backend
                body: formData, // FormData tự động set Content-Type
                headers: {
                    'Authorization': 'Bearer ' + token
                    // (Không cần 'Content-Type' khi dùng FormData)
                }
            });

            if (!response.ok) {
                // Cố gắng đọc lỗi từ response body nếu có
                const errorData = await response.json().catch(() => ({ message: 'Lỗi server không rõ hoặc phản hồi không phải JSON.' }));
                throw new Error(errorData.message || `Lỗi khi cập nhật BĐS: ${response.statusText} (Status: ${response.status})`);
            }

            const result = await response.json(); // Đảm bảo backend trả về JSON
            alert('Cập nhật bất động sản thành công!');
            console.log('API Response:', result);
            window.location.href = 'Buldinh_admin_ctsp.html?id=' + bdsId; // Chuyển về trang chi tiết

        } catch (error) {
            console.error('Lỗi khi cập nhật BĐS:', error);
            alert('Có lỗi xảy ra khi cập nhật bất động sản: ' + error.message);
        } finally {
            $('#loading-spinner').addClass('d-none'); // Ẩn spinner
        }
    });

    function showError(message) {
        $('#loading-spinner').addClass('d-none');
        $('#edit-bds-form-container').empty().html(`
            <div class="alert alert-danger text-center container my-5">
                <strong>Lỗi!</strong> ${message}
            </div>
        `).removeClass('d-none');
    }

    loadBdsDetail();
});