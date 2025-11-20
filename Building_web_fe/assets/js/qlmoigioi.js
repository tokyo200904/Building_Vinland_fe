$(document).ready(function() {
    const API_URL = 'http://localhost:8081/api/moigioi';
    const moiGioiModal = new bootstrap.Modal(document.getElementById('moiGioiModal'));
    let currentId = null;

    // (Hàm callApi giữ nguyên)
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

    // (Hàm loadList giữ nguyên)
    function loadList() {
        const container = $('#moiGioiContainer');
        callApi(API_URL, 'GET').done(function(list) {
            container.empty();
            if (list.length === 0) {
                container.html('<div class="col-12 text-center text-muted py-5"><h4>Chưa có công ty môi giới nào.</h4></div>');
                return;
            }
            list.forEach(item => {
                const imgUrl = item.hinhAnh || 'https://placehold.co/100x100?text=Logo';
                
                // Thêm hiển thị số lượng nhân viên vào card (nếu muốn)
                const employeeCount = item.danhSachNhanVien ? item.danhSachNhanVien.length : 0;

                const cardHtml = `
                <div class="col-md-6 col-lg-4 col-xl-4">
                    <div class="agency-card position-relative">
                        <div class="agency-logo-wrapper">
                            <img src="${imgUrl}" alt="${item.tenCongTy}">
                        </div>
                        <div class="agency-info">
                            <h5 class="agency-name" title="${item.tenCongTy}">${item.tenCongTy}</h5>
                            <div class="agency-detail" title="${item.diaChi || ''}">
                                <i class="bi bi-geo-alt-fill"></i>
                                <span class="text-truncate">${item.diaChi || 'Chưa cập nhật địa chỉ'}</span>
                            </div>
                            <div class="agency-detail">
                                <i class="bi bi-telephone-fill"></i>
                                <span>${item.soDienThoai}</span>
                            </div>
                            <div class="agency-detail">
                                <i class="bi bi-people-fill"></i>
                                <span>${employeeCount} Nhân viên</span> <!-- Hiển thị số lượng -->
                            </div>
                        </div>
                        <div class="agency-actions">
                            <button class="btn btn-sm btn-light text-primary shadow-sm btn-edit me-1" data-id="${item.maMoiGioi}" title="Chỉnh sửa / Xem chi tiết">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="btn btn-sm btn-light text-danger shadow-sm btn-delete" data-id="${item.maMoiGioi}" title="Xóa">
                                <i class="bi bi-trash-fill"></i>
                            </button>
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

    // --- MỞ MODAL THÊM ---
    $('#btnAddMoiGioi').click(function() {
        currentId = null;
        $('#moiGioiForm')[0].reset();
        $('#modalTitle').text('Thêm Mới Môi Giới');
        $('#previewContainer').empty();
        
        // Ẩn danh sách nhân viên khi thêm mới
        $('#employeeListContainer').html('<p class="text-muted small">Danh sách nhân viên sẽ hiển thị sau khi tạo công ty.</p>');
        
        moiGioiModal.show();
    });

    // --- MỞ MODAL SỬA (VÀ XEM NHÂN VIÊN) ---
    $(document).on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        currentId = id;
        $('#modalTitle').text('Cập Nhật Môi Giới');
        
        callApi(`${API_URL}/${id}`, 'GET').done(function(data) {
            // 1. Điền thông tin công ty
            $('#maMoiGioi').val(data.maMoiGioi);
            $('#tenCongTy').val(data.tenCongTy);
            $('#soGiayPhep').val(data.soGiayPhep);
            $('#email').val(data.email);
            $('#soDienThoai').val(data.soDienThoai);
            $('#diaChi').val(data.diaChi);
            $('#gioiThieu').val(data.gioiThieu);
            
            if (data.hinhAnh) {
                $('#previewContainer').html(`<img src="${data.hinhAnh}" style="height:100px; border-radius:5px; border:1px solid #ddd;">`);
            } else {
                $('#previewContainer').empty();
            }

            // 2. Hiển thị danh sách nhân viên
            const empContainer = $('#employeeListContainer');
            empContainer.empty();

            if (data.danhSachNhanVien && data.danhSachNhanVien.length > 0) {
                let tableHtml = `
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Avatar</th>
                                    <th>Họ Tên</th>
                                    <th>Email</th>
                                    <th>SĐT</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                data.danhSachNhanVien.forEach(nv => {
                    const avatar = nv.anhDaiDien || 'https://placehold.co/30x30?text=U';
                    tableHtml += `
                        <tr>
                            <td class="text-center"><img src="${avatar}" style="width:30px; height:30px; border-radius:50%;"></td>
                            <td>${nv.hoTen || 'N/A'}</td>
                            <td>${nv.email}</td>
                            <td>${nv.soDienThoai || '-'}</td>
                        </tr>
                    `;
                });
                
                tableHtml += `</tbody></table></div>`;
                empContainer.html(tableHtml);
            } else {
                empContainer.html('<div class="alert alert-secondary">Công ty này chưa có nhân viên nào.</div>');
            }

            moiGioiModal.show();
        });
    });

    // --- XỬ LÝ LƯU (Giữ nguyên) ---
    $('#btnSave').click(function() {
        const dto = {
            maMoiGioi: currentId,
            tenCongTy: $('#tenCongTy').val(),
            soGiayPhep: $('#soGiayPhep').val(),
            email: $('#email').val(),
            soDienThoai: $('#soDienThoai').val(),
            diaChi: $('#diaChi').val(),
            gioiThieu: $('#gioiThieu').val()
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
            alert('Lỗi: ' + (err.responseText || 'Không thành công'));
        });
    });

    // --- XỬ LÝ XÓA (Giữ nguyên) ---
    $(document).on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        if (confirm('Bạn có chắc chắn muốn xóa môi giới này?')) {
            callApi(`${API_URL}/${id}`, 'DELETE').done(function(msg) {
                alert(msg);
                loadList();
            });
        }
    });

    // Load lần đầu
    loadList();
});