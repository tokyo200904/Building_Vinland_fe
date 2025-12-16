$(document).ready(function() {
    
    // --- CẤU HÌNH ---
    const API_BASE = 'http://localhost:8081/api/admin/user';
    const token = localStorage.getItem('access_token');
    const $container = $('#userListContainer');
    const $searchInput = $('#searchInput');
    const editModal = new bootstrap.Modal(document.getElementById('editRoleModal'));
    
    let currentActiveRole = 'ADMIN'; 
    let searchTimer;

    // --- TEMPLATE CARD ---
    function createUserCard(user) {
        // Fallback ảnh đại diện
        const avatarUrl = user.anhDaiDien || 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=' + (user.hoTen ? user.hoTen[0] : 'U');
        const roleClass = `role-${user.vaiTro.toLowerCase()}`;
        const isSelf = (user.email === localStorage.getItem('user_email')); 
        const isAdmin = user.vaiTro === 'ADMIN';

        let actionsHtml = ''; 

        if (!isSelf) { 
            // Nút Sửa vai trò: Chỉ disable nếu user kia là ADMIN (backend chặn sửa Admin khác)
            actionsHtml += `
                <button class="btn btn-primary edit-btn" title="Sửa vai trò" 
                        data-id="${user.userId}" 
                        data-name="${user.hoTen || user.email}" 
                        data-role="${user.vaiTro}"
                        ${isAdmin ? 'disabled' : ''}>
                    <i class="bi bi-pencil-square"></i>
                </button>
            `;

            // Nút Cấm / Bỏ cấm
            if (user.banned) {
                actionsHtml += `
                    <button class="btn btn-success unban-btn" title="Bỏ cấm" 
                            data-id="${user.userId}" data-name="${user.hoTen || user.email}">
                        <i class="bi bi-unlock-fill"></i>
                    </button>
                `;
            } else {
                actionsHtml += `
                    <button class="btn btn-danger ban-btn" title="Cấm" 
                            data-id="${user.userId}" data-name="${user.hoTen || user.email}"
                            ${isAdmin ? 'disabled' : ''}> 
                        <i class="bi bi-lock-fill"></i>
                    </button>
                `;
            }
        }

        return `
            <div class="list-group-item user-list-item ${user.banned ? 'is-banned' : ''}" id="user-row-${user.userId}">
                <div class="user-avatar-col">
                    <img src="${avatarUrl}" alt="${user.hoTen}" class="user-avatar">
                </div>
                <div class="user-info-col">
                    <p class="user-name">${user.hoTen || '(Chưa có tên)'}</p>
                    <p class="user-email">${user.email}</p>
                    <p class="user-phone">
                        <i class="bi bi-phone"></i> ${user.soDienThoai || 'Chưa có SĐT'}
                    </p>
                    <span class="role-badge ${roleClass}">${user.vaiTro}</span>
                </div>
                <div class="user-actions-col">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    // --- HÀM TẢI DỮ LIỆU ---
    function loadUsers(role, searchTerm = '') {
        if (!token) {
            handleApiError({ status: 401 });
            return;
        }
        $container.html('<div class="list-message">Đang tải...</div>');

        // Gửi role lên server. Lưu ý: role phải khớp với Enum Java (NHANVIEN, CUSTOMER, etc.)
        $.ajax({
            url: `${API_BASE}?role=${role}&search=${encodeURIComponent(searchTerm)}`,
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(users) {
                if (!users || users.length === 0) {
                    $container.html('<div class="list-message">Không tìm thấy người dùng nào.</div>');
                    return;
                }
                $container.empty();
                users.forEach(user => {
                    $container.append(createUserCard(user));
                });
            },
            error: function(jqXHR) {
                $container.html('<div class="list-message text-danger">Lỗi tải dữ liệu.</div>');
                handleApiError(jqXHR);
            }
        });
    }

    // --- HÀM GỌI API CHUNG ---
    function callApi(url, method, $button, data = null) { 
        const originalIcon = $button.html();
        $button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

        const ajaxOptions = {
            url: url,
            type: method,
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json' 
            },
            processData: false
        };

        if (data) {
            ajaxOptions.data = JSON.stringify(data);
        }

        return $.ajax(ajaxOptions).fail(function(jqXHR) { 
            handleApiError(jqXHR);
            // Hiển thị message lỗi từ Backend trả về (nếu có)
            let msg = 'Lỗi không xác định';
            if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
                msg = jqXHR.responseJSON.message;
            } else if (jqXHR.responseText) {
                msg = jqXHR.responseText;
            }
            alert('Thao tác thất bại: ' + msg);
        }).always(function() {
             if ($button.prop('disabled')) { 
                 $button.prop('disabled', false).html(originalIcon);
             }
        });
    }

    // --- SỰ KIỆN ---

    // 1. Chuyển Tab
    $('#userTabs button[data-bs-toggle="tab"]').on('click', function (e) {
        currentActiveRole = $(this).data('role');
        const $searchInput = $('#searchInput');
        $searchInput.val(''); 
        $searchInput.attr('placeholder', `Tìm kiếm trong ${$(this).text().trim()}...`);
        loadUsers(currentActiveRole);
    });

    // 2. Tìm kiếm
    $('#searchInput').on('keyup', function() {
        const searchTerm = $(this).val();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            loadUsers(currentActiveRole, searchTerm);
        }, 500);
    });

    // 3. Mở Modal Phân Quyền (ĐÃ SỬA LOGIC Ở ĐÂY)
    $container.on('click', '.edit-btn', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('name');
        const userRole = $(this).data('role'); // Role hiện tại của user đó
        
        $('#editUserId').val(userId);
        $('#editUserName').text(userName);
        
        const $roleSelect = $('#editUserRole');
        $roleSelect.empty();
        
        // Backend không cho phép set lên ADMIN, nên dropdown chỉ hiện 3 role dưới
        // Backend cho phép chuyển tự do giữa 3 role này
        const roles = [
            { val: 'CUSTOMER', text: 'Người dùng (Customer)' },
            { val: 'AGENT', text: 'Môi giới (Agent)' },
            { val: 'NHANVIEN', text: 'Nhân viên (Staff)' }
        ];

        roles.forEach(role => {
            // Kiểm tra role hiện tại để set attribute 'selected'
            const isSelected = (role.val === userRole) ? 'selected' : '';
            $roleSelect.append(`<option value="${role.val}" ${isSelected}>${role.text}</option>`);
        });
        
        editModal.show();
    });

    // 4. Lưu Phân Quyền
    $('#saveRoleButton').on('click', function() {
        const $button = $(this);
        const userId = $('#editUserId').val();
        const newRole = $('#editUserRole').val();

        callApi(`${API_BASE}/${userId}/role`, 'PUT', $button, { newRole: newRole })
            .done(() => {
                editModal.hide();
                alert('Cập nhật vai trò thành công!');
                loadUsers(currentActiveRole, $searchInput.val());
            });
    });

    // 5. Cấm tài khoản
    $container.on('click', '.ban-btn', function() {
        const $button = $(this);
        const userId = $button.data('id');
        const userName = $button.data('name');

        if (!confirm(`Bạn có chắc muốn cấm tài khoản ${userName}?`)) return;

        callApi(`${API_BASE}/${userId}/ban`, 'POST', $button)
            .done(() => {
                alert(`Đã cấm tài khoản ${userName} thành công!`);
                reloadUserCard(userId);
            });
    });

    // 6. Bỏ cấm
    $container.on('click', '.unban-btn', function() {
        const $button = $(this);
        const userId = $button.data('id');
        const userName = $button.data('name');
        
        if (!confirm(`Bạn có chắc muốn bỏ cấm tài khoản ${userName}?`)) return;

        callApi(`${API_BASE}/${userId}/unban`, 'POST', $button)
            .done(() => {
                alert(`Đã bỏ cấm tài khoản ${userName} thành công!`);
                reloadUserCard(userId);
            });
    });
    
    // --- HELPER ---
    function reloadUserCard(userId) {
        $.ajax({
            url: `${API_BASE}/${userId}`,
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(user) {
                const $oldCard = $(`#user-row-${userId}`);
                if ($oldCard.length) {
                    $oldCard.replaceWith(createUserCard(user));
                }
            },
            error: function() {
                loadUsers(currentActiveRole, $searchInput.val());
            }
        });
    }

    function handleApiError(jqXHR) {
        if (jqXHR.status === 401 || jqXHR.status === 403) {
            alert('Phiên làm việc hết hạn. Vui lòng đăng nhập lại.');
            localStorage.clear();
            window.location.href = 'Building_trangchu.html';
        } else {
            console.error('Lỗi API:', jqXHR);
        }
    }

    // --- INIT ---
    loadUsers(currentActiveRole); 
});