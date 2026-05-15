package com.roommate.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "TinNhan")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TinNhan {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maTinNhan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiGui")
    private NguoiDung nguoiGui;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maNguoiNhan")
    private NguoiDung nguoiNhan;

    @Column(name = "conversationId", length = 64)
    private String conversationId;

    @Builder.Default
    @Column(name = "loaiTinNhan", length = 30, nullable = false)
    private String loaiTinNhan = "TEXT";

    @Column(columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "tepUrl", length = 500)
    private String tepUrl;

    @Column(name = "tepTenGoc", length = 255)
    private String tepTenGoc;

    @Column(name = "tepMimeType", length = 120)
    private String tepMimeType;

    @Column(name = "tepKichThuoc")
    private Long tepKichThuoc;

    @Builder.Default
    @Column(name = "trangThai", length = 20, nullable = false)
    private String trangThai = "SENT";

    @Builder.Default
    @Column(name = "daThuHoi", nullable = false)
    private Boolean daThuHoi = false;

    @Builder.Default
    @Column(name = "daXoaBoiNguoiGui", nullable = false)
    private Boolean daXoaBoiNguoiGui = false;

    @Builder.Default
    @Column(name = "daChinhSua", nullable = false)
    private Boolean daChinhSua = false;

    @Column(name = "thoiGianGui")
    private LocalDateTime thoiGian;

    @Column(name = "thoiGianCapNhat")
    private LocalDateTime thoiGianCapNhat;

    @Column(name = "thoiGianDaNhan")
    private LocalDateTime thoiGianDaNhan;

    @Column(name = "thoiGianDaXem")
    private LocalDateTime thoiGianDaXem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maTinNhanTraLoi")
    private TinNhan tinNhanTraLoi;

    @Column(name = "deliveredToJson", columnDefinition = "TEXT")
    private String deliveredToJson;

    @Column(name = "seenByJson", columnDefinition = "TEXT")
    private String seenByJson;

    @Column(name = "hiddenByJson", columnDefinition = "TEXT")
    private String hiddenByJson;

    @Column(name = "reactionsJson", columnDefinition = "TEXT")
    private String reactionsJson;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        thoiGian = now;
        thoiGianCapNhat = now;
    }

    @PreUpdate
    protected void onUpdate() {
        thoiGianCapNhat = LocalDateTime.now();
    }
}
