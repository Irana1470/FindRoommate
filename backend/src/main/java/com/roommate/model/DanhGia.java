package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "DanhGia")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DanhGia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maDanhGia")
    private Integer maDanhGia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDanhGia", nullable = false)
    private NguoiDung nguoiDanhGia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maHoaDon")
    private HoaDon hoaDon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDuocDanhGia")
    private NguoiDung nguoiDuocDanhGia;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "soSao")
    @jakarta.validation.constraints.Min(1)
    @jakarta.validation.constraints.Max(5)
    private Integer soSao;

    @Column(name = "ngayDanhGia")
    private LocalDateTime ngayDanhGia;

    @PrePersist
    protected void onCreate() {
        ngayDanhGia = LocalDateTime.now();
    }
}
