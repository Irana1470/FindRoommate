package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "CuocGoi")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuocGoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maCuocGoi")
    private Integer maCuocGoi;

    @Column(name = "callId", nullable = false, unique = true, length = 64)
    private String callId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiGoi", nullable = false)
    private NguoiDung nguoiGoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiNhan", nullable = false)
    private NguoiDung nguoiNhan;

    @Column(name = "kieuCuocGoi", nullable = false, length = 20)
    private String kieuCuocGoi;

    @Builder.Default
    @Column(name = "trangThai", nullable = false, length = 20)
    private String trangThai = "RINGING";

    @Column(name = "batDauLuc")
    private LocalDateTime batDauLuc;

    @Column(name = "ketThucLuc")
    private LocalDateTime ketThucLuc;

    @Column(name = "thoiLuongGiay")
    private Integer thoiLuongGiay;

    @Column(name = "lyDoKetThuc", length = 50)
    private String lyDoKetThuc;

    @PrePersist
    protected void onCreate() {
        if (batDauLuc == null) {
            batDauLuc = LocalDateTime.now();
        }
    }
}
