package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "HoaDon")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class HoaDon {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maHoaDon") private Integer maHoaDon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhong", nullable = false)
    private Phong phong;

    @Column(name = "tongTien", precision = 18, scale = 2)
    private BigDecimal tongTien;

    @Column(name = "tienPhong", precision = 18, scale = 2)
    private BigDecimal tienPhong;

    @Column(name = "tienDichVu", precision = 18, scale = 2)
    private BigDecimal tienDichVu;

    @Column(name = "tienDien", precision = 18, scale = 2)
    private BigDecimal tienDien;

    @Column(name = "tienNuoc", precision = 18, scale = 2)
    private BigDecimal tienNuoc;

    @Column(name = "giaDien", precision = 18, scale = 2)
    private BigDecimal giaDien;

    @Column(name = "soDien", precision = 18, scale = 2)
    private BigDecimal soDien;

    @Column(name = "giaNuoc", precision = 18, scale = 2)
    private BigDecimal giaNuoc;

    @Column(name = "soNuoc", precision = 18, scale = 2)
    private BigDecimal soNuoc;

    @Column(name = "kieuTinhTienNuoc", length = 20)
    private String kieuTinhTienNuoc;

    @Column(name = "phuongThucThanhToan", length = 50)
    private String phuongThucThanhToan;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;

    @Column(name = "ngayThanhToan")
    private LocalDateTime ngayThanhToan;

    @Column(name = "trangThai", length = 50)
    private String trangThai; // "Da thanh toan", "Chua thanh toan"

    @Builder.Default
    @Column(name = "daAnKhoiNguoiThue", nullable = false)
    private Boolean daAnKhoiNguoiThue = false;

    @OneToMany(mappedBy = "hoaDon", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ChiTietHoaDon> chiTietHoaDons;

    @PrePersist
    protected void onCreate() { ngayTao = LocalDateTime.now(); }
}
