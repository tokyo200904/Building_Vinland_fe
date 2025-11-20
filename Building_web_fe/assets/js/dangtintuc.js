// --- LOGIC CHO TRANG DANG-TIN-TUC.HTML ---

// 1. Khởi tạo Quill Editor
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'image', 'video'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    }
});

// 2. Hàm xử lý lỗi API (chung)
function handleApiError(jqXHR, errorContainer) {
    if (jqXHR.status === 401 || jqXHR.status === 403) {
        alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        localStorage.clear();
        window.location.href = '/Building_web_fe/login.html';
    } else {
        let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        if (jqXHR.responseJSON) {
            msg = jqXHR.responseJSON.message || (Array.isArray(jqXHR.responseJSON) ? jqXHR.responseJSON.join('\n') : msg);
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

// 3. Xử lý logic Form
$(document).ready(function() {

    const API_ENDPOINT = 'http://localhost:8081/api/admin/tintuc/dangtin';
    const form = $('#dangTinTucForm');
    const errorContainer = $('#formError');
    const successContainer = $('#formSuccess');
    const submitButton = $('#submitButton');
    const submitSpinner = $('#submitSpinner');
    const submitButtonText = $('#submitButtonText');

    // 3a. Xem trước ảnh
    $('#anhDaiDienFile').on('change', function(e) {
        const container = $('#imagePreview');
        container.empty();
        if (this.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                container.html(`<div class="image-preview-item"><img src="${e.target.result}" /></div>`);
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // 3b. Tự động tạo slug (đường dẫn)
    $('#tieuDe').on('keyup', function() {
        const tieuDe = $(this).val();
        $('#duongDan').val(slugify(tieuDe));
    });

    // 3c. Xử lý Submit
    form.on('submit', function(e) {
        e.preventDefault();

        const token = localStorage.getItem('access_token');
        if (!token) {
            handleApiError({ status: 401 });
            return;
        }

        errorContainer.addClass('d-none').text('');
        successContainer.addClass('d-none').text('');

        // 1. Lấy dữ liệu DTO
        const jsonData = {
            tieuDe: $('#tieuDe').val(),
            duongDan: $('#duongDan').val(),
            ngayXuatBan: $('#ngayXuatBan').val() ? $('#ngayXuatBan').val() : null,
            noiDung: quill.root.innerHTML 
        };

        // 2. Lấy file ảnh
        const anhDaiDienFile = $('#anhDaiDienFile')[0].files[0];

        // 3. Kiểm tra dữ liệu
        if (!jsonData.tieuDe || !jsonData.duongDan || !jsonData.noiDung || jsonData.noiDung === '<p><br></p>') {
            handleApiError({ responseText: 'Vui lòng nhập đầy đủ Tiêu đề, Đường dẫn và Nội dung.' }, errorContainer);
            return;
        }
        // (Bỏ yêu cầu ảnh bắt buộc vì Backend đã 'required = false')
        // if (!anhDaiDienFile) {
        //      handleApiError({ responseText: 'Vui lòng tải lên một ảnh đại diện.' }, errorContainer);
        //     return;
        // }

        // 4. Tạo FormData
        const formData = new FormData();
        
        // --- THAY ĐỔI QUAN TRỌNG ---
        // Gửi DTO dưới dạng Blob (Cục dữ liệu)
        // Spring Boot sẽ tự động "dịch" nó sang DTO
        formData.append('data', new Blob([JSON.stringify(jsonData)], {
            type: "application/json"
        }));
        // -------------------------
        
        if (anhDaiDienFile) {
             formData.append('anhDaiDienFile', anhDaiDienFile);
        }

        // 5. Gửi AJAX
        $.ajax({
            url: API_ENDPOINT,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'Authorization': 'Bearer ' + token },
            beforeSend: function() {
                submitButton.prop('disabled', true);
                submitButtonText.text('Đang tải lên...');
                submitSpinner.removeClass('d-none');
            },
            success: function(responseMessage) {
                // (Backend trả về "Đăng thành công" hoặc "Chờ duyệt")
                successContainer.text(responseMessage).removeClass('d-none');
                form[0].reset();
                quill.root.innerHTML = '';
                $('#imagePreview').empty();
                window.scrollTo(0, 0);
            },
            error: function(jqXHR) {
                handleApiError(jqXHR, errorContainer);
                window.scrollTo(0, 0);
            },
            complete: function() {
                submitButton.prop('disabled', false);
                submitButtonText.text('Gửi Bài Viết');
                submitSpinner.addClass('d-none');
            }
        });
    });
});


// === HÀM TIỆN ÍCH TẠO SLUG ===
function slugify(text) {
  text = text.toString().toLowerCase().trim()
    .normalize('NFD') // Tách dấu
    .replace(/[\u0300-\u036f]/g, ''); // Xóa dấu

  const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
  const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd";
  
  for (let i = 0, l = from.length; i < l; i++) {
    text = text.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  return text
    .replace(/[^a-z0-9 -]/g, '') // Xóa các ký tự không phải a-z, 0-9, -
    .replace(/\s+/g, '-') // Thay khoảng trắng bằng -
    .replace(/-+/g, '-'); // Xóa các dấu - thừa
}