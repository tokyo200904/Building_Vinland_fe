// File 2: Logic của login.html (ĐÃ SỬA LỖI API ENDPOINT và LỖI ALERT)
$(document).ready(function() {
            
    // *** ĐÃ SỬA ***
    // Thêm /v1/ để khớp với `apiPrefix` và WebSecurityConfig
    const API_ENDPOINT = 'http://localhost:8081/api/dangnhap'; 

    $('#loginForm').on('submit', function(e) {
        e.preventDefault(); 

        const email = $('#email').val();
        const matKhau = $('#matKhau').val();
        
        const loginButton = $('#loginButton');
        const loginButtonText = $('#loginButtonText');
        const loginSpinner = $('#loginSpinner');
        const errorMessage = $('#errorMessage');

        $.ajax({
            url: API_ENDPOINT,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                email: email, 
                matKhau: matKhau 
            }),
            
            beforeSend: function() {
                loginButton.prop('disabled', true);
                loginButtonText.text('Đang xử lý...');
                loginSpinner.removeClass('d-none');
                errorMessage.addClass('d-none').text('');
            },
            
            // 2. Nếu thành công (LOGIC CHUYỂN HƯỚNG CỦA BẠN)
            success: function(result) {
                localStorage.setItem('access_token', result.token);
                localStorage.setItem('user_role', result.vaiTro); 
                localStorage.setItem('user_name', result.hoTen);
                if (result.anhDaiDien) { // Dùng result.
                    localStorage.setItem('user_avatar', result.anhDaiDien); // Dùng result.
                } else {
                    localStorage.removeItem('user_avatar');
                }
                const role = result.vaiTro;
                
                if (role === 'ADMIN' || role === 'AGENT' || role === 'NHANVIEN') {
                    // *** ĐÃ SỬA LỖI ALERT ***
                    alert('Đăng nhập thành công! Chào mừng ' + result.hoTen);
                    window.location.href = '/Building_web_fe/Building_list.html';
                } else {
                    alert('Đăng nhập thành công! Chào mừng ' + result.hoTen);
                    window.location.href = '/Building_web_fe/Bulding_trangchu.html';
                }
            },
            
            // 3. Nếu thất bại:
                error: function(jqXHR) {
                let msg;

                if (jqXHR.responseText) {
                    msg = jqXHR.responseText;
                } else {
                    if (jqXHR.status === 403) {
                        msg = 'Tài khoản không có quyền truy cập hoặc đã bị khóa.';
                    } else if (jqXHR.status === 401) {
                        msg = 'Sai email hoặc mật khẩu.';
                    } else {
                        msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
                    }
                }
                errorMessage.text(msg).removeClass('d-none');
            },
            
            // 4. Luôn luôn chạy:
            complete: function() {
                loginButton.prop('disabled', false);
                loginButtonText.text('Đăng Nhập');
                loginSpinner.addClass('d-none');
            }
        });
    });
});
