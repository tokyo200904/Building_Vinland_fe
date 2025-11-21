$(document).ready(function() {
    const API_BASE = 'http://localhost:8081/api/profile';
    
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

    // --- 1. LOAD THÔNG TIN PROFILE ---
    function loadProfile() {
        callApi(`${API_BASE}`, 'GET').done(function(user) {
            $('#overviewAvatar').attr('src', user.anhDaiDien || 'https://placehold.co/120x120');
            $('#overviewName').text(user.hoTen);
            
            let roleVi = user.vaiTro;
            if(user.vaiTro === 'ADMIN') roleVi = 'Quản trị viên';
            if(user.vaiTro === 'AGENT') roleVi = 'Môi giới';
            if(user.vaiTro === 'CUSTOMER') roleVi = 'Khách hàng';
            if(user.vaiTro === 'NHANVIEN') roleVi = 'Nhân viên';

            $('#overviewRole').text(roleVi);
            
            $('#viewFullName').text(user.hoTen);
            $('#viewAddress').text(user.diaChi || '(Chưa cập nhật)');
            $('#viewPhone').text(user.soDienThoai || '(Chưa cập nhật)');
            $('#viewEmail').text(user.email);
            $('#viewGioiThieu').text(user.gioiThieu || '(Chưa có giới thiệu)');
            $('#viewCompany').text(user.tenCongTy || 'Chưa cập nhật');
            // Hiển thị link (Dùng tên trường từ ProfileReponse của bạn: facebookLink, zaloLink)
            if (user.facebookLink) {
                $('#linkFacebook').attr('href', user.facebookLink).removeClass('d-none');
            } else {
                $('#linkFacebook').addClass('d-none');
            }
            
            if (user.zaloLink) {
                $('#linkZalo').attr('href', user.zaloLink).removeClass('d-none');
            } else {
                $('#linkZalo').addClass('d-none');
            }

            // Điền vào Form
            $('#editAvatarPreview').attr('src', user.anhDaiDien || 'https://placehold.co/120x120');
            $('#fullName').val(user.hoTen);
            $('#about').val(user.gioiThieu);
            $('#address').val(user.diaChi);
            $('#phone').val(user.soDienThoai);
            
            // Điền link vào input
            $('#inputFacebook').val(user.facebookLink || '');
            $('#inputZalo').val(user.zaloLink || '');
        });
    }

    // --- 2. XỬ LÝ CẬP NHẬT THÔNG TIN (SỬA TÊN BIẾN Ở ĐÂY) ---
    $('#editProfileForm').on('submit', function(e) {
        e.preventDefault();
        
        // Tạo object data (Tên trường phải khớp 100% với ProfileDTO.java)
        const data = {
            hoTen: $('#fullName').val(),
            soDienThoai: $('#phone').val(),
            diaChi: $('#address').val(),
            gioiThieu: $('#about').val(),
            
            // *** ĐÃ SỬA LẠI TÊN TRƯỜNG CHO KHỚP ***
            facebookLink: $('#inputFacebook').val(), 
            zaloLink: $('#inputZalo').val()
        };
        
        console.log("Dữ liệu gửi đi:", data); // Debug
        
        callApi(`${API_BASE}/update`, 'PUT', data).done(function(msg) {
            alert("Cập nhật thành công!"); // Backend của bạn trả về chuỗi text, không phải JSON {message: ...}
            localStorage.setItem('user_name', data.hoTen);
            location.reload(); 
        }).fail(function(err) {
            alert('Lỗi: ' + (err.responseText || 'Cập nhật thất bại'));
        });
    });

    // --- 3. XỬ LÝ ĐỔI AVATAR ---
    $('#avatarUpload').on('change', function() {
        const file = this.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            
            callApi(`${API_BASE}/avatar`, 'POST', formData, true).done(function(newUrl) {
                alert('Đổi ảnh đại diện thành công!');
                localStorage.setItem('user_avatar', newUrl);
                $('#overviewAvatar').attr('src', newUrl);
                $('#editAvatarPreview').attr('src', newUrl);
                $('#profile-image').attr('src', newUrl); 
            }).fail(function(err) {
                alert('Lỗi upload ảnh: ' + err.responseText);
            });
        }
    });

    // --- 4. XỬ LÝ ĐỔI MẬT KHẨU ---
    $('#changePasswordForm').on('submit', function(e) {
        e.preventDefault();
        const currentPass = $('#currentPassword').val();
        const newPass = $('#newPassword').val();
        const renewPass = $('#renewPassword').val();

        if (newPass !== renewPass) {
            alert('Mật khẩu mới nhập lại không khớp!');
            return;
        }

        // Tên trường phải khớp với DoiMkDTO.java
        const data = {
            matKhauHienTai: currentPass,
            matKhauMoi: newPass,
            xacNhanMatKhau: renewPass
        };

        callApi(`${API_BASE}/change-password`, 'PUT', data).done(function(msg) {
            alert("Đổi mật khẩu thành công!");
            $('#changePasswordForm')[0].reset();
        }).fail(function(err) {
            alert('Lỗi: ' + (err.responseText || 'Đổi mật khẩu thất bại'));
        });
    });

    loadProfile();
});