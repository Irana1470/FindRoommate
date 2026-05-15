package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "Phong")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Phong {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maPhong") private Integer maPhong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maChuPhong", nullable = false)
    private NguoiDung chuPhong;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhongCha")
    private Phong phongCha;

    @OneToMany(mappedBy = "phongCha", fetch = FetchType.LAZY)
    private List<Phong> danhSachPhongCon;

    @Column(name = "Title", nullable = false, length = 255)
    private String title;

    @Column(name = "giaTien", precision = 18, scale = 2)
    private BigDecimal giaTien;

    @Column(name = "tienDichVu", precision = 18, scale = 2)
    private BigDecimal tienDichVu;

    @Column(name = "tienDien", precision = 18, scale = 2)
    private BigDecimal tienDien;

    @Column(name = "tienNuoc", precision = 18, scale = 2)
    private BigDecimal tienNuoc;

    @Column(name = "soNguoiToiDa")
    private Integer soNguoiToiDa;

    @Builder.Default
    @Column(name = "soNguoiHienTai")
    private Integer soNguoiHienTai = 0;

    @Column(name = "tinhThanh", length = 150)
    private String tinhThanh;

    @Column(name = "quanHuyen", length = 150)
    private String quanHuyen;

    @Column(name = "diaChi", length = 255)
    private String diaChi;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "trangThai", length = 50)
    private String trangThai; // "San sang", "Da day", "Bao tri"

    @OneToMany(mappedBy = "phong", fetch = FetchType.LAZY)
    private List<ChiTietPhong> danhSachThanhVien;
}
