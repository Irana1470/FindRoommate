package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "BaiDang")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BaiDang {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maBaiDang") private Integer maBaiDang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDang", nullable = false)
    private NguoiDung nguoiDang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhong")
    private Phong phong;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "noiDung", columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "giaTien", precision = 18, scale = 2)
    private BigDecimal giaTien;

    @Column(name = "tinhThanh", length = 150)
    private String tinhThanh;

    @Column(name = "quanHuyen", length = 150)
    private String quanHuyen;

    @Column(name = "diaChi", length = 255)
    private String diaChi;

    @Column(name = "images", columnDefinition = "TEXT")
    private String images; // JSON array of image URLs

    @Column(name = "video", length = 500)
    private String video;

    @Column(name = "trangThai", length = 50)
    private String trangThai; // "Dang", "Da dong", "Tam dung"

    @Builder.Default
    @Column(name = "soLuotXem")
    private Integer soLuotXem = 0;

    @Builder.Default
    @Column(name = "luotDanhGia")
    private Integer luotDanhGia = 0;

    @Column(name = "ngayDang")
    private LocalDateTime ngayDang;

    @Column(name = "ngayCapNhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "ngayHetHan")
    private LocalDateTime ngayHetHan;

    @PrePersist
    protected void onCreate() { ngayDang = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { ngayCapNhat = LocalDateTime.now(); }
}
