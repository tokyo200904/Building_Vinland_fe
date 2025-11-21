$(document).ready(function() {
    const API_URL = 'http://localhost:8081/api/moigioi';
    const moiGioiModal = new bootstrap.Modal(document.getElementById('moiGioiModal'));
    let currentId = null;

    function callApi(url, method, data = null, isMultipart = false) {
        const token = localStorage.getItem('access_token');
        const options = {
            url: url,
            method: method,
            headers: { 'Authorization': 'Bearer ' + token }
        };
        if (data) {
            options.data = data;
            if (isMultipart) {
                options.processData = false;
                options.contentType = false;
            } else {
                options.contentType = 'application/json';
                options.data = JSON.stringify(data);
            }
        }
        return $.ajax(options);
    }

    // --- 1. RENDER DANH SÁCH CÔNG TY (Giữ nguyên card công ty bạn đã thích) ---
    function loadList() {
        const container = $('#moiGioiContainer');
        callApi(API_URL, 'GET').done(function(list) {
            container.empty();
            if (list.length === 0) {
                container.html('<div class="col-12 text-center text-muted py-5"><h4>Chưa có công ty môi giới nào.</h4></div>');
                return;
            }
            list.forEach(item => {
                const imgUrl = item.hinhAnh || 'https://placehold.co/100x100/e9ecef/888?text=Logo';
                const employeeCount = item.danhSachNhanVien ? item.danhSachNhanVien.length : 0;

                const cardHtml = `
                <div class="col-md-6 col-lg-6 col-xl-4">
                    <div class="agency-card">
                        <div class="agency-actions-top">
                            <button class="btn btn-icon-sm btn-edit-custom btn-edit" data-id="${item.maMoiGioi}" title="Chỉnh sửa">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-icon-sm btn-delete-custom btn-delete" data-id="${item.maMoiGioi}" title="Xóa">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <div class="agency-logo-wrapper">
                            <img src="${imgUrl}" alt="${item.tenCongTy}">
                        </div>
                        <div class="agency-info">
                            <h5 class="agency-name" title="${item.tenCongTy}">${item.tenCongTy}</h5>
                            <div class="agency-detail">
                                <i class="bi bi-envelope-fill icon-email"></i>
                                <span class="text-truncate" title="${item.email}">${item.email}</span>
                            </div>
                            <div class="agency-detail">
                                <i class="bi bi-telephone-fill icon-phone"></i>
                                <span>${item.soDienThoai}</span>
                            </div>
                            <div class="agency-detail mt-1">
                                <i class="bi bi-geo-alt-fill icon-loc"></i>
                                <span class="text-truncate" title="${item.diaChi || ''}">${item.diaChi || 'Chưa cập nhật địa chỉ'}</span>
                            </div>
                            <div class="agency-detail mt-2">
                                <span class="badge bg-light text-dark border">
                                    <i class="bi bi-people-fill text-primary me-1"></i> ${employeeCount} Nhân viên
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                container.append(cardHtml);
            });
        }).fail(err => {
            container.html('<div class="col-12 text-center text-danger py-5">Lỗi tải danh sách.</div>');
        });
    }

    // --- 2. XỬ LÝ FORM & VALIDATION (Giữ nguyên) ---
    function resetForm() {
        $('#moiGioiForm')[0].reset();
        $('.form-control').removeClass('is-invalid');
        $('#formAlert').addClass('d-none').text('');
        $('#previewContainer').html('<span class="text-muted small">Chưa có ảnh</span>');
    }

    function validateForm() {
        let isValid = true;
        $('.form-control').removeClass('is-invalid');
        const requiredFields = ['#tenCongTy', '#email', '#soDienThoai', '#diaChi'];
        requiredFields.forEach(selector => {
            const input = $(selector);
            if (!input.val().trim()) {
                input.addClass('is-invalid');
                isValid = false;
            }
        });
        return isValid;
    }

    // --- 3. RELOAD MODAL (CẬP NHẬT DANH SÁCH NHÂN VIÊN DẠNG CARD) ---
    function reloadModalData(id) {
        callApi(`${API_URL}/${id}`, 'GET').done(function(data) {
            // Điền Form (Giữ nguyên)
            $('#maMoiGioi').val(data.maMoiGioi);
            $('#tenCongTy').val(data.tenCongTy);
            $('#soGiayPhep').val(data.soGiayPhep);
            $('#email').val(data.email);
            $('#soDienThoai').val(data.soDienThoai);
            $('#diaChi').val(data.diaChi);
            $('#gioiThieu').val(data.gioiThieu);
            
            if (data.hinhAnh) {
                $('#previewContainer').html(`<img src="${data.hinhAnh}" style="max-width:100%; max-height:100px;">`);
            } else {
                $('#previewContainer').html('<span class="text-muted small">Chưa có ảnh</span>');
            }

            // --- HIỂN THỊ NHÂN VIÊN (GRID CARD NGANG) ---
            const empContainer = $('#employeeListContainer');
            empContainer.empty();

            if (data.danhSachNhanVien && data.danhSachNhanVien.length > 0) {
                data.danhSachNhanVien.forEach(nv => {
                    const avatar = nv.anhDaiDien || 'https://placehold.co/50x50/e9ecef/888?text=U';
                    
                    // HTML Card Nhân viên mới
                    const empCard = `
                    <div class="col-md-6">
                        <div class="employee-card-horizontal">
                            
                            <!-- Avatar bên trái -->
                            <div class="emp-avatar-wrapper">
                                <img src="${avatar}" alt="User">
                            </div>
                            
                            <!-- Thông tin ở giữa -->
                            <div class="emp-info">
                                <div class="emp-name" title="${nv.hoTen}">${nv.hoTen || 'Chưa cập nhật tên'}</div>
                                <div class="emp-details">
                                    <span><i class="bi bi-envelope"></i> ${nv.email}</span>
                                    <span><i class="bi bi-telephone"></i> ${nv.soDienThoai || '---'}</span>
                                </div>
                            </div>
                            
                            <!-- Nút xóa bên phải -->
                            <div class="emp-action">
                                <button class="btn btn-remove-emp" data-uid="${nv.userId}" title="Gỡ nhân viên này khỏi công ty">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    `;
                    empContainer.append(empCard);
                });
            } else {
                empContainer.html('<div class="col-12 text-center text-muted py-3 small">Chưa có nhân viên nào.</div>');
            }
            
            if (!$('#moiGioiModal').hasClass('show')) {
                moiGioiModal.show();
            }
        });
    }

    // --- CÁC SỰ KIỆN (Giữ nguyên) ---

    $('#btnAddMoiGioi').click(function() {
        currentId = null;
        resetForm();
        $('#modalTitle').text('Thêm Công Ty Mới');
        $('#employeeSection').hide();
        moiGioiModal.show();
    });

    $(document).on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        currentId = id;
        resetForm();
        $('#modalTitle').text('Cập Nhật Công Ty');
        $('#employeeSection').show();
        reloadModalData(id);
    });

    $('#btnAddEmployee').click(function() {
        const emailNv = $('#newEmployeeEmail').val();
        if (!emailNv) { alert('Vui lòng nhập email.'); return; }
        
        callApi(`${API_URL}/${currentId}/them`, 'POST', { emailNhanVien: emailNv }).done(function(msg) {
            alert(msg);
            $('#newEmployeeEmail').val('');
            reloadModalData(currentId);
        }).fail(err => { alert('Lỗi: ' + (err.responseText || 'Không tìm thấy user')); });
    });

    $(document).on('click', '.btn-remove-emp', function() {
        const userId = $(this).data('uid');
        if (confirm('Bạn có chắc chắn muốn gỡ nhân viên này khỏi công ty?')) {
            callApi(`${API_URL}/${currentId}/xoa/${userId}`, 'DELETE').done(function() {
                reloadModalData(currentId);
            }).fail(err => { alert('Lỗi: ' + err.responseText); });
        }
    });

    $('#btnSave').click(function() {
        if (!validateForm()) return;

        const dto = {
            maMoiGioi: currentId,
            tenCongTy: $('#tenCongTy').val().trim(),
            soGiayPhep: $('#soGiayPhep').val().trim(),
            email: $('#email').val().trim(),
            soDienThoai: $('#soDienThoai').val().trim(),
            diaChi: $('#diaChi').val().trim(),
            gioiThieu: $('#gioiThieu').val().trim()
        };

        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(dto)], { type: "application/json" }));
        const fileInput = $('#imageFile')[0];
        if (fileInput.files.length > 0) {
            formData.append('imageFile', fileInput.files[0]);
        }

        callApi(API_URL, 'POST', formData, true).done(function(msg) {
            alert(msg);
            moiGioiModal.hide();
            loadList();
        }).fail(err => {
            let errorMsg = 'Có lỗi xảy ra.';
            if (err.responseText) errorMsg = err.responseText;
            $('#formAlert').text(errorMsg).removeClass('d-none');
        });
    });

    $(document).on('click', '.btn-delete', function() {
        if (confirm('Xóa công ty này?')) {
            callApi(`${API_URL}/${$(this).data('id')}`, 'DELETE').done(function(msg) {
                alert(msg);
                loadList();
            });
        }
    });

    loadList();
});