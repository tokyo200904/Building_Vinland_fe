        $(document).ready(function() {
            
            // API Endpoint (Khớp với `WebSecurityConfig` và `UserController` của bạn)
            const API_ENDPOINT = 'http://localhost:8081/api/dangKy'; 

            $('#registerForm').on('submit', function(e) {
                e.preventDefault(); 

                const hoTen = $('#hoTen').val();
                const email = $('#email').val();
                // *** ĐÃ XÓA TRƯỜNG SỐ ĐIỆN THOẠI ***
                // const soDienThoai = $('#soDienThoai').val(); 
                const matKhau = $('#matKhau').val();
                const matKhauXacNhan = $('#matKhauXacNhan').val();
                
                const registerButton = $('#registerButton');
                const registerButtonText = $('#registerButtonText');
                const registerSpinner = $('#registerSpinner');
                const errorMessage = $('#errorMessage');

                // Ẩn lỗi cũ
                errorMessage.addClass('d-none').text('');

                // 1. Kiểm tra mật khẩu (phía Frontend)
                if (matKhau !== matKhauXacNhan) {
                    errorMessage.text('Mật khẩu và xác nhận mật khẩu không trùng khớp.').removeClass('d-none');
                    return; // Dừng lại
                }

                $.ajax({
                    url: API_ENDPOINT,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ 
                        hoTen: hoTen,
                        email: email,
                        // *** ĐÃ XÓA TRƯỜNG SỐ ĐIỆN THOẠI ***
                        // soDienThoai: soDienThoai, 
                        matKhau: matKhau 
                        // DTO không cần 'matKhauXacNhan', Backend chỉ cần 3 trường
                    }),
                    
                    beforeSend: function() {
                        registerButton.prop('disabled', true);
                        registerButtonText.text('Đang xử lý...');
                        registerSpinner.removeClass('d-none');
                    },
                    
                    // 2. Nếu thành công:
                    success: function(responseMessage) {
                        // Backend trả về: "Đăng ký tài khoản thành công!"
                        alert(responseMessage);
                        
                        // Tự động chuyển về trang đăng nhập
                        window.location.href = '/Building_web_fe/login.html';
                    },
                    
                    // 3. Nếu thất bại:
                    error: function(jqXHR) {
                        let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
                        
                        if (jqXHR.responseJSON) {
                            if (Array.isArray(jqXHR.responseJSON)) {
                                // Nếu Backend trả về danh sách lỗi (từ BindingResult)
                                msg = jqXHR.responseJSON.join('\n');
                            } else if (jqXHR.responseJSON.message) {
                                // Nếu Backend trả về 1 lỗi (ví dụ: Email đã tồn tại)
                                msg = jqXHR.responseJSON.message;
                            }
                        } else if (jqXHR.responseText) {
                             // Đôi khi lỗi chỉ là text
                            try {
                                msg = JSON.parse(jqXHR.responseText).message || msg;
                            } catch(e) { 
                                msg = jqXHR.responseText; // Lấy text thô nếu không phải JSON
                            }
                        }
                        
                        errorMessage.text(msg).removeClass('d-none');
                    },
                    
                    // 4. Luôn luôn chạy:
                    complete: function() {
                        registerButton.prop('disabled', false);
                        registerButtonText.text('Đăng Ký');
                        registerSpinner.addClass('d-none');
                    }
                });
            });
        });