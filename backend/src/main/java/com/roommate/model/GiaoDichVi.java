package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "GiaoDichVi")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GiaoDichVi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maGiaoDich")
    private Integer maGiaoDich;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maVi", nullable = false)
    private ViTien viTien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maHoaDon")
    private HoaDon hoaDon;

    @Column(name = "loai", length = 50, nullable = false)
    private String loai;

    @Column(name = "chieu", length = 10, nullable = false)
    private String chieu;

    @Column(name = "soTien", precision = 18, scale = 2, nullable = false)
    private BigDecimal soTien;

    @Column(name = "soDuSauGiaoDich", precision = 18, scale = 2, nullable = false)
    private BigDecimal soDuSauGiaoDich;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "ngayTao", nullable = false)
    private LocalDateTime ngayTao;

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
    }
}
