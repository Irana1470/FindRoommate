package com.roommate.dto;

import lombok.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

public class YeuCauDTO {
    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Integer maYeuCau;
        private Integer maNguoiDung;
        private String tenNguoiDung;
        private String avatarNguoiDung;
        private Integer maPhong;
        private String tenPhong;
        private LocalDateTime ngayYeuCau;
        private String moTa;
        private String trangThai;
    }
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TaoYeuCauRequest {
        @NotNull private Integer maPhong;
        private String moTa;
    }
}

