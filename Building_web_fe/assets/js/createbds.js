  // Hàm xử lý lỗi API chung
    function handleApiError(jqXHR, errorContainer) {
        if (jqXHR.status === 401 || jqXHR.status === 403) {
            alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            localStorage.removeItem('user_avatar');
            window.location.href = '/Building_web_fe/login.html';
        } else {
            let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
            if (jqXHR.responseJSON) {
                if (Array.isArray(jqXHR.responseJSON)) {
                    msg = jqXHR.responseJSON.join('\n');
                } else if (jqXHR.responseJSON.message) {
                    msg = jqXHR.responseJSON.message;
                }
            } else if (jqXHR.responseText) {
                 try {
                    msg = JSON.parse(jqXHR.responseText).message || msg;
                } catch(e) { 
                    msg = jqXHR.responseText; 
                }
            }
            errorContainer.text(msg).removeClass('d-none');
        }
    }

    // Hàm hiển thị ảnh preview
    function renderPreview(file, container, isMainImage = false) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = $(`
                <div class="image-preview-item">
                    <img src="${e.target.result}" />
                    <span class="remove-image" data-file-name="${file.name}">&times;</span>
                    ${isMainImage ? '<span class="main-image-label">Ảnh chính</span>' : ''}
                </div>
            `);
            
            // Xử lý nút xóa
            previewItem.find('.remove-image').on('click', function() {
                previewItem.remove();
                // (Cần logic phức tạp hơn nếu muốn xóa file khỏi input 'files')
                // Hiện tại, chỉ xóa preview.
                if(isMainImage) {
                    $('#mainImageFile').val(''); // Xóa file khỏi input chính
                }
            });

            container.append(previewItem);
        }
        reader.readAsDataURL(file);
    }

    // Gắn sự kiện cho input file
    $(document).ready(function() {
        
        // Xem trước ảnh chính (chỉ 1 ảnh)
        $('#mainImageFile').on('change', function(e) {
            const container = $('#mainImagePreview');
            container.empty(); // Xóa ảnh chính cũ
            if (this.files.length > 0) {
                renderPreview(this.files[0], container, true);
            }
        });

        // Xem trước ảnh phụ (nhiều ảnh)
        $('#otherImageFiles').on('change', function(e) {
            const container = $('#otherImagesPreview');
            container.empty(); // Xóa các ảnh phụ cũ
            if (this.files.length > 5) {
                alert('Bạn chỉ được phép tải lên tối đa 5 ảnh phụ.');
                $(this).val(''); // Xóa các file đã chọn
                return;
            }
            if (this.files.length > 0) {
                Array.from(this.files).forEach(file => {
                    renderPreview(file, container, false);
                });
            }
        });


        // --- XỬ LÝ SUBMIT FORM ---
        $('#dangTinForm').on('submit', function(e) {
            e.preventDefault();

            const form = $(this);
            const token = localStorage.getItem('access_token');
            const errorContainer = $('#formError');
            const successContainer = $('#formSuccess');
            const submitButton = $('#submitButton');
            const submitSpinner = $('#submitSpinner');
            const submitButtonText = $('#submitButtonText');
            
            // API Endpoint (Khớp với BatDongSanController)
            const API_ENDPOINT = 'http://localhost:8081/api/admin/dangtin';

            if (!token) {
                handleApiError({ status: 401 });
                return;
            }
            
            // Ẩn thông báo cũ
            errorContainer.addClass('d-none').text('');
            successContainer.addClass('d-none').text('');

            const getValueOrNull = (selector) => {
                const value = $(selector).val();
                return value === "" ? null : value;
            };
            // 1. Lấy dữ liệu từ Form (DTO)
            const jsonData = {
                tieuDe: $('#tieuDe').val(),
                moTa: $('#moTa').val(),

                loaiBds: getValueOrNull('#loaiBds'),
                mucDichTinDang: getValueOrNull('#mucDichTinDang'),
                gia: parseFloat($('#gia').val()) || null,
                donViTien: getValueOrNull('#donViTien'),
                dienTich: parseFloat($('#dienTich').val()) || null,

                soPhongNgu: parseInt($('#soPhongNgu').val()) || null,
                soPhongTam: parseInt($('#soPhongTam').val()) || null,
                tang: parseInt($('#tang').val()) || null,
                tongTang: parseInt($('#tongTang').val()) || null,
                baiDoXe: $('#baiDoXe').is(':checked'),
                banCong: $('#banCong').is(':checked'),
                thangMay: $('#thangMay').is(':checked'),
                viTri: $('#viTri').val(),
                quanHuyen: $('#quanHuyen').val(),
                thanhPho: $('#thanhPho').val(),
                noiThat: $('#noiThat').val() || null,
                namXayDung: parseInt($('#namXayDung').val()) || null
            };

            // 2. Lấy file ảnh
            const mainImageFile = $('#mainImageFile')[0].files[0];
            const otherImageFiles = $('#otherImageFiles')[0].files;

            if (!mainImageFile) {
                errorContainer.text('Vui lòng tải lên ít nhất một ảnh chính.').removeClass('d-none');
                return;
            }

            // 3. Tạo FormData
const formData = new FormData();
formData.append('data', new Blob([JSON.stringify(jsonData)], { type: "application/json" }));

            formData.append('mainImageFile', mainImageFile);
            
            if (otherImageFiles.length > 0) {
                Array.from(otherImageFiles).forEach(file => {
                    formData.append('otherImageFiles', file);
                });
            }

            // 4. Gửi AJAX
            $.ajax({
                url: API_ENDPOINT,
                type: 'POST',
                data: formData,
                processData: false, // Rất quan trọng
                contentType: false, // Rất quan trọng
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                beforeSend: function() {
                    submitButton.prop('disabled', true);
                    submitButtonText.text('Đang tải lên...');
                    submitSpinner.removeClass('d-none');
                },
                success: function(responseMessage) {
                    // responseMessage sẽ là "Đăng tin thành công!" hoặc "Yêu cầu... chờ duyệt!"
                    successContainer.text(responseMessage).removeClass('d-none');
                    form[0].reset(); // Xóa form
                    $('#mainImagePreview').empty();
                    $('#otherImagesPreview').empty();
                    window.scrollTo(0, 0); // Cuộn lên đầu trang
                },
                error: function(jqXHR) {
                    handleApiError(jqXHR, errorContainer);
                    window.scrollTo(0, 0); // Cuộn lên đầu trang
                },
                complete: function() {
                    submitButton.prop('disabled', false);
                    submitButtonText.text('Đăng Tin');
                    submitSpinner.addClass('d-none');
                }
            });
        });

    });