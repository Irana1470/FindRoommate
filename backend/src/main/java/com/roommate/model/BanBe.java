package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "BanBe")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanBe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maBanBe")
    private Integer maBanBe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiGui", nullable = false)
    private NguoiDung nguoiGui;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiNhan", nullable = false)
    private NguoiDung nguoiNhan;

    @Column(name = "trangThai", nullable = false, length = 20)
    private String trangThai;

    @Column(name = "ngayTao", nullable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngayCapNhat")
    private LocalDateTime ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
        ngayCapNhat = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }
}
