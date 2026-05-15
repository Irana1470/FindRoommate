package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "ChiTietPhong")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(ChiTietPhong.ChiTietPhongId.class)
public class ChiTietPhong {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maPhong", nullable = false)
    private Phong phong;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiDung", nullable = false)
    private NguoiDung nguoiDung;

    @Column(name = "ngayThamGia")
    private LocalDateTime ngayThamGia;

    @PrePersist
    protected void onCreate() { ngayThamGia = LocalDateTime.now(); }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ChiTietPhongId implements Serializable {
        private Integer phong;
        private Integer nguoiDung;
    }
}
