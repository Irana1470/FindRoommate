package com.roommate.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class BanBeDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NguoiDungTomTat {
        private Integer maNguoiDung;
        private String hoTen;
        private String email;
        private String soDienThoai;
        private String avatar;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuanHeBanBeResponse {
        private Integer maBanBe;
        private String trangThai;
        private Boolean laBanBe;
        private Boolean coTheChapNhan;
        private NguoiDungTomTat nguoiGui;
        private NguoiDungTomTat nguoiNhan;
        private LocalDateTime ngayTao;
        private LocalDateTime ngayCapNhat;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DanhSachBanBeResponse {
        private List<NguoiDungTomTat> banBe;
        private List<QuanHeBanBeResponse> loiMoiDaNhan;
        private List<QuanHeBanBeResponse> loiMoiDaGui;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuiLoiMoiRequest {
        @NotNull
        private Integer maNguoiDung;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhanHoiLoiMoiRequest {
        @NotNull
        private Boolean chapNhan;
    }
}
