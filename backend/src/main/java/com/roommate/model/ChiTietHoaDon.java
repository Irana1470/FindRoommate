package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ChiTietHoaDon")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ChiTietHoaDon {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maChiTietHoaDon") private Integer maChiTietHoaDon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maHoaDon", nullable = false)
    private HoaDon hoaDon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maDichVu", nullable = false)
    private DichVu dichVu;

    @Column(name = "soLuongSuDung") private Integer soLuongSuDung;
    @Column(name = "thanhTien", precision = 18, scale = 2) private BigDecimal thanhTien;
}
