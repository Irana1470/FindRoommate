package com.roommate.dto;

import lombok.*;
import jakarta.validation.constraints.*;

// ===== AUTH DTOs =====
public class AuthDTO {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DangKyRequest {
        @NotBlank(message = "Ho ten khong duoc de trong")
        @Size(min = 2, max = 100, message = "Ho ten phai tu 2 den 100 ky tu")
        private String hoTen;

        @Email(message = "Email khong hop le")
        @NotBlank(message = "Email khong duoc de trong")
        private String email;

        @NotBlank(message = "So dien thoai khong duoc de trong")
        @Pattern(regexp = "^[0-9]{10,11}$", message = "So dien thoai phai gom 10 hoac 11 chu so")
        private String soDienThoai;

        @NotBlank(message = "Mat khau khong duoc de trong")
        @Size(min = 6, message = "Mat khau phai co it nhat 6 ky tu")
        private String matKhau;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DangNhapRequest {
        @NotBlank(message = "Email khong duoc de trong")
        private String email;

        @NotBlank(message = "Mat khau khong duoc de trong")
        private String matKhau;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String token;
        private String loaiToken;
        private Integer maNguoiDung;
        private String hoTen;
        private String email;
        private String role;
        private Boolean xacThuc;
        private Boolean taiKhoanBiKhoa;
    }
}
