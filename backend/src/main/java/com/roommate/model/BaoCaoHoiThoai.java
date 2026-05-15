package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "BaoCaoHoiThoai")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BaoCaoHoiThoai {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maBaoCao")
    private Integer maBaoCao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiBaoCao", nullable = false)
    private NguoiDung nguoiBaoCao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiBiBaoCao", nullable = false)
    private NguoiDung nguoiBiBaoCao;

    @Column(name = "conversationId", nullable = false, length = 64)
    private String conversationId;

    @Column(name = "lyDo", nullable = false, length = 120)
    private String lyDo;

    @Column(name = "chiTiet", columnDefinition = "TEXT")
    private String chiTiet;

    @Column(name = "trangThai", nullable = false, length = 30)
    private String trangThai;

    @Column(name = "ghiChuXuLy", length = 255)
    private String ghiChuXuLy;

    @Column(name = "tinNhanGanNhat", columnDefinition = "TEXT")
    private String tinNhanGanNhat;

    @Column(name = "ngayTao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngayCapNhat")
    private LocalDateTime ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        ngayTao = now;
        ngayCapNhat = now;
        if (trangThai == null || trangThai.isBlank()) {
            trangThai = "NEW";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }
}
