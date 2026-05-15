package com.roommate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class ThongKeDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrangChuResponse {
        private long tongNguoiDung;
        private long tongPhongSanSang;
        private long tongBaiDangDangHienThi;
        private long tongTaiKhoanXacThuc;
    }
}
