package com.roommate.model;

import com.roommate.persistence.EncryptedLocalDateConverter;
import com.roommate.persistence.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "XacThucDanhTinh")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class XacThucDanhTinh {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maXacThuc")
    private Integer maXacThuc;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "hoTen", length = 512)
    private String hoTen;

    @Column(name = "soCanCuocCongDanHash", length = 64, unique = true)
    private String soCanCuocCongDanHash;

    @Convert(converter = EncryptedLocalDateConverter.class)
    @Column(name = "ngaySinh", length = 128)
    private LocalDate ngaySinh;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "diaChi", length = 1024)
    private String diaChi;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "moTa", length = 2048)
    private String moTa;

    @Transient
    public String getSoCanCuocCongDan() {
        return null;
    }
}
