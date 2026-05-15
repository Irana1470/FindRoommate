package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "NguoiDung")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maNguoiDung")
    private Integer maNguoiDung;

    @Column(name = "hoTen", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "Email", unique = true, length = 100)
    private String email;

    @Column(name = "soDienThoai", unique = true, length = 15)
    private String soDienThoai;

    @Column(name = "matKhau", nullable = false, length = 255)
    private String matKhau;

    @Column(name = "Avatar", columnDefinition = "TEXT")
    private String avatar;

    @Column(name = "coverPhoto", columnDefinition = "TEXT")
    private String coverPhoto;

    @Column(name = "bio", length = 500)
    private String bio;

    @Column(name = "noiSong", length = 150)
    private String noiSong;

    @Builder.Default
    @Column(name = "taiKhoanRiengTu")
    private Boolean taiKhoanRiengTu = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private VaiTro role = VaiTro.USER;

    @Builder.Default
    @Column(name = "xacThuc")
    private Boolean xacThuc = false;

    @Builder.Default
    @Column(name = "taiKhoanBiKhoa", nullable = false)
    private Boolean taiKhoanBiKhoa = false;

    @Column(name = "lyDoKhoaTaiKhoan", length = 255)
    private String lyDoKhoaTaiKhoan;

    @Column(name = "ngayTao")
    private LocalDateTime ngayTao;

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
    }

    @OneToOne(mappedBy = "nguoiDung", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private XacThucDanhTinh xacThucDanhTinh;

    @OneToOne(mappedBy = "nguoiDung", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ViTien viTien;

    @OneToMany(mappedBy = "chuPhong", fetch = FetchType.LAZY)
    private List<Phong> danhSachPhong;
}
