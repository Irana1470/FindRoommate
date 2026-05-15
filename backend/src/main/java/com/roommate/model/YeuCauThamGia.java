package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "YeuCauThamGia")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class YeuCauThamGia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maYeuCau") private Integer maYeuCau;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhong", nullable = false)
    private Phong phong;

    @Column(name = "ngayYeuCau")
    private LocalDateTime ngayYeuCau;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "trangThai", length = 50)
    private String trangThai; // "Cho duyet", "Chap nhan", "Tu choi"

    @PrePersist
    protected void onCreate() { ngayYeuCau = LocalDateTime.now(); }
}
