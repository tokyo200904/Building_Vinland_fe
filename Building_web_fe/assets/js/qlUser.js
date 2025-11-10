$(document).ready(function() {
    
    // --- CẤU HÌNH ---
    const API_BASE = 'http://localhost:8081/api/admin/user';
    const token = localStorage.getItem('access_token');
    const $container = $('#userListContainer');
    const $searchInput = $('#searchInput');
    const editModal = new bootstrap.Modal(document.getElementById('editRoleModal'));
    
    let currentActiveRole = 'ADMIN'; // Tab mặc định
    let searchTimer;

    // --- TEMPLATE CARD (Mẫu HTML) ---
   function createUserCard(user) {
    const avatarUrl = user.anhDaiDien || 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=' + (user.hoTen ? user.hoTen[0] : 'U');
    const roleClass = `role-${user.vaiTro.toLowerCase()}`;
    const isSelf = (user.email === localStorage.getItem('user_email')); 
    const isAdmin = user.vaiTro === 'ADMIN';

    let actionsHtml = ''; // Sẽ chứa HTML cho các nút hành động

    if (!isSelf) { // Nếu không phải tài khoản của admin đang đăng nhập
        // Nút Sửa vai trò
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
            // Tài khoản đã bị cấm -> hiển thị nút BỎ CẤM (màu xanh, icon check)
            actionsHtml += `
                <button class="btn btn-success unban-btn" 
                        title="Bỏ cấm" 
                        data-id="${user.userId}" 
                        data-name="${user.hoTen || user.email}">
                    <i class="bi bi-unlock-fill"></i>
                </button>
            `;
        } else {
            // Tài khoản chưa bị cấm -> hiển thị nút CẤM (màu đỏ, icon thùng rác)
            actionsHtml += `
                <button class="btn btn-danger ban-btn" 
                        title="Cấm" 
                        data-id="${user.userId}" 
                        data-name="${user.hoTen || user.email}"
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
                <span class="role-badge ${roleClass}">${user.vaiTro.replace('_', ' ')}</span>
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

        $.ajax({
            url: `${API_BASE}?role=${role}&search=${encodeURIComponent(searchTerm)}`,
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(users) {
                if (!users || users.length === 0) {
                    $container.html('<div class="list-message">Không tìm thấy người dùng nào.</div>');
                    return;
                }
                $container.empty(); // Xóa loading
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

    // --- HÀM GỌI API CHUNG (CHO NÚT BẤM) ---
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
            alert('Thao tác thất bại: ' + (jqXHR.responseJSON?.message || jqXHR.responseText || 'Lỗi không xác định'));
        }).always(function() {
            // Sửa lỗi nhỏ: chỉ khôi phục icon nếu request thất bại
             if ($button.prop('disabled')) { // Nếu .fail() đã chạy
                 $button.prop('disabled', false).html(originalIcon);
             }
        });
    }

    // --- CÁC BỘ LẮNG NGHE SỰ KIỆN ---

    // 1. Khi một tab được nhấn
    $('#userTabs button[data-bs-toggle="tab"]').on('click', function (e) {
        currentActiveRole = $(this).data('role');
        const $searchInput = $('#searchInput');
        $searchInput.val(''); // Xóa tìm kiếm cũ
        $searchInput.attr('placeholder', `Tìm kiếm trong ${$(this).text().trim()}...`);
        loadUsers(currentActiveRole);
    });

    // 2. Tìm kiếm (chờ 500ms sau khi gõ)
    $('#searchInput').on('keyup', function() {
        const searchTerm = $(this).val();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            loadUsers(currentActiveRole, searchTerm);
        }, 500);
    });

    // 3. Mở Modal Phân Quyền (Nút Sửa)
    $container.on('click', '.edit-btn', function() {
        const userId = $(this).data('id');
        const userName = $(this).data('name');
        const userRole = $(this).data('role');
        
        $('#editUserId').val(userId);
        $('#editUserName').text(userName);
        
        const $roleSelect = $('#editUserRole');
        $roleSelect.empty();
        
        if (userRole === 'ADMIN' || userRole === 'NHANVIEN') {
            $roleSelect.append(`<option value="NHANVIEN" ${userRole === 'NHANVIEN' ? 'selected' : ''}>Nhân viên</option>`);
            $roleSelect.append(`<option value="ADMIN" ${userRole === 'ADMIN' ? 'selected' : ''}>Admin</option>`);
        } else { // AGENT hoặc CUSTOMER
            $roleSelect.append(`<option value="CUSTOMER" ${userRole === 'CUSTOMER' ? 'selected' : ''}>Người dùng</option>`);
            $roleSelect.append(`<option value="AGENT" ${userRole === 'AGENT' ? 'selected' : ''}>Agent</option>`);
        }
        
        editModal.show();
    });

    // 4. Lưu Phân Quyền (Trong Modal)
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

    // 5. Cấm tài khoản (Nút Xóa/Cấm)
    $container.on('click', '.ban-btn', function() {
        const $button = $(this);
        const userId = $button.data('id');
        const userName = $button.data('name');

        if (!confirm(`Bạn có chắc muốn cấm tài khoản ${userName}?`)) return;

        callApi(`${API_BASE}/${userId}/ban`, 'POST', $button)
            .done(() => {
                // --- ĐÃ THÊM THÔNG BÁO ---
                alert(`Đã cấm tài khoản ${userName} thành công!`);
                reloadUserCard(userId); // Tải lại chỉ card này
            });
    });

    // 6. Bỏ cấm tài khoản
    $container.on('click', '.unban-btn', function() {
        const $button = $(this);
        const userId = $button.data('id');
        const userName = $button.data('name');
        
        // --- ĐÃ THÊM XÁC NHẬN ---
        if (!confirm(`Bạn có chắc muốn bỏ cấm tài khoản ${userName}?`)) return;

        callApi(`${API_BASE}/${userId}/unban`, 'POST', $button)
            .done(() => {
                // --- ĐÃ THÊM THÔNG BÁO ---
                alert(`Đã bỏ cấm tài khoản ${userName} thành công!`);
                reloadUserCard(userId); // Tải lại chỉ card này
            });
    });
    
    // --- HÀM TIỆN ÍCH ---

    // Tải lại 1 card sau khi Cấm/Bỏ cấm
    function reloadUserCard(userId) {
        $.ajax({
            url: `${API_BASE}/${userId}`, // API lấy 1 user
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(user) {
                const $oldCard = $(`#user-row-${userId}`);
                if ($oldCard.length) {
                    // Thay thế card cũ bằng card mới đã cập nhật
                    $oldCard.replaceWith(createUserCard(user));
                }
            },
            error: function(jqXHR) {
                // Nếu lỗi (ví dụ user bị xóa) thì tải lại cả list
                loadUsers(currentActiveRole, $searchInput.val());
            }
        });
    }

    // Xử lý lỗi (Đá về login)
    function handleApiError(jqXHR) {
        if (jqXHR.status === 401 || jqXHR.status === 403) {
            alert('Phiên đăng nhập đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
            localStorage.clear();
            window.location.href = '/Building_web_fe/login.html';
        } else {
            console.error('Lỗi API:', jqXHR.responseJSON || jqXHR.responseText);
        }
    }

    // --- KHỞI CHẠY ---
    loadUsers(currentActiveRole); // Tải tab Admin (mặc định)
});