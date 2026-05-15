package com.roommate.model;

import com.roommate.persistence.EncryptedLocalDateConverter;
import com.roommate.persistence.EncryptedStringConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "PhieuTamTru")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhieuTamTru {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maPhieuTamTru")
    private Integer maPhieuTamTru;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhong")
    private Phong phong;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "coQuanDangKy", length = 1024)
    private String coQuanDangKy;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "hoTen", length = 512)
    private String hoTen;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "gioiTinh", length = 255)
    private String gioiTinh;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "soCanCuocCongDan", length = 512)
    private String soCanCuocCongDan;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "soDienThoai", length = 255)
    private String soDienThoai;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "email", length = 512)
    private String email;

    @Convert(converter = EncryptedLocalDateConverter.class)
    @Column(name = "ngaySinh", length = 128)
    private LocalDate ngaySinh;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "tenChuHo", length = 512)
    private String tenChuHo;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "quanHeVoiChuHo", length = 512)
    private String quanHeVoiChuHo;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "soDinhDanhChuHo", length = 512)
    private String soDinhDanhChuHo;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "diaChiThuongTru", length = 1024)
    private String diaChiThuongTru;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "diaChiTamTru", length = 1024)
    private String diaChiTamTru;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "noiDungDeNghi", length = 2048)
    private String noiDungDeNghi;

    @Convert(converter = EncryptedLocalDateConverter.class)
    @Column(name = "ngayBatDau", length = 128)
    private LocalDate ngayBatDau;
}
