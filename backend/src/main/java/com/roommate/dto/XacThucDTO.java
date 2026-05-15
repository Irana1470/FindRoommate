package com.roommate.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class XacThucDTO {
    private String hoTen;
    private String ngaySinh;
    private String diaChi;
    private Boolean xacThucThanhCong;
    private String thongBao;
}
